from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
import httpx
import os
import re

app = FastAPI(title="LAAC Chatbot Service")

FAQ_SERVICE_URL = os.getenv("FAQ_SERVICE_URL", "http://faq-service:8004")

class BotRequest(BaseModel):
    message: str

class BotResponse(BaseModel):
    reply: str
    timestamp: datetime = datetime.now()

def normalize_text(text: str) -> str:
    text = text.lower()
    replacements = {
        'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a',
        'é': 'e', 'è': 'e', 'ê': 'e',
        'í': 'i', 'ì': 'i', 'î': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u',
        'ç': 'c'
    }
    for orig, rep in replacements.items():
        text = text.replace(orig, rep)
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    return text.strip()

@app.post("/bot/message", response_model=BotResponse)
async def get_bot_reply(request: BotRequest):
    user_msg = normalize_text(request.message)
    user_words = set(user_msg.split())
    
    # 1. Fetch dynamic FAQs from FAQ-service
    faqs = []
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{FAQ_SERVICE_URL}/faqs")
            if res.status_code == 200:
                faqs = res.json()
    except Exception as e:
        print(f"Error connecting to FAQ service: {e}")

    best_match = None
    highest_overlap = 0

    # 2. Match user input against all FAQ questions and categories
    for faq in faqs:
        q_norm = normalize_text(faq.get("question", ""))
        c_norm = normalize_text(faq.get("category", ""))
        
        q_words = set(q_norm.split())
        c_words = set(c_norm.split())
        
        # Word overlap calculation: questions have high weight, categories have auxiliary weight
        overlap = len(user_words.intersection(q_words)) + 2 * len(user_words.intersection(c_words))
        
        if overlap > highest_overlap:
            highest_overlap = overlap
            best_match = faq

    # 3. If we have a clear match (at least 1 word overlap), respond with it
    if best_match and highest_overlap >= 1:
        reply = best_match.get("answer", "")
    else:
        # Standard fallback to trigger human triage escalation inside the orchestrator
        reply = "Olá! Sou o teu Mentor Digital NeoLAAC. Não consegui compreender totalmente a tua questão sobre a UBI. Podes tentar perguntar por palavras-chave como 'cartão', 'cantina', 'eduroam', 'bolsa' ou 'biblioteca'."
        
    return BotResponse(reply=reply)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8009)

