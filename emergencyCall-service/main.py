from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import os
import httpx

app = FastAPI(title="LAAC Emergency Call Service")

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

@app.on_event("startup")
def startup():
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS emergency_calls (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'A_LIGAR',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()

class CallRequest(BaseModel):
    user_email: str

@app.post("/calls")
async def request_call(req: CallRequest, db: Session = Depends(get_db)):
    # 1. Encontrar um membro da equipa de resposta ativo (is_online)
    responder = db.execute(
        text("SELECT email, phone FROM users WHERE role LIKE '%Response-team%' AND is_online = 1 AND phone IS NOT NULL LIMIT 1")
    ).fetchone()
    
    responder_email = responder[0] if responder else "Equipa Geral"
    responder_phone = responder[1] if responder else "911222333" # Fallback
    
    # 2. Store in DB
    result = db.execute(
        text("INSERT INTO emergency_calls (user_email, status) VALUES (:u, 'A_LIGAR')"),
        {"u": req.user_email}
    )
    db.commit()
    call_id = result.lastrowid

    # 3. Notify Response Team
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{NOTIFICATION_SERVICE_URL}/notify", json={
                "target_role": "Response-team",
                "message": f"CHAMADA DE EMERGÊNCIA: {req.user_email} está a tentar ligar!",
                "data": {
                    "type": "voice_call", 
                    "user": req.user_email, 
                    "call_id": call_id,
                    "responder_assigned": responder_email
                }
            })
    except Exception as e:
        print(f"Error notifying: {e}")

    return {
        "status": "calling", 
        "call_id": call_id, 
        "assigned_responder": responder_email,
        "phone": responder_phone
    }

@app.put("/calls/{call_id}")
async def update_call_status(call_id: int, status: str, db: Session = Depends(get_db)):
    db.execute(
        text("UPDATE emergency_calls SET status = :s WHERE id = :id"),
        {"s": status, "id": call_id}
    )
    db.commit()
    return {"status": "updated"}
