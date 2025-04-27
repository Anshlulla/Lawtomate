# PORT = 8002

from fastapi import FastAPI, Depends, HTTPException, Header, File, UploadFile, Form
import os
import time
import tempfile
import uuid
from dotenv import load_dotenv
#from langchain_ollama import ChatOllama
from langchain_groq import ChatGroq
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

# API key credits system
API_KEY_CREDITS = {os.getenv("API_KEY"): 50}  # Each API key gets 50 credits

# Function to verify API key
def verify_api_key(api_key: str = Header(None)):
    credits = API_KEY_CREDITS.get(api_key, 0)
    if credits <= 0:
        raise HTTPException(status_code=401, detail="Invalid API KEY, or no credits left")
    return api_key

# Load embeddings model
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Load LLM (Llama3 from Ollama)
llm = ChatGroq(model="llama3-8b-8192", temperature=0.3)

# Define prompt template
prompt = ChatPromptTemplate.from_template(
    """
    Answer the questions based on the provided context only.
    Please provide the most accurate response based on the question.
    <context>
    {context}
    <context>
    Question: {input}
    """
)

# Store session-based vector DB
session_data = {}

def create_user_session():
    """Generates a unique session ID and initializes session storage."""
    session_id = str(uuid.uuid4())  # Generate a unique session ID
    session_data[session_id] = {
        "vectors": None  # FAISS Vector Store
    }
    return session_id

def get_user_session(session_id: str):
    """Retrieves the user session, or raises an error if session does not exist."""
    if session_id not in session_data:
        raise HTTPException(status_code=400, detail="Invalid session ID. Please start a new session.")
    return session_data[session_id]

@app.post("/start_session")
async def start_session(api_key: str = Depends(verify_api_key)):
    """
    Generates a unique session ID for the user.
    """
    API_KEY_CREDITS[api_key] -= 1  # Deduct 1 credit for session creation
    session_id = create_user_session()
    return {"session_id": session_id, "message": "Session started successfully"}

@app.post("/embed_document")
async def embed_document(session_id: str = Form(...), file: UploadFile = File(...)):
    """
    Handles document ingestion, splitting, embedding, and storing in FAISS.
    """
    session = get_user_session(session_id)  # Retrieve session

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
        temp_pdf.write(await file.read())
        temp_pdf_path = temp_pdf.name

    loader = PyPDFLoader(file_path=temp_pdf_path)
    pages = loader.load()
    text_content = " ".join([page.page_content for page in pages])
    os.remove(temp_pdf_path)  # Clean up temporary file

    # Split text into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    documents = text_splitter.split_text(text_content)

    # Create vector store
    faiss_store = FAISS.from_texts(documents, embeddings)

    # Store vectors in session
    session["vectors"] = faiss_store

    return {"message": "Document embedded successfully!", "session_id": session_id}

@app.post("/ask")
async def ask_question(session_id: str = Form(...), question: str = Form(...)):
    """
    Handles user queries, retrieves relevant context from FAISS, and generates responses.
    """
    session = get_user_session(session_id)  # Retrieve session

    if session["vectors"] is None:
        raise HTTPException(status_code=400, detail="No document embedded yet. Please upload first.")

    # Create retrieval chain
    retriever = session["vectors"].as_retriever()
    qa_chain = create_stuff_documents_chain(llm=llm, prompt=prompt)
    rag_chain = create_retrieval_chain(retriever=retriever, combine_docs_chain=qa_chain)

    start_time = time.process_time()
    response = rag_chain.invoke({"input": question})
    elapsed_time = time.process_time() - start_time

    return {
        "answer": response["answer"],
        "response_time": elapsed_time
    } 