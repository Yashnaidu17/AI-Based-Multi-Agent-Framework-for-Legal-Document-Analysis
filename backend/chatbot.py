"""
Conversational chatbot for legal document discussion
"""

import os
import json
import aiohttp
from typing import Optional
from dotenv import load_dotenv
from utils.rag_utils import retrieve_context

load_dotenv()

import aiohttp

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")

class LegalChatbot:
    """Conversational legal document chatbot"""
    
    def __init__(self):
        self.conversation_history = []
        self.document_context = ""
    
    def set_context(self, context: str):
        """Set document context for chatbot"""
        self.document_context = context
    
    async def chat(self, user_message: str, doc_id: Optional[str] = None) -> str:
        """
        Get chatbot response to user message with RAG support
        """
        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        if not OPENAI_API_KEY:
            return get_mock_chatbot_response(user_message)
        
        try:
            # Build system prompt
            system_prompt = """You are a knowledgeable legal assistant specializing in Indian criminal law and legal document analysis. 
You have expertise in case law, evidence analysis, procedural law, and legal reasoning.
Provide clear, accurate, and helpful responses about legal matters.
If asked about a specific document, use the provided context to give specific analysis.
Always encourage users to consult with actual lawyers for specific legal advice."""
            
            # RAG: Retrieve relevant context if doc_id is provided
            dynamic_context = ""
            if doc_id:
                dynamic_context = retrieve_context(doc_id, user_message)
            
            if dynamic_context:
                system_prompt += f"\n\nRelevant segments from the legal document:\n{dynamic_context}"
            elif self.document_context:
                # Fallback to full context if RAG not used or no matches (though RAG is usually better)
                system_prompt += f"\n\nYou have access to the following case summary:\n{self.document_context[:2000]}..."
            
            # Prepare messages
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            messages.extend(self.conversation_history[-10:])  # Keep last 10 messages
            
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": "gpt-4o",
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1024
                }
                
                async with session.post(
                    f"{OPENAI_API_BASE}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        assistant_message = data["choices"][0]["message"]["content"]
                    else:
                        print(f"API Error: {await resp.text()}")
                        return get_mock_chatbot_response(user_message)
            
            # Add assistant response to history
            self.conversation_history.append({
                "role": "assistant",
                "content": assistant_message
            })
            
            return assistant_message
        
        except Exception as e:
            print(f"Error in chatbot: {e}")
            return get_mock_chatbot_response(user_message)
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
    
    def get_history(self) -> list:
        """Get conversation history"""
        return self.conversation_history

async def create_chatbot_chain():
    """Factory function to create chatbot instance"""
    return LegalChatbot()

def get_mock_chatbot_response(user_message: str) -> str:
    """Generate mock chatbot response"""
    message_lower = user_message.lower()
    
    if "what" in message_lower and "conviction" in message_lower:
        return "Conviction refers to a formal judgment that the accused is guilty of the charges. It's based on evidence proving guilt beyond reasonable doubt. The court must be satisfied that all elements of the crime have been established by the prosecution."
    
    elif "mens rea" in message_lower:
        return "Mens rea (Latin for 'guilty mind') refers to the criminal intent required for a crime. It means the accused must have acted with knowledge, intention, or recklessness. Proving mens rea is crucial in criminal law as most crimes require more than just the physical act (actus reus)."
    
    elif "evidence" in message_lower:
        return "Evidence in legal cases includes testimonies, documents, physical objects, and expert opinions. In Indian courts, evidence must be relevant, admissible, and properly authenticated. The standard of proof in criminal cases is 'beyond reasonable doubt,' which is higher than the 'balance of probabilities' standard used in civil cases."
    
    elif "procedure" in message_lower or "ipc" in message_lower:
        return "The Indian Penal Code (IPC) and Code of Criminal Procedure (CrPC) govern criminal cases. Proper procedure ensures fair trial and protection of rights. Key procedural aspects include proper investigation, arrest procedures, bail provisions, and trial stages. Violations of procedure can affect verdict validity."
    
    elif "verdict" in message_lower or "acquittal" in message_lower:
        return "A verdict is the final decision of the court. Acquittal means the accused is found 'not guilty' of the charges. Conviction means found guilty. Verdicts must be based on evidence and legal reasoning. Appeals are possible if there are legal errors in the verdict."
    
    else:
        return "I'm a legal assistant specialized in Indian criminal law. I can help you understand case analyses, legal concepts, evidence evaluation, and procedural matters. What specific aspect of the case or legal concept would you like to know more about?"

# Global chatbot instance
_chatbot_instance: Optional[LegalChatbot] = None

async def get_chatbot() -> LegalChatbot:
    """Get or create global chatbot instance"""
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = await create_chatbot_chain()
    return _chatbot_instance
