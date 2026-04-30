import os
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document

# Initialize embeddings
embeddings = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))

# Global vector store dictionary to hold indices for different documents
# In a production app, you'd save these to disk or use a managed service
vector_stores = {}

def ingest_document(doc_id: str, text: str):
    """
    Split document text into chunks and store in FAISS vector store
    """
    try:
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        chunks = text_splitter.split_text(text)
        
        # Create documents
        docs = [Document(page_content=chunk, metadata={"doc_id": doc_id}) for chunk in chunks]
        
        # Create or update vector store
        vector_store = FAISS.from_documents(docs, embeddings)
        vector_stores[doc_id] = vector_store
        
        return True
    except Exception as e:
        print(f"Error ingesting document: {e}")
        return False

def retrieve_context(doc_id: str, query: str, k: int = 4):
    """
    Retrieve relevant chunks for a given query
    """
    if doc_id not in vector_stores:
        return ""
    
    try:
        vector_store = vector_stores[doc_id]
        results = vector_store.similarity_search(query, k=k)
        
        context = "\n\n".join([doc.page_content for doc in results])
        return context
    except Exception as e:
        print(f"Error retrieving context: {e}")
        return ""
