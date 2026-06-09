from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import os
import httpx
from datetime import datetime
from typing import List

app = FastAPI(title="LAAC Chat Service")

# Database setup
DB_HOST = os.getenv("DB_HOST", "mariadb")
DB_USER = os.getenv("DB_USER", "laac_user")
DB_PASS = os.getenv("DB_PASS", "laac_pass")
DB_NAME = os.getenv("DB_NAME", "laac_db")
DATABASE_URL = f"mysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8006")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class ChatMessageCreate(BaseModel):
    incident_id: int
    sender_email: str
    message: str
    is_responder: bool = False

@app.post("/messages")
async def send_message(msg: ChatMessageCreate, db: Session = Depends(get_db)):
    db.execute(
        text("INSERT INTO chat_messages (incident_id, sender_email, message, is_responder) VALUES (:id, :e, :m, :r)"),
        {"id": msg.incident_id, "e": msg.sender_email, "m": msg.message, "r": msg.is_responder}
    )
    db.commit()

    # Notify Response Team notification logic is now handled by the orchestrator (orq)
    # depending on whether the incident is in triage or has been escalated.
    return {"status": "message_sent"}

@app.get("/messages/{incident_id}")
async def get_messages(incident_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT sender_email, message, is_responder, created_at FROM chat_messages WHERE incident_id = :id ORDER BY created_at ASC"),
        {"id": incident_id}
    ).fetchall()
    
    return [
        {
            "sender_email": r[0],
            "message": r[1],
            "is_responder": r[2],
            "timestamp": str(r[3])
        } for r in result
    ]
