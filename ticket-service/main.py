from fastapi import FastAPI, HTTPException, Body, Depends, Request, Header
from typing import List, Optional
import mysql.connector
import os
import jwt
import httpx
import time
from pydantic import BaseModel
from datetime import datetime
from collections import defaultdict

app = FastAPI()

# Security Config
SECRET_KEY = os.getenv("SECRET_KEY", "laac-super-secret-key-2026")
ALGORITHM = "HS256"
LOGGING_SERVICE_URL = os.getenv("LOGGING_SERVICE_URL", "http://logging-service:8000")

# Database connection configuration
db_config = {
    "host": os.getenv("DB_HOST", "mariadb"),
    "user": os.getenv("DB_USER", "laac_user"),
    "password": os.getenv("DB_PASS", "laac_pass"),
    "database": os.getenv("DB_NAME", "laac_db")
}

# In-memory rate limiting (simple implementation)
# {ip: [timestamps]}
request_history = defaultdict(list)
RATE_LIMIT_SECONDS = 600 # 10 minutes
RATE_LIMIT_MAX_TICKETS = 5

class TicketBase(BaseModel):
    user_id: Optional[int] = None
    type: str
    title: str
    description: str
    assigned_team: Optional[str] = "General"

class Ticket(TicketBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    assigned_team: Optional[str] = None

def get_db_connection():
    try:
        return mysql.connector.connect(**db_config)
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")

async def send_log(action: str, email: str, details: str = "", status: str = "info"):
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{LOGGING_SERVICE_URL}/logs", json={
                "service": "ticket-service",
                "action": action,
                "user_email": email,
                "details": details,
                "status": status
            })
    except Exception as e:
        print(f"Logging error: {str(e)}")

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

def require_staff(user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    role = user.get("role", "")
    allowed_roles = ["admin", "Gestor", "Responsável"]
    if role not in allowed_roles and not role.startswith("LAAC-staff"):
        raise HTTPException(status_code=403, detail="Staff access required")
    return user

@app.post("/tickets", status_code=201)
async def create_ticket(request: Request, ticket: TicketBase, user = Depends(get_current_user)):
    # Rate Limiting
    ip = request.client.host
    now = time.time()
    request_history[ip] = [t for t in request_history[ip] if now - t < RATE_LIMIT_SECONDS]
    if len(request_history[ip]) >= RATE_LIMIT_MAX_TICKETS:
        raise HTTPException(status_code=429, detail="Too many reports. Please wait before submitting again.")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        user_id = user["id"] if user else ticket.user_id
        user_email = user["sub"] if user else "anonymous"
        
        query = "INSERT INTO tickets (user_id, type, title, description, assigned_team) VALUES (%s, %s, %s, %s, %s)"
        values = (user_id, ticket.type, ticket.title, ticket.description, ticket.assigned_team)
        cursor.execute(query, values)
        conn.commit()
        
        ticket_id = cursor.lastrowid
        request_history[ip].append(now)
        
        await send_log("ticket_created", user_email, f"Ticket #{ticket_id}: {ticket.title}")
        return {"message": "Ticket created successfully", "id": ticket_id}
    finally:
        cursor.close()
        conn.close()

@app.get("/tickets", response_model=List[Ticket])
async def list_tickets(status: Optional[str] = None, team: Optional[str] = None, user = Depends(require_staff)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT id, user_id, type, title, description, status, assigned_team, created_at FROM tickets"
        conditions = []
        params = []
        if status:
            conditions.append("status = %s")
            params.append(status)
        if team:
            conditions.append("assigned_team = %s")
            params.append(team)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY created_at DESC"
        cursor.execute(query, tuple(params))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

@app.get("/tickets/stats")
async def get_ticket_stats(user = Depends(require_staff)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT status, COUNT(*) as count FROM tickets GROUP BY status")
        status_stats = cursor.fetchall()
        
        cursor.execute("SELECT assigned_team, COUNT(*) as count FROM tickets GROUP BY assigned_team")
        team_stats = cursor.fetchall()
        
        cursor.execute("SELECT type, COUNT(*) as count FROM tickets GROUP BY type")
        type_stats = cursor.fetchall()
        
        return {
            "status": status_stats,
            "teams": team_stats,
            "types": type_stats
        }
    finally:
        cursor.close()
        conn.close()

@app.get("/staff/teams")
async def get_staff_teams(user = Depends(require_staff)):
    # In a real app, this would query the DB. For now, we return fixed teams.
    return ["Dev-team", "Testers-team", "Marketing-team", "Frontdesk-team", "General"]

@app.patch("/tickets/{ticket_id}")
async def update_ticket(ticket_id: int, update_data: TicketUpdate, user = Depends(require_staff)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        updates = []
        params = []
        if update_data.status:
            updates.append("status = %s")
            params.append(update_data.status)
        if update_data.assigned_team:
            updates.append("assigned_team = %s")
            params.append(update_data.assigned_team)
            
        if not updates:
            return {"message": "No updates provided"}
            
        query = f"UPDATE tickets SET {', '.join(updates)} WHERE id = %s"
        params.append(ticket_id)
        
        cursor.execute(query, tuple(params))
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        user_email = user["sub"]
        await send_log("ticket_updated", user_email, f"Ticket #{ticket_id} updated: {update_data}")
        return {"message": "Ticket updated successfully"}
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8016)
