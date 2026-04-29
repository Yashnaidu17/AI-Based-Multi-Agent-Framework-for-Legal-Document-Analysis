import os
import json
from typing import Dict, Any
import aiohttp

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")

async def generate_argument_graph(case_text: str) -> Dict[str, Any]:
    """
    Generate nodes and edges for an argument graph based on case facts.
    """
    if not OPENAI_API_KEY:
        return get_mock_graph()
        
    prompt = f"""You are an expert legal knowledge engineer. Analyze the following legal case and convert its reasoning into an argument graph.
Extract the main Claims, Evidence, and Legal Arguments as Nodes.
Establish the relationships as Edges (either 'supports' or 'contradicts').

Case:
{case_text[:3000]}

Respond STRICTLY with a valid JSON object in the following format, with no other text:
{{
  "nodes": [
    {{"id": "n1", "label": "Claim: Accused committed fraud", "type": "claim"}},
    {{"id": "n2", "label": "Evidence: Forged signatures on contract", "type": "evidence"}}
  ],
  "edges": [
    {{"id": "e1", "source": "n2", "target": "n1", "label": "supports"}}
  ]
}}
"""
    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": "You extract structured data from legal text."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
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
                    return get_mock_graph()
        
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        if start_idx >= 0 and end_idx > start_idx:
            return json.loads(response_text[start_idx:end_idx])
            
    except Exception as e:
        print(f"Error generating graph: {e}")
        
    return get_mock_graph()

def get_mock_graph() -> Dict[str, Any]:
    return {
        "nodes": [
            {"id": "n1", "label": "Claim: Accused committed fraud under Sec 420", "type": "claim"},
            {"id": "n2", "label": "Evidence: Forged checks discovered", "type": "evidence"},
            {"id": "n3", "label": "Argument: Lack of mens rea", "type": "argument"},
            {"id": "n4", "label": "Evidence: Witness testimony regarding intent", "type": "evidence"}
        ],
        "edges": [
            {"id": "e1", "source": "n2", "target": "n1", "label": "supports"},
            {"id": "e2", "source": "n3", "target": "n1", "label": "contradicts"},
            {"id": "e3", "source": "n4", "target": "n3", "label": "contradicts"}
        ]
    }
