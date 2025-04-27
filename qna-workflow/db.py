from dotenv import load_dotenv
import os
from pymongo import MongoClient
load_dotenv()

connection_string = f"""mongodb+srv://anshlulla26:{os.getenv('MONGODB_PSWD')}@lawtomate.mjnvehd.mongodb.net/?retryWrites=true&w=majority&appName=lawtomate"""

client = MongoClient(connection_string)

db = client["lawtomate"]
qna_collection = db["qna-history"]
print(qna_collection.count_documents({}))

#print(db.list_collection_names())

"""
from fastapi import FastAPI, Depends, HTTPException, Header, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
import uuid
import os
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
from db import db, qna_collection

# Load env vars
load_dotenv()

# Create the App
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API key system
API_KEY_CREDITS = {os.getenv("API_KEY"): 50}

def verify_api_key(api_key: str = Header(None)):
    credits = API_KEY_CREDITS.get(api_key, 0)
    if credits <= 0:
        raise HTTPException(status_code=401, detail="Invalid API KEY, or no credits left")
    return api_key

# Prompt template for legal assistant
prompt = ChatPromptTemplate.from_messages([
    SystemMessage(content="You are a highly intelligent and trustworthy legal assistant. Your goal is to provide clear, detailed, and legally accurate answers. If you are unsure, say you are unsure. Always stay neutral and professional."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{input}")
])

# Load the LLM
llm = ChatOllama(model="llama3.2:latest", temperature=0.3)

@app.post("/legal_query")
async def legal_query(email: str = Form(...), query: str = Form(...)):
    # Generate prompt
    formatted_prompt = prompt.format_messages(query=query)
    response = llm.invoke(formatted_prompt)

    # Store the response in mongodb collection
    qna_collection.insert_one({
        "email": email,
        "query": query,
        "response": response.content,
        "timestamp": datetime.now()
    })

    return {
        "answer": response.content,
        "email": email
    }

@app.get("/get-history")
def get_history(email: str):
    # Exclude ID field
    history = list(qna_collection.find({"email": email}, {"_id": 0}).sort("timestamp", -1).limit(3)) 
    return {"history": history}

"""

