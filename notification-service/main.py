from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="LAAC Notification Service")

class Notification(BaseModel):
    target_role: str
    message: str
    data: Optional[dict] = None
    timestamp: datetime = datetime.now()
    read: bool = False

# In-memory notifications (for simulation)
notifications: List[Notification] = []

@app.post("/notify")
async def send_notification(notif: Notification):
    notif.timestamp = datetime.now()
    notifications.append(notif)
    # Keep only last 50
    if len(notifications) > 50:
        notifications.pop(0)
    return {"status": "sent"}

@app.get("/notifications/{role}")
async def get_notifications(role: str):
    # Return unread notifications for this role
    role_notifs = [n for n in notifications if n.target_role == role and not n.read]
    # Mark as read
    for n in role_notifs:
        n.read = True
    return role_notifs

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
