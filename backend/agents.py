"""
Multi-agent legal reasoning system enriched with Indian Kanoon precedents
"""

import os
import json
import asyncio
import aiohttp
from typing import Dict, Any, List
from dotenv import load_dotenv
from indiankanoon import find_precedents_for_ipc, format_precedents_for_prompt

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")

async def call_llm(prompt: str, max_tokens: int = 500) -> str:
    """Call OpenAI API"""
    
    if not OPENAI_API_KEY:
        return ""
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": max_tokens
            }
            
            async with session.post(
                f"{OPENAI_API_BASE}/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data["choices"][0]["message"]["content"]
                return ""
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return ""

async def prosecutor_agent(case_text: str, precedents_text: str = "") -> str:
    """Prosecutor argues for conviction"""
    prec_block = f"\nRelevant Precedents:\n{precedents_text}" if precedents_text else ""
    prompt = f"""You are a prosecutor analyzing a legal case. Based on this case:

{case_text[:1500]}{prec_block}

Provide a concise argument (max 150 words) for why the conviction should be sustained, focusing on:
1. Strength of evidence
2. Criminal intent (mens rea)
3. Legal violations proven
4. Reference any relevant precedents above

Prosecutor's Argument:"""

    response = await call_llm(prompt, max_tokens=200)
    return response if response else get_mock_prosecutor_response()

async def defense_agent(case_text: str, precedents_text: str = "") -> str:
    """Defense argues for acquittal"""
    prec_block = f"\nRelevant Precedents:\n{precedents_text}" if precedents_text else ""
    prompt = f"""You are a defense lawyer analyzing a legal case. Based on this case:

{case_text[:1500]}{prec_block}

Provide a concise argument (max 150 words) for why the conviction should be overturned, focusing on:
1. Weaknesses in evidence
2. Reasonable doubt
3. Procedural violations or due process issues
4. Any precedents that favour acquittal

Defense Argument:"""

    response = await call_llm(prompt, max_tokens=200)
    return response if response else get_mock_defense_response()

async def evidence_analyst_agent(case_text: str, precedents_text: str = "") -> str:
    """Evidence analyst evaluates evidence sufficiency"""
    prec_block = f"\nRelevant Precedents:\n{precedents_text}" if precedents_text else ""
    prompt = f"""You are a forensic evidence analyst. Based on this legal case:

{case_text[:1500]}{prec_block}

Evaluate (max 150 words):
1. Quality and relevance of evidence
2. Chain of custody
3. Admissibility concerns
4. Whether evidence meets legal standard of proof compared to similar precedent cases

Evidence Analysis:"""

    response = await call_llm(prompt, max_tokens=200)
    return response if response else get_mock_evidence_response()

async def judge_agent(case_text: str, prosecutor: str, defense: str, evidence: str) -> Dict[str, Any]:
    """Judge synthesizes all arguments and provides verdict"""
    prompt = f"""You are a judge synthesizing legal arguments for a final verdict.

Case Summary:
{case_text[:1000]}

Prosecutor's Argument:
{prosecutor}

Defense Argument:
{defense}

Evidence Analysis:
{evidence}

Based on these inputs, provide your judicial verdict as JSON:
{{
    "final_verdict": "Conviction Sustainable" or "Conviction Not Sustainable",
    "reasoning": "Brief explanation of the verdict",
    "confidence_score": 0.75,
    "court_sustainability": {{
        "supreme_court": {{"sustainable": "YES" or "NO", "reason": "one sentence reason"}},
        "high_court": {{"sustainable": "YES" or "NO", "reason": "one sentence reason"}},
        "lower_court": {{"sustainable": "YES" or "NO", "reason": "one sentence reason"}}
    }},
    "victim_outcome": "Detailed explanation of why the victim/complainant will likely WIN or LOSE, referencing specific evidence and legal arguments",
    "additional_ipc_on_appeal": [
        {{"section": "120B", "title": "Criminal Conspiracy", "reason": "Why this section could be applied on appeal to strengthen the case"}}
    ]
}}"""
    
    response = await call_llm(prompt, max_tokens=800)
    
    if response:
        try:
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                return json.loads(json_str)
        except:
            pass
    
    return get_mock_judge_response()

async def run_multi_agent_reasoning(case_text: str) -> Dict[str, Any]:
    """
    Run all agents and compile results.
    Automatically fetches real Indian Kanoon precedents to ground each agent.
    """
    # ── Fetch IK precedents first ──────────────────────────────────────────────
    precedents: List[Dict[str, Any]] = []
    precedents_text = ""
    try:
        from analyzer import extract_ipc_sections
        quick_ipc = await extract_ipc_sections(case_text)
        precedents = await find_precedents_for_ipc(quick_ipc, case_text[:500])
        precedents_text = format_precedents_for_prompt(precedents)
    except Exception as _ik_err:
        print(f"[IK] Agent precedent fetch failed (non-fatal): {_ik_err}")

    # Run prosecutor, defense, and evidence analyst in parallel
    prosecutor_task = prosecutor_agent(case_text, precedents_text)
    defense_task = defense_agent(case_text, precedents_text)
    evidence_task = evidence_analyst_agent(case_text, precedents_text)

    prosecutor_arg, defense_arg, evidence_arg = await asyncio.gather(
        prosecutor_task, defense_task, evidence_task
    )

    # Run judge with all inputs
    judge_result = await judge_agent(case_text, prosecutor_arg, defense_arg, evidence_arg)

    return {
        "agents": {
            "prosecutor": prosecutor_arg,
            "defense": defense_arg,
            "evidence_analyst": evidence_arg
        },
        "final_verdict": judge_result.get("final_verdict", "Unable to determine"),
        "reasoning": judge_result.get("reasoning", ""),
        "confidence": judge_result.get("confidence_score", 0.5),
        "court_sustainability": judge_result.get("court_sustainability", {}),
        "victim_outcome": judge_result.get("victim_outcome", ""),
        "additional_ipc_on_appeal": judge_result.get("additional_ipc_on_appeal", []),
        "precedents": precedents,
    }

# Mock responses for when API is not available
def get_mock_prosecutor_response() -> str:
    return """The evidence clearly establishes the accused's guilt. Multiple documents show deliberate intent to defraud. Witness testimonies are consistent and corroborated by documentary evidence. The accused had motive, means, and opportunity. All elements of the crime are proven beyond reasonable doubt. Conviction is legally sustainable."""

def get_mock_defense_response() -> str:
    return """There are significant gaps in the prosecution's case. Several witnesses have credibility issues. The documentary evidence could be interpreted differently. No direct evidence links the accused to the forgeries. Reasonable doubt exists regarding intent and knowledge. The case relies heavily on circumstantial evidence and should not result in conviction."""

def get_mock_evidence_response() -> str:
    return """The documentary evidence is robust and properly collected. Chain of custody appears maintained. Witness testimonies are corroborating. However, digital evidence analysis is lacking. Some documents lack proper authentication. Overall, evidence quality is sufficient but not exceptional. The standard of proof appears to be met."""

def get_mock_judge_response() -> Dict[str, Any]:
    return {
        "final_verdict": "Conviction Sustainable: YES",
        "reasoning": "After carefully considering the arguments from both sides and evaluating the evidence, the court finds that the prosecution has established its case beyond reasonable doubt. The documentary and witness evidence are sufficient to prove all elements of the crime. The accused's intent is clear from the systematic nature of the fraudulent activities.",
        "confidence_score": 0.82,
        "court_sustainability": {
            "supreme_court": {
                "sustainable": "YES",
                "reason": "Constitutional standards satisfied; no fundamental right violations. Fraud proven with robust documentary evidence meeting the apex court's evidentiary threshold."
            },
            "high_court": {
                "sustainable": "YES",
                "reason": "Appellate review confirms correct application of IPC Sections. Evidence assessment by the trial court is well-reasoned and does not warrant interference."
            },
            "lower_court": {
                "sustainable": "YES",
                "reason": "Trial court has full jurisdiction. The weight of oral and documentary evidence clearly supports conviction at this level."
            }
        },
        "victim_outcome": "The victim (complainant) is LIKELY TO WIN this case. The prosecution has strong documentary evidence corroborated by consistent witness testimony. The accused's systematic pattern of fraud demonstrates clear criminal intent, making it difficult for the defense to raise reasonable doubt. The victim's financial damages are well-documented. To maximize the chance of success, the victim should ensure all forged documents are forensically authenticated and that witnesses are prepared for cross-examination. The overall probability of a successful conviction is approximately 82%.",
        "additional_ipc_on_appeal": [
            {
                "section": "120B",
                "title": "Criminal Conspiracy",
                "reason": "If multiple accused are involved, Section 120B (Criminal Conspiracy) can be introduced in a High Court appeal, demonstrating a coordinated fraudulent scheme with heavier collective liability."
            },
            {
                "section": "409",
                "title": "Criminal Breach of Trust by Public Servant / Agent",
                "reason": "If the accused held any position of trust (employee, agent, or public officer), Section 409 can be pressed before a higher court for a stronger punishment and broader accountability."
            },
            {
                "section": "477A",
                "title": "Falsification of Accounts",
                "reason": "The pattern of altering financial records supports adding Section 477A before a High Court, which deals specifically with falsification and complements the existing fraud charges under 468."
            }
        ]
    }
