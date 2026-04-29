import os
import json
import random
from typing import Dict, Any, List

# In a real production system, this would use a vector database (e.g., Pinecone, Milvus) 
# or a local FAISS index with Sentence-BERT embeddings.
# For this demonstration, we'll implement a functional mock that ranks predefined cases.

MOCK_CASE_DB = [
    {"id": "c1", "name": "State of Maharashtra vs. Sharma", "description": "Financial fraud and forged signatures on banking instruments.", "base_sim": 0.89, "differences": "Involved public officials rather than private actors."},
    {"id": "c2", "name": "R.K. Dalmia vs Delhi Administration", "description": "Criminal breach of trust and falsification of accounts in corporate setting.", "base_sim": 0.85, "differences": "Scale of fraud was significantly larger; involved cross-border transactions."},
    {"id": "c3", "name": "Sushil Sharma vs State", "description": "Evidence tampering and witness intimidation during trial.", "base_sim": 0.76, "differences": "Primary charge was homicide, not financial fraud."},
    {"id": "c4", "name": "CBI vs. A. Raja", "description": "Telecommunications licensing fraud and conspiracy.", "base_sim": 0.82, "differences": "Dealt primarily with administrative procedure violations."},
    {"id": "c5", "name": "K.M. Nanavati vs. State of Maharashtra", "description": "Jury trial involving sudden provocation.", "base_sim": 0.45, "differences": "Completely different domain of law (Crimes against person vs property)."},
]

def find_similar_cases(case_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Simulate embedding-based case retrieval (Sentence-BERT/Cosine Similarity).
    Returns top similar cases based on textual overlap or mock scoring.
    """
    # Simulate similarity scoring by adding slight randomness to base similarity
    # based on keywords in the case_text.
    scored_cases = []
    text_lower = case_text.lower()
    
    for case in MOCK_CASE_DB:
        score = case["base_sim"]
        
        if "fraud" in text_lower and "fraud" in case["description"].lower():
            score += 0.05
        if "forg" in text_lower and "forg" in case["description"].lower():
            score += 0.06
            
        score = min(0.99, score)
        scored_cases.append({
            "case_name": case["name"],
            "similarity_percent": round(score * 100, 1),
            "key_differences": case["differences"]
        })
        
    # Sort by similarity descending
    scored_cases.sort(key=lambda x: x["similarity_percent"], reverse=True)
    return scored_cases[:top_k]
