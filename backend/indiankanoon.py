"""
Indian Kanoon API Client
Provides search, document retrieval, fragment, and metadata endpoints.
Authentication: Token-based (Authorization: Token <token>)
"""

import os
import asyncio
import aiohttp
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

IK_API_BASE = "https://api.indiankanoon.org"
IK_API_TOKEN = os.getenv("INDIANKANOON_API_TOKEN", "d6563010e84e819d3d57a957f8bdf37f2083a2df")

# ── shared session helper ─────────────────────────────────────────────────────

def _ik_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Token {IK_API_TOKEN}",
        "Accept": "application/json",
    }


async def _post(path: str, data: Dict[str, Any]) -> Optional[Dict]:
    """Generic POST helper to Indian Kanoon API."""
    url = f"{IK_API_BASE}{path}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers=_ik_headers(),
                data=data,                        # IK uses form-encoded POST
                timeout=aiohttp.ClientTimeout(total=20),
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
                else:
                    body = await resp.text()
                    print(f"[IK] {path} returned {resp.status}: {body[:200]}")
                    return None
    except Exception as exc:
        print(f"[IK] Error calling {path}: {exc}")
        return None


# ── Public API methods ────────────────────────────────────────────────────────

async def search_cases(
    query: str,
    doctypes: str = "",
    fromdate: str = "",
    todate: str = "",
    title: str = "",
    pagenum: int = 0,
) -> Dict[str, Any]:
    """
    Search Indian Kanoon for cases matching *query*.
    Returns the raw JSON response (fields: found, docs, categories, ...).
    """
    payload: Dict[str, Any] = {"formInput": query, "pagenum": pagenum}
    if doctypes:
        payload["doctypes"] = doctypes
    if fromdate:
        payload["fromdate"] = fromdate
    if todate:
        payload["todate"] = todate
    if title:
        payload["title"] = title

    result = await _post("/search/", payload)
    return result or {"found": 0, "docs": [], "categories": []}


async def get_document(tid: str, maxcites: int = 5, maxcitedby: int = 5) -> Dict[str, Any]:
    """
    Fetch the full document (enriched HTML + metadata) for a given tid.
    """
    payload = {"maxcites": maxcites, "maxcitedby": maxcitedby}
    result = await _post(f"/doc/{tid}/", payload)
    return result or {}


async def get_doc_fragment(tid: str, query: str) -> Dict[str, Any]:
    """
    Fetch highlighted text fragments of a document that match *query*.
    """
    payload = {"formInput": query}
    result = await _post(f"/docfragment/{tid}/", payload)
    return result or {}


async def get_doc_meta(tid: str) -> Dict[str, Any]:
    """
    Fetch lightweight metadata for a document (no full text).
    """
    result = await _post(f"/docmeta/{tid}/", {})
    return result or {}


# ── High-level helper ─────────────────────────────────────────────────────────

async def find_precedents_for_ipc(
    ipc_sections: List[str],
    case_text: str,
    max_results: int = 5,
) -> List[Dict[str, Any]]:
    """
    Given a list of IPC section numbers and a case text snippet, search Indian
    Kanoon for the most relevant precedents and return a compact list suitable
    for injection into LLM prompts.

    Each result dict contains:
      tid, title, docsource, publishdate, headline, docsize
    """
    # Build a focused query from IPC sections + key nouns from the case text
    ipc_query = " ORR ".join(f"section {s} IPC" for s in ipc_sections[:4]) if ipc_sections else ""
    # Grab a few meaningful words from the case text as additional context
    words = [w for w in case_text.split() if len(w) > 5][:20]
    context_query = " ".join(words[:10])
    query = f"{ipc_query} {context_query}".strip() or "criminal case India"

    # Run two searches in parallel: one general, one Supreme Court only
    general_task = search_cases(query, pagenum=0)
    sc_task = search_cases(query, doctypes="supremecourt", pagenum=0)

    general_result, sc_result = await asyncio.gather(general_task, sc_task)

    # Merge and de-duplicate by tid
    seen_tids = set()
    merged: List[Dict[str, Any]] = []

    for doc in (sc_result.get("docs", []) + general_result.get("docs", [])):
        tid = str(doc.get("tid", ""))
        if tid and tid not in seen_tids:
            seen_tids.add(tid)
            merged.append({
                "tid": tid,
                "title": doc.get("title", "Unknown"),
                "docsource": doc.get("docsource", ""),
                "publishdate": doc.get("publishdate", ""),
                "headline": doc.get("headline", ""),
                "docsize": doc.get("docsize", 0),
            })
        if len(merged) >= max_results:
            break

    return merged


def format_precedents_for_prompt(precedents: List[Dict[str, Any]]) -> str:
    """
    Convert precedent list into a concise string block for LLM injection.
    """
    if not precedents:
        return "No precedents retrieved."
    lines = []
    for i, p in enumerate(precedents, 1):
        lines.append(
            f"{i}. [{p['docsource']}] {p['title']} ({p['publishdate']})\n"
            f"   Snippet: {p['headline'][:300]}"
        )
    return "\n".join(lines)
