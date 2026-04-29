"""
Document analysis module using LLM + Indian Kanoon precedent enrichment
"""

import os
import json
import asyncio
from typing import Dict, Any, List
import aiohttp
from dotenv import load_dotenv
from indiankanoon import find_precedents_for_ipc, format_precedents_for_prompt

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")

async def analyze_document_content(pdf_text: str) -> Dict[str, Any]:
    """
    Analyze legal document using LLM + Indian Kanoon precedent enrichment.
    Extracts case facts, IPC sections, evidence analysis, etc.
    """

    # ── Step 1: Quick IPC extraction to drive IK search ──────────────────────
    quick_ipc = await extract_ipc_sections(pdf_text)

    # ── Step 2: Fetch real precedents from Indian Kanoon ─────────────────────
    precedents: List[Dict[str, Any]] = []
    try:
        precedents = await find_precedents_for_ipc(quick_ipc, pdf_text[:500])
    except Exception as _ik_err:
        print(f"[IK] Precedent fetch failed (non-fatal): {_ik_err}")

    precedents_text = format_precedents_for_prompt(precedents)

    if not OPENAI_API_KEY:
        # Return mock response if no API key
        mock = get_mock_analysis()
        mock["precedents"] = precedents
        return mock

    prompt = f"""You are a legal AI assistant analyzing Indian criminal judgments.

Analyze the following legal document and extract:
1. Case facts - Brief summary of case
2. IPC sections - List of applicable Indian Penal Code sections
3. Evidence analysis - What evidence was presented
4. Mens rea analysis - Analysis of criminal intent
5. Procedural issues - Any procedural concerns
6. Legal reasoning - Key legal arguments (reference the precedents below where relevant)
7. Verdict - Conviction or Acquittal
8. Court sustainability - Whether the case outcome would be sustained at Supreme Court, High Court, and Lower Court level, with reasons
9. Victim reasoning - Why the victim (complainant) is likely to win or lose this case

Relevant Precedents from Indian Kanoon:
{precedents_text}

Document:
{pdf_text[:3000]}

Please respond in JSON format with these exact keys:
{{
    "case_facts": "...",
    "ipc_sections": ["420", "468"],
    "evidence_analysis": "...",
    "mens_rea_analysis": "...",
    "procedural_issues": "...",
    "legal_reasoning": "...",
    "verdict": "Conviction" or "Acquittal",
    "court_sustainability": {{
        "supreme_court": {{"sustainable": "YES" or "NO", "reason": "..."}},
        "high_court": {{"sustainable": "YES" or "NO", "reason": "..."}},
        "lower_court": {{"sustainable": "YES" or "NO", "reason": "..."}}
    }},
    "victim_reasoning": "Detailed explanation of why the victim will win or lose",
    "additional_ipc_on_appeal": [
        {{"section": "120B", "title": "Criminal Conspiracy", "reason": "Why this section could strengthen the case on appeal"}}
    ]
}}"""
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": "You are a legal document analyst."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 1500
            }
            
            async with session.post(
                f"{OPENAI_API_BASE}/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    response_text = data["choices"][0]["message"]["content"]
                else:
                    print(f"API Error: {await resp.text()}")
                    mock = get_mock_analysis()
                    mock["precedents"] = precedents
                    return mock
        
        # Extract JSON from response
        try:
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                result = json.loads(json_str)
                result["precedents"] = precedents
                return result
        except:
            pass

        mock = get_mock_analysis()
        mock["precedents"] = precedents
        return mock

    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        mock = get_mock_analysis()
        mock["precedents"] = precedents
        return mock

def get_mock_analysis() -> Dict[str, Any]:
    """Return mock analysis for testing"""
    return {
        "case_facts": "A case involving fraud and forgery charges. The accused is alleged to have forged documents to unlawfully obtain financial benefits.",
        "ipc_sections": ["420", "468", "471"],
        "evidence_analysis": "Documentary evidence includes bank statements, forged certificates, and witness testimonies. The evidence chain appears consistent but raises questions about verification protocols.",
        "mens_rea_analysis": "The accused's knowledge and intention appear evident from the systematic nature of forgeries and financial transactions.",
        "procedural_issues": "Minor procedural delays noted in evidence collection. Chain of custody properly maintained.",
        "legal_reasoning": "The court found sufficient evidence of deliberate fraud with clear mens rea. Conviction appears legally sustainable.",
        "verdict": "Conviction Sustainable: YES",
        "court_sustainability": {
            "supreme_court": {
                "sustainable": "YES",
                "reason": "The evidence meets the stringent constitutional standard. No fundamental rights violations identified. The Supreme Court would uphold the conviction given clear proof of fraud beyond reasonable doubt."
            },
            "high_court": {
                "sustainable": "YES",
                "reason": "High Court appellate review would find the lower court's assessment of evidence and application of IPC Sections 420, 468, and 471 correct. Procedural adherence is satisfactory."
            },
            "lower_court": {
                "sustainable": "YES",
                "reason": "Sessions/Magistrate Court has jurisdiction and sufficient evidence for conviction. The trial court findings on witness credibility and documentary evidence are well-supported."
            }
        },
        "victim_reasoning": "The victim (complainant) is LIKELY TO WIN this case. The prosecution's evidence is strong with multiple corroborating documents and consistent witness testimony. The accused's deliberate pattern of forging financial documents directly establishes fraudulent intent (mens rea) under IPC Section 420. The victim suffered direct financial harm, creating a clear causal link. If the victim engages skilled legal counsel and ensures all documentary evidence is properly authenticated, the probability of securing a conviction is high. Key advantage: systematic nature of fraud makes it difficult for the defense to argue a lack of intent.",
        "additional_ipc_on_appeal": [
            {
                "section": "120B",
                "title": "Criminal Conspiracy",
                "reason": "If multiple persons were involved in the forgery scheme, Section 120B (Criminal Conspiracy) can be invoked on appeal to strengthen the case, as it carries heavier penalties and supports the systemic nature of the fraud."
            },
            {
                "section": "409",
                "title": "Criminal Breach of Trust by Public Servant",
                "reason": "If the accused held any fiduciary or public position, Section 409 can be applied on appeal to a High Court, attracting stricter punishment for breach of public trust."
            },
            {
                "section": "477A",
                "title": "Falsification of Accounts",
                "reason": "Since financial records were altered, Section 477A (Falsification of Accounts) is a strong supplementary charge that can be raised before a higher court to establish a broader pattern of financial misconduct."
            }
        ]
    }

async def extract_ipc_sections(pdf_text: str) -> list:
    """Extract IPC section numbers from document"""
    ipc_numbers = []
    words = pdf_text.split()
    
    for i, word in enumerate(words):
        # Look for patterns like "Section 420" or "420 IPC"
        if word.startswith("Section") and i + 1 < len(words):
            next_word = words[i + 1].strip('.,')
            if next_word.isdigit():
                ipc_numbers.append(next_word)
        elif word.isdigit() and i + 1 < len(words):
            next_word = words[i + 1].lower()
            if "ipc" in next_word:
                ipc_numbers.append(word)
    
    return list(set(ipc_numbers))
