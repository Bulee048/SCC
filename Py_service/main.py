from fastapi import FastAPI, File, UploadFile, Form
from typing import List, Optional
import json
import re  
import fitz  # PyMuPDF
import os
import io
from PIL import Image
import pytesseract # Tesseract OCR
from dotenv import load_dotenv

import langchain_nvidia_ai_endpoints
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

app = FastAPI(title="SCC Exam Plan AI Microservice")

# Windows වල Tesseract Install කළ තැන (ඔබේ Path එක වෙනස් නම් මෙතන හදන්න)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ==========================================
# 1. AI MODEL SETUP - EXAM PLANNER (Heavy)
# ==========================================
llm_planner = langchain_nvidia_ai_endpoints.ChatNVIDIA(
    model="nvidia/nemotron-3-super-120b-a12b",
    api_key=os.getenv("NVIDIA_API_KEY"), 
    temperature=1,
    top_p=0.95,
    max_tokens=16384,
    reasoning_budget=16384,
    chat_template_kwargs={"enable_thinking": True}
)


# ==========================================
# 2. AI MODEL SETUP - STUDY PILOT (Fast/Instruct)
# ==========================================
llm_pilot = langchain_nvidia_ai_endpoints.ChatNVIDIA(
    model="marin/marin-8b-instruct",
    api_key=os.getenv("NVIDIA_API_KEY"), 
    temperature=0.3, 
    top_p=0.9,
    max_tokens=1500, 
)

# ==========================================
# ADVANCED PDF EXTRACTION (TEXT + OCR)
# ==========================================
def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(min(len(doc), 15)): # මුල් පිටු 15 පමණක්
            page = doc[page_num]
            page_text = page.get_text().strip()
            
            # පිටුවේ අකුරු 50කට වඩා තියෙනවා නම් ඒ කියන්නේ ඒක සාමාන්‍ය PDF එකක්
            if len(page_text) > 50:
                text += page_text + "\n"
            else:
                # අකුරු නැත්නම් (Scanned Image එකක් නම්) Tesseract OCR පාවිච්චි කරනවා
                print(f"Page {page_num + 1} appears to be a scanned image. Running OCR...")
                pix = page.get_pixmap(dpi=150) # පිටුව ෆොටෝ එකක් (Image) බවට පත් කිරීම
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                
                # ෆොටෝ එකේ තියෙන අකුරු කියවීම
                ocr_text = pytesseract.image_to_string(img)
                text += ocr_text + "\n"
                
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

# ------------------------------------------
# ROUTE 1: Generate Study Plan (Uses Nemotron)
# ------------------------------------------
@app.post("/api/generate-plan")
async def generate_study_plan(
    systemPrompt: str = Form(...), 
    planCategory: str = Form(...),
    dailyHours: int = Form(...),
    modulesData: str = Form(...),
    outlines: Optional[List[UploadFile]] = File(None)
):
    pdf_contents = {}
    if outlines:
        for file in outlines:
            file_bytes = await file.read()
            pdf_contents[file.filename] = extract_text_from_pdf(file_bytes)

    user_message = f"""
    [EXTRACTED PDF OUTLINES / SYLLABUS TEXT]
    {str(pdf_contents)[:5000]}
    
    Please generate the study plan based on the above PDF context and the provided rules.
    """

    messages = [
        SystemMessage(content=systemPrompt), 
        HumanMessage(content=user_message)
    ]

    chain = llm_planner | JsonOutputParser()

    try:
        result = await chain.ainvoke(messages) 
        return {"success": True, "data": result}
    except Exception as e:
        print("AI Generation Error (Planner):", e)
        return {"success": False, "message": str(e)}

# ------------------------------------------
# ROUTE 2: Study Pilot Functions (Uses Marin)
# ------------------------------------------
@app.post("/api/study-pilot")
async def generate_study_pilot_materials(
    actionType: str = Form(...),
    chatPrompt: str = Form(""),
    outlines: Optional[List[UploadFile]] = File(None)
):
    pdf_text = ""
    if outlines:
        for file in outlines:
            file_bytes = await file.read()
            extracted = extract_text_from_pdf(file_bytes)
            pdf_text += extracted
            print(f"Extracted {len(extracted)} characters from {file.filename}")

    if not pdf_text.strip():
        print("Warning: No text could be extracted from the PDF even with OCR.")
        return {
            "success": False, 
            "message": "UUncleared PDF.PLease upload Clear PDF"
        }

    system_rules = ""
    if actionType == "Summary":
        system_rules = 'Summarize the text. Output ONLY valid JSON: {"summaryTitle": "Title", "keyPoints": ["Point 1", "Point 2"], "detailedSummary": "Details"}'
    elif actionType == "Flashcards":
        system_rules = 'Create exactly 10 flashcards. Output ONLY a valid JSON array: [{"front": "Term", "back": "Definition"}]'
    elif actionType == "Quiz":
        system_rules = 'Create a 20-question multiple choice quiz. Output ONLY a valid JSON array: [{"question": "Q", "options": ["A", "B", "C", "D"], "correctAnswers": ["A"], "explanations": {"A": "Exp A", "B": "Exp B", "C": "Exp C", "D": "Exp D"}}]'
    elif actionType == "Mindmap":
         system_rules = 'Create a knowledge map. Output ONLY valid JSON: {"nodes": [{"id": "1", "data": {"label": "Topic"}}], "edges": [{"id": "e1", "source": "1", "target": "2"}]}'
    else:
        system_rules = f'Act as Study Pilot. User asked: "{chatPrompt}". Output ONLY valid JSON response.'

    user_message = f"""
    [SOURCE DOCUMENT TEXT]
    {pdf_text[:7000]}  

    CRITICAL INSTRUCTION: Do NOT include greetings, explanations, or any text outside of the JSON object. Just return the raw JSON.
    """

    messages = [
        SystemMessage(content=system_rules), 
        HumanMessage(content=user_message)
    ]

    try:
        response = await llm_pilot.ainvoke(messages) 
        raw_text = response.content

        json_match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', raw_text)
        if not json_match:
            print("Failed to find JSON in AI response. Raw Output:", raw_text)
            raise ValueError("AI did not return valid JSON data.")
            
        json_str = json_match.group(0)
        parsed_data = json.loads(json_str) 

        # --- AUTO-CORRECT AI NESTING ---
        if actionType in ["Flashcards", "Quiz"]:
            if isinstance(parsed_data, dict):
                for val in parsed_data.values():
                    if isinstance(val, list):
                        parsed_data = val
                        break

        return {"success": True, "data": parsed_data}
        
    except Exception as e:
        print(f"Pilot Generation Error ({actionType}):", e)
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)