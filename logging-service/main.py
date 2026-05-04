from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import os
from datetime import datetime

app = FastAPI()

# Database setup
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "laac_user")
DB_PASS = os.getenv("DB_PASS", "laac_pass")
DB_NAME = os.getenv("DB_NAME", "laac_db")
DATABASE_URL = f"mysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class LogEntry(BaseModel):
    service: str
    action: str
    user_email: str
    details: str = ""
    status: str = "info"

@app.on_event("startup")
def startup():
    # Ensure table exists
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                service VARCHAR(50),
                action VARCHAR(100),
                user_email VARCHAR(255),
                details TEXT,
                status VARCHAR(20),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()

@app.post("/logs")
async def create_log(entry: LogEntry, db: Session = Depends(get_db)):
    db.execute(
        text("INSERT INTO activity_logs (service, action, user_email, details, status) VALUES (:s, :a, :u, :d, :st)"),
        {"s": entry.service, "a": entry.action, "u": entry.user_email, "d": entry.details, "st": entry.status}
    )
    db.commit()
    return {"status": "logged"}

@app.get("/logs")
async def get_logs(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100")).fetchall()
    return [
        {
            "id": r[0],
            "service": r[1],
            "action": r[2],
            "user_email": r[3],
            "details": r[4],
            "status": r[5],
            "timestamp": str(r[6])
        } for r in result
    ]
