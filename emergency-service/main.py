from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import os
import httpx
from datetime import datetime

app = FastAPI(title="LAAC Emergency Service")

# Database setup
DB_HOST = os.getenv("DB_HOST", "mariadb")
DB_USER = os.getenv("DB_USER", "laac_user")
DB_PASS = os.getenv("DB_PASS", "laac_pass")
DB_NAME = os.getenv("DB_NAME", "laac_db")
DATABASE_URL = f"mysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

LOGGING_SERVICE_URL = os.getenv("LOGGING_SERVICE_URL", "http://logging-service:8000")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8006")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class EmergencyAlert(BaseModel):
    user_email: str
    type: str  # 'silent', 'call', 'chat'
    lat: float
    lng: float

@app.post("/alerts")
async def create_alert(alert: EmergencyAlert, db: Session = Depends(get_db)):
    # 1. Store in DB
    result = db.execute(
        text("INSERT INTO emergencies (user_email, type, lat, lng) VALUES (:u, :t, :la, :lo)"),
        {"u": alert.user_email, "t": alert.type, "la": alert.lat, "lo": alert.lng}
    )
    alert_id = result.lastrowid
    db.commit()
    
    # 2. Log event
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{LOGGING_SERVICE_URL}/logs", json={
                "service": "emergency",
                "action": f"alert_{alert.type}",
                "user_email": alert.user_email,
                "details": f"Location: {alert.lat}, {alert.lng}",
                "status": "critical"
            })
    except:
        pass

    # 3. Notify Response Team via Notification Service (apenas se não for triagem do tipo chat)
    if alert.type != "chat":
        try:
            async with httpx.AsyncClient() as client:
                await client.post(f"{NOTIFICATION_SERVICE_URL}/notify", json={
                    "target_role": "Response-team",
                    "message": f"ALERTA CRÍTICO: Emergência do tipo {alert.type} iniciada por {alert.user_email}.",
                    "data": {"lat": alert.lat, "lng": alert.lng, "user": alert.user_email, "id": alert_id}
                })
        except:
            pass

    success_message = "Mentor Digital NeoLAAC conectado. Podes iniciar a conversa!" if alert.type == "chat" else "A ajuda está a caminho."
    return {"status": "alert_received", "message": success_message, "incident_id": alert_id}

@app.get("/alerts")
async def list_alerts(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM emergencies WHERE status != 'RESOLVIDO' ORDER BY created_at DESC")).fetchall()
    return [
        {
            "id": r[0],
            "user_email": r[1],
            "type": r[2],
            "status": r[3],
            "lat": r[4],
            "lng": r[5],
            "created_at": str(r[6])
        } for r in result
    ]

@app.get("/alerts/history")
async def get_alerts_history(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM emergencies WHERE status = 'RESOLVIDO' ORDER BY resolved_at DESC")).fetchall()
    return [
        {
            "id": r[0],
            "user_email": r[1],
            "type": r[2],
            "status": r[3],
            "lat": r[4],
            "lng": r[5],
            "created_at": str(r[6]),
            "resolved_at": str(r[7]),
            "resolution_note": r[8]
        } for r in result
    ]

class UpdateAlert(BaseModel):
    status: str
    resolution_note: str = None

@app.put("/alerts/{alert_id}")
async def update_alert(alert_id: int, payload: UpdateAlert, db: Session = Depends(get_db)):
    db.execute(
        text("UPDATE emergencies SET status = :s, resolution_note = :n, resolved_at = :r WHERE id = :id"),
        {
            "s": payload.status, 
            "n": payload.resolution_note,
            "r": datetime.now() if payload.status == "RESOLVIDO" else None, 
            "id": alert_id
        }
    )
    db.commit()
    
    # Notify that incident is resolved
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{NOTIFICATION_SERVICE_URL}/notify", json={
                "target_role": "all",
                "message": f"Incidente #{alert_id} foi marcado como RESOLVIDO.",
                "data": {"type": "incident_resolved", "id": alert_id}
            })
    except:
        pass

    return {"status": "updated"}
