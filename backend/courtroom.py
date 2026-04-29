import os
import asyncio
from typing import AsyncGenerator
import aiohttp

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")

async def simulate_courtroom(case_text: str) -> AsyncGenerator[str, None]:
    """
    Simulates a courtroom debate using SSE (Server-Sent Events) or iterative responses.
    Yields chunks of JSON representing the speaker and message.
    """
    roles = [
        {"role": "Prosecutor", "prompt": "Present the opening argument for conviction."},
        {"role": "Defence", "prompt": "Present the defense rebuttal and argue for acquittal."},
        {"role": "Ethics", "prompt": "Evaluate the ethical dimensions of the arguments presented."},
        {"role": "Judge", "prompt": "Deliver the final courtroom verdict based on the debate."}
    ]
    
    conversation_history = f"Case Summary: {case_text[:1000]}\n\n"
    
    import json
    
    for actor in roles:
        role_name = actor["role"]
        yield f"data: {json.dumps({'speaker': role_name, 'status': 'typing'})}\n\n"
        
        system_prompt = f"You are the {role_name} in a courtroom simulation. Keep your response under 100 words, highly dramatic and professional."
        user_prompt = f"{conversation_history}\n\nYour task: {actor['prompt']}"
        
        if not OPENAI_API_KEY:
            await asyncio.sleep(2)
            content = get_mock_role_response(role_name)
        else:
            try:
                async with aiohttp.ClientSession() as session:
                    headers = {
                        "Authorization": f"Bearer {OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    }
                    
                    payload = {
                        "model": "gpt-4o",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 200
                    }
                    
                    async with session.post(
                        f"{OPENAI_API_BASE}/chat/completions",
                        headers=headers,
                        json=payload,
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            content = data["choices"][0]["message"]["content"]
                        else:
                            raise Exception(f"API Error: {await resp.text()}")
            except Exception as e:
                # If API fails (e.g. out of credits), gracefully degrade to mock
                print(f"API Error for {role_name}: {e}")
                await asyncio.sleep(2)
                content = get_mock_role_response(role_name)
                
        conversation_history += f"{role_name}: {content}\n\n"
        
        # Yield the final message
        yield f"data: {json.dumps({'speaker': role_name, 'message': content, 'status': 'done'})}\n\n"
        await asyncio.sleep(1) # Small pause between speakers

def get_mock_role_response(role: str) -> str:
    mocks = {
        "Prosecutor": "Your Honor, the evidence presented explicitly demonstrates a calculated sequence of fraud. The forged documents bear the undeniable signature of the accused, satisfying all conditions of IPC 420. The intent was malicious, premeditated, and the financial damages to the victim are irreversible. A conviction is the only just outcome.",
        "Defence": "Objection! My learned friend relies entirely on circumstantial evidence and disputed documents. There is not a single credible eyewitness linking my client directly to the alleged forgery. The chain of custody for the digital evidence was completely compromised. Reasonable doubt is rampant here; my client is innocent until definitively proven guilty.",
        "Ethics": "We must carefully weigh the procedural oversights against the severity of the alleged fraud. While the financial impact on the victim is profound, the integrity of the judicial process demands that evidence collection adhere strictly to protocol. A conviction based on tainted evidence sets a dangerous systemic precedent.",
        "Judge": "Order in the court. I have reviewed the arguments. While the Defence raises valid concerns regarding procedural chain-of-custody, the sheer volume of corroborating documentary evidence establishes mens rea beyond a reasonable doubt. The core facts remain undisputed. Therefore, I find the conviction sustainable under the law."
    }
    return mocks.get(role, "No mock available.")
