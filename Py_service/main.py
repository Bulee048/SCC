from fastapi import FastAPI, File, UploadFile, Form
from typing import List, Optional
import json
import fitz  # PyMuPDF for fast PDF text extraction
import os
from dotenv import load_dotenv

# ✅ අලුතින් එක්කළ LangChain NVIDIA Endpoint එක
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

# Load environment variables
load_dotenv()

app = FastAPI(title="SCC Exam Plan AI Microservice")

# --- AI MODEL SETUP (NVIDIA Nemotron 3 Super 120B) ---
# ඔබ ඉල්ලූ පරිදි 'enable_thinking' සහ 'reasoning_budget' සමගින්
llm_planner = ChatNVIDIA(
    model="nvidia/nemotron-3-super-120b-a12b",
    api_key=os.getenv("NVIDIA_API_KEY"), 
    temperature=1,
    top_p=0.95,
    max_tokens=16384,
    reasoning_budget=16384,
    chat_template_kwargs={"enable_thinking": True}
)

# Function to extract text from uploaded PDF
def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(min(len(doc), 15)): # Limit to first 15 pages
            text += doc[page_num].get_text()
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

@app.post("/api/generate-plan")
async def generate_study_plan(
    systemPrompt: str = Form(...), # Node.js එකෙන් එවන Rules/Prompt එක ලබා ගැනීම
    planCategory: str = Form(...),
    dailyHours: int = Form(...),
    modulesData: str = Form(...),
    outlines: Optional[List[UploadFile]] = File(None)
):
    # 1. PDF වලින් text ගැනීම
    pdf_contents = {}
    if outlines:
        for file in outlines:
            file_bytes = await file.read()
            pdf_contents[file.filename] = extract_text_from_pdf(file_bytes)

    # 2. සාමාන්‍ය Text (Messages) ලෙස Prompt එක සකස් කිරීම
    # මෙහිදී SystemMessage භාවිතා කරන නිසා LangChain මගින් {} variables ලෙස සලකන්නේ නැත.
    user_message = f"""
    [EXTRACTED PDF OUTLINES / SYLLABUS TEXT]
    {str(pdf_contents)[:5000]}
    
    Please generate the study plan based on the above PDF context and the provided rules.
    """

    messages = [
        SystemMessage(content=systemPrompt), 
        HumanMessage(content=user_message)
    ]

    # 3. LangChain Pipeline එක ක්‍රියාත්මක කිරීම
    chain = llm_planner | JsonOutputParser()

    try:
        # මෙහිදී කෙළින්ම අර හැදූ messages array එක ලබා දෙනවා
        result = await chain.ainvoke(messages) 
        return {"success": True, "data": result}
    except Exception as e:
        print("AI Generation Error:", e)
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    # සර්වර් එක 8000 පෝට් එකෙන් ක්‍රියාත්මක වේ
    uvicorn.run(app, host="0.0.0.0", port=8000)