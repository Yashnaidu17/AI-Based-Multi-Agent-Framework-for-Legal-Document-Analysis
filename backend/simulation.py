import os
import json
from typing import Dict, Any
from agents import judge_agent, prosecutor_agent, defense_agent, evidence_analyst_agent
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")

async def run_what_if_simulation(case_text: str, modifications: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run the multi-agent reasoning system dynamically with modified variables.
    """
    # Create modified case text prompt incorporating user modifications
    added_evidence = modifications.get("added_evidence", "")
    removed_evidence = modifications.get("removed_evidence", "")
    evidence_strength = modifications.get("evidence_strength", 50)
    witness_reliability = modifications.get("witness_reliability", 50)
    
    modified_prompt = f"""
ORIGINAL CASE:
{case_text[:1500]}

MODIFICATIONS APPLIED BY USER FOR SIMULATION:
- New Evidence Introduced: {added_evidence if added_evidence else 'None'}
- Evidence Excluded: {removed_evidence if removed_evidence else 'None'}
- Overall Evidence Strength Level: {evidence_strength}/100
- Witness Reliability Level: {witness_reliability}/100

Re-evaluate the case strictly considering these modifications.
"""
    
    prosecutor_task = prosecutor_agent(modified_prompt, "Simulation run")
    defense_task = defense_agent(modified_prompt, "Simulation run")
    evidence_task = evidence_analyst_agent(modified_prompt, "Simulation run")

    import asyncio
    prosecutor_arg, defense_arg, evidence_arg = await asyncio.gather(
        prosecutor_task, defense_task, evidence_task
    )

    judge_result = await judge_agent(modified_prompt, prosecutor_arg, defense_arg, evidence_arg)

    return {
        "modified_agents": {
            "prosecutor": prosecutor_arg,
            "defense": defense_arg,
            "evidence_analyst": evidence_arg
        },
        "new_verdict": judge_result.get("final_verdict", "Unable to determine"),
        "new_confidence": judge_result.get("confidence_score", 0.5),
        "new_reasoning": judge_result.get("reasoning", "")
    }
