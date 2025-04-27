# PORT = 8001

from fastapi import FastAPI, Depends, HTTPException, Header, File, UploadFile, Form
import os
from dotenv import load_dotenv
import ollama
from langchain_ollama import ChatOllama
#from langchain_groq import ChatGroq
from langchain.chains.summarize import load_summarize_chain
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate
from langchain_community.document_loaders import PyPDFLoader
import tempfile
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI App
app = FastAPI()

# Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()

# API key credits system
API_KEY_CREDITS = {os.getenv("API_KEY"): 30}


# Function to verify API key
def verify_api_key(api_key: str = Header(None)):
    credits = API_KEY_CREDITS.get(api_key, 0)
    if credits <= 0:
        raise HTTPException(status_code=401, detail="Invalid API KEY, or no credits left")
    
    return api_key

# Load the LLM
llm = ChatOllama(model="llama3.2:latest", temperature=0.3)

@app.post("/summarize")
async def summarize(api_key: str = Depends(verify_api_key),
              text: str = Form(None),
              file: UploadFile = File(None)):
    API_KEY_CREDITS[api_key] -= 1

    if file:
        print("PDF Received")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            temp_pdf.write(await file.read())
            temp_pdf_path = temp_pdf.name
        
        loader = PyPDFLoader(file_path=temp_pdf_path)
        pages = loader.load()
        text_content = " ".join([page.page_content for page in pages])
        os.remove(temp_pdf_path)
        print("PDF Content extracted")
    
    elif text:
        print("Raw Text received")
        text_content = text
    
    else:
        raise HTTPException(status_code=400, detail="No text or PDF received")


    # Split text into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
    docs = [Document(page_content=chunk) for chunk in splitter.split_text(text_content)]

    print("Text has been split into chunks")

    template = """
        Write a concise summary of the document.
        text: {text}
        Summary:
    """

    prompt_template = PromptTemplate(input_variables=["text"], template=template)

    print("Running summarization chain...")
    chain = load_summarize_chain(llm=llm, chain_type="stuff", prompt=prompt_template, verbose=True)


    # Run summarization
    summary = chain.run(docs)

    print("Summary generated")

    return {"summary": summary}
