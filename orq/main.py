from fastapi import FastAPI, Depends, UploadFile, File, Form, Header, HTTPException, Response
from typing import Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
import os
import httpx

app = FastAPI(title="LAAC Orchestrator")

# Rastreio de Incidentes Escalados (Triage Híbrida: Bot -> Humanos)
ESCALATED_INCIDENTS = {}

# Database configuration
DB_USER = os.getenv("DB_USER", "laac_user")
DB_PASS = os.getenv("DB_PASS", "laac_pass")
DB_HOST = os.getenv("DB_HOST", "mariadb")
DB_NAME = os.getenv("DB_NAME", "laac_db")

DATABASE_URL = f"mysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

# Service URLs configuration
MAP_SERVICE_URL = os.getenv("MAP_SERVICE_URL", "http://map-service:8001")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8002")
LOGGING_SERVICE_URL = os.getenv("LOGGING_SERVICE_URL", "http://logging-service:8000")
FAQ_SERVICE_URL = os.getenv("FAQ_SERVICE_URL", "http://faq-service:8004")
EMERGENCY_SERVICE_URL = os.getenv("EMERGENCY_SERVICE_URL", "http://emergency-service:8005")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8006")
CHAT_SERVICE_URL = os.getenv("CHAT_SERVICE_URL", "http://chat-service:8007")
CALL_SERVICE_URL = os.getenv("CALL_SERVICE_URL", "http://emergency-call-service:8008")
PROFILE_SERVICE_URL = os.getenv("PROFILE_SERVICE_URL", "http://profile-service:8010")
POST_SERVICE_URL = os.getenv("POST_SERVICE_URL", "http://post-service:8012")
FEED_SERVICE_URL = os.getenv("FEED_SERVICE_URL", "http://feed-service:8013")
CALENDAR_SERVICE_URL = os.getenv("CALENDAR_SERVICE_URL", "http://calendar-service:8011")
ACADEMIC_SERVICE_URL = os.getenv("ACADEMIC_SERVICE_URL", "http://academic-service:3001")
TICKET_SERVICE_URL = os.getenv("TICKET_SERVICE_URL", "http://ticket-service:8016")
CHATBOT_SERVICE_URL = os.getenv("CHATBOT_SERVICE_URL", "http://chatbot-service:8009")
EVENTS_SERVICE_URL = os.getenv("EVENTS_SERVICE_URL", "http://events-service:8014")
NEWS_SERVICE_URL = os.getenv("NEWS_SERVICE_URL", "http://news-service:8015")
CHALLENGE_SERVICE_URL = os.getenv("CHALLENGE_SERVICE_URL", "http://challenge-service:8017")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "LAAC Orchestrator is running", "status": "active"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Try to execute a simple query to check DB connectivity
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": str(e)}

@app.get("/users")
async def get_users():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{AUTH_SERVICE_URL}/users")
        return response.json()

@app.put("/users/{user_id}")
async def update_user(user_id: int, payload: dict):
    async with httpx.AsyncClient() as client:
        response = await client.put(f"{AUTH_SERVICE_URL}/users/{user_id}", json=payload)
        return response.json()

@app.get("/logs")
async def get_logs():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{LOGGING_SERVICE_URL}/logs")
        return response.json()

@app.get("/news")
async def get_news():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{NEWS_SERVICE_URL}/news")
        return response.json()

@app.post("/news")
async def create_news(data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{NEWS_SERVICE_URL}/news", json=data)
        return response.json()

@app.post("/bot/message")
async def bot_message(data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{CHATBOT_SERVICE_URL}/bot/message", json=data)
        return response.json()

@app.get("/events")
async def get_events(category: Optional[str] = None, organization_id: Optional[int] = None):
    async with httpx.AsyncClient() as client:
        params = {}
        if category:
            params["category"] = category
        if organization_id is not None:
            params["organization_id"] = organization_id
        response = await client.get(f"{EVENTS_SERVICE_URL}/events", params=params)
        return response.json()

@app.post("/events")
async def create_event(data: dict):
    org_id = data.get("organization_id")
    user_id = data.get("user_id")
    
    if org_id is not None:
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID é obrigatório para criar evento de núcleo")
        
        # Check permissions via profile-service
        async with httpx.AsyncClient() as client:
            perm_resp = await client.get(f"{PROFILE_SERVICE_URL}/organizations/{org_id}/members/{user_id}/permissions")
            if perm_resp.status_code != 200 or not perm_resp.json().get("can_manage_events"):
                raise HTTPException(status_code=403, detail="Não tens permissão para gerir eventos deste núcleo")
                
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{EVENTS_SERVICE_URL}/events", json=data)
        return response.json()

@app.get("/organizations")
async def get_organizations(type: Optional[str] = None):
    async with httpx.AsyncClient() as client:
        params = {}
        if type:
            params["type"] = type
        response = await client.get(f"{PROFILE_SERVICE_URL}/organizations", params=params)
        return response.json()

@app.get("/organizations/{org_id}")
async def get_organization_details(org_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{PROFILE_SERVICE_URL}/organizations/{org_id}")
        return response.json()

@app.get("/organizations/{org_id}/members/{user_id}/permissions")
async def get_org_member_permissions(org_id: int, user_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{PROFILE_SERVICE_URL}/organizations/{org_id}/members/{user_id}/permissions")
        return response.json()

@app.get("/faqs")
async def get_faqs():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{FAQ_SERVICE_URL}/faqs")
        return response.json()

@app.post("/emergency/alerts")
async def create_emergency(data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{EMERGENCY_SERVICE_URL}/alerts", json=data)
        return response.json()

@app.get("/emergency/alerts")
async def list_emergencies():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{EMERGENCY_SERVICE_URL}/alerts")
        return response.json()

@app.put("/emergency/alerts/{alert_id}")
async def update_emergency_status(alert_id: int, data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.put(f"{EMERGENCY_SERVICE_URL}/alerts/{alert_id}", json=data)
        return response.json()

@app.get("/emergency/history")
async def get_emergency_history():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{EMERGENCY_SERVICE_URL}/alerts/history")
        return response.json()

@app.get("/profiles/{email}")
async def get_user_profile(email: str, res: Response):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{PROFILE_SERVICE_URL}/profiles/{email}")
        res.status_code = response.status_code
        return response.json()

@app.post("/profiles")
async def update_user_profile(data: dict, res: Response):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{PROFILE_SERVICE_URL}/profiles", json=data)
        res.status_code = response.status_code
        return response.json()

@app.post("/profiles/upload")
async def upload_profile_image(file: UploadFile = File(...)):
    async with httpx.AsyncClient() as client:
        files = {"file": (file.filename, await file.read(), file.content_type)}
        response = await client.post(f"{PROFILE_SERVICE_URL}/profiles/upload", files=files)
        return response.json()

@app.get("/profile-static/uploads/{filename}")
async def serve_profile_upload(filename: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{PROFILE_SERVICE_URL}/static/uploads/{filename}")
        from fastapi.responses import Response
        return Response(content=response.content, media_type=response.headers.get("content-type"))

@app.get("/calendar/{academic_year}")
async def get_academic_calendar(academic_year: str):
    # Replace slash if needed, or handle encoding
    # academic_year might be "2023/2024", needs to be passed correctly
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CALENDAR_SERVICE_URL}/calendar/{academic_year}")
        return response.json()

@app.post("/calendar/reports/schedule")
async def report_schedule_problem(data: dict, authorization: Optional[str] = Header(None)):
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": authorization} if authorization else {}
        response = await client.post(f"{CALENDAR_SERVICE_URL}/reports/schedule", json=data, headers=headers)
        return response.json()

@app.get("/courses")
async def get_courses(study_cycle: str = None):
    async with httpx.AsyncClient() as client:
        params = {}
        if study_cycle:
            params["study_cycle"] = study_cycle
        response = await client.get(f"{ACADEMIC_SERVICE_URL}/courses", params=params)
        return response.json()

@app.get("/subjects")
async def get_subjects(course_id: int = None, curricular_year: int = None):
    async with httpx.AsyncClient() as client:
        params = {}
        if course_id: params["course_id"] = course_id
        if curricular_year: params["curricular_year"] = curricular_year
        response = await client.get(f"{ACADEMIC_SERVICE_URL}/subjects", params=params)
        return response.json()

@app.get("/classes")
async def get_classes(course_id: int = None, curricular_year: int = None):
    async with httpx.AsyncClient() as client:
        params = {}
        if course_id:
            params["course_id"] = course_id
        if curricular_year:
            params["curricular_year"] = curricular_year
        response = await client.get(f"{CALENDAR_SERVICE_URL}/classes", params=params)
        if response.status_code != 200:
            print(f"DEBUG: Calendar Service returned {response.status_code}: {response.text}")
        return response.json()
@app.delete("/classes/{class_id}")
async def delete_class(class_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.delete(f"{CALENDAR_SERVICE_URL}/classes/{class_id}")
        return response.json()

@app.post("/classes")
async def create_class(data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{CALENDAR_SERVICE_URL}/classes", json=data)
        return response.json()

@app.get("/notifications/{role}")
async def get_notifs(role: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{NOTIFICATION_SERVICE_URL}/notifications/{role}")
        return response.json()

@app.post("/chat/messages")
async def send_chat(data: dict):
    incident_id = data.get("incident_id")
    sender_email = data.get("sender_email")
    message = data.get("message", "")
    is_responder = data.get("is_responder", False)

    async with httpx.AsyncClient() as client:
        # Se a mensagem vier da equipa de suporte humana, marcamos o incidente como escalado
        if is_responder:
            ESCALATED_INCIDENTS[incident_id] = True
            response = await client.post(f"{CHAT_SERVICE_URL}/messages", json=data)
            return response.json()

        # Enviar primeiro a mensagem do aluno para ficar gravada no histórico
        response = await client.post(f"{CHAT_SERVICE_URL}/messages", json=data)
        
        # Se já estiver escalado para humanos, enviamos a mensagem e notificamos a equipa
        if ESCALATED_INCIDENTS.get(incident_id, False):
            try:
                await client.post(f"{NOTIFICATION_SERVICE_URL}/notify", json={
                    "target_role": "Response-team",
                    "message": f"NOVA MENSAGEM: {sender_email} enviou uma mensagem.",
                    "data": {"type": "chat_message", "incident_id": incident_id, "user": sender_email}
                })
            except:
                pass
            return response.json()

        # Palavras-chave críticas ou pedido de humano para escalamento imediato
        CRITICAL_KEYWORDS = [
            "emergência", "urgência", "pânico", "médico", "acidente", 
            "polícia", "agressão", "ladrão", "roubo", "fogo", "incêndio", 
            "ferido", "hospital", "morrer", "humano", "pessoa", "assistente", "operador"
        ]
        
        msg_lower = message.lower()
        if any(keyword in msg_lower for keyword in CRITICAL_KEYWORDS):
            ESCALATED_INCIDENTS[incident_id] = True
            
            # Bot avisa o utilizador no chat que está a transferir
            bot_msg = "Entendido. Identifiquei um pedido de intervenção urgente ou suporte humano. Vou transferir esta conversa de imediato para a nossa equipa de suporte física (Frontdesk). Por favor, aguarda um momento..."
            await client.post(f"{CHAT_SERVICE_URL}/messages", json={
                "incident_id": incident_id,
                "sender_email": "mentor@ubi.pt",
                "message": bot_msg,
                "is_responder": True
            })
            
            # Envia notificação prioritária para a equipa
            try:
                await client.post(f"{NOTIFICATION_SERVICE_URL}/notify", json={
                    "target_role": "Response-team",
                    "message": f"ESCALAMENTO CRÍTICO: Incidente #{incident_id} transferido para humanos!",
                    "data": {"type": "chat_message", "incident_id": incident_id, "user": sender_email}
                })
            except:
                pass
                
            return {"status": "escalated_to_human"}

        # Se for uma pergunta normal, consultamos o chatbot
        try:
            bot_response = await client.post(f"{CHATBOT_SERVICE_URL}/bot/message", json={"message": message})
            if bot_response.status_code == 200:
                bot_data = bot_response.json()
                reply = bot_data.get("reply", "")
                
                # Se o bot não souber responder (resposta de fallback do chatbot-service)
                if "não consegui compreender" in reply.lower():
                    ESCALATED_INCIDENTS[incident_id] = True
                    
                    bot_msg = "Não consegui responder a essa questão com precisão. Vou transferir esta conversa de imediato para a nossa equipa de suporte humana (Frontdesk). Aguarda um momento..."
                    await client.post(f"{CHAT_SERVICE_URL}/messages", json={
                        "incident_id": incident_id,
                        "sender_email": "mentor@ubi.pt",
                        "message": bot_msg,
                        "is_responder": True
                    })
                    return {"status": "escalated_due_to_fallback"}
                else:
                    # O bot resolveu a questão fútil! Gravamos a resposta dele no chat
                    await client.post(f"{CHAT_SERVICE_URL}/messages", json={
                        "incident_id": incident_id,
                        "sender_email": "mentor@ubi.pt",
                        "message": reply,
                        "is_responder": True
                    })
                    return {"status": "resolved_by_bot"}
        except Exception as e:
            # Em caso de falha no serviço do bot, escala de segurança
            ESCALATED_INCIDENTS[incident_id] = True
            bot_msg = "Detetei uma falha de comunicação com o meu sistema. Vou ligar-te de imediato à equipa de suporte física (Frontdesk). Por favor, aguarda..."
            await client.post(f"{CHAT_SERVICE_URL}/messages", json={
                "incident_id": incident_id,
                "sender_email": "mentor@ubi.pt",
                "message": bot_msg,
                "is_responder": True
            })
            
        return response.json()

@app.get("/chat/messages/{incident_id}")
async def get_chat(incident_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CHAT_SERVICE_URL}/messages/{incident_id}")
        return response.json()

@app.post("/emergency/call")
async def request_call(data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{CALL_SERVICE_URL}/calls", json=data)
        return response.json()

@app.post("/auth/login")
async def login(data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{AUTH_SERVICE_URL}/login", json=data)
        return response.json()

@app.post("/tickets")
async def create_ticket(data: dict, authorization: Optional[str] = Header(None)):
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": authorization} if authorization else {}
        response = await client.post(f"{TICKET_SERVICE_URL}/tickets", json=data, headers=headers)
        return response.json()

@app.get("/tickets")
async def get_tickets(status: str = None, team: str = None, authorization: Optional[str] = Header(None)):
    async with httpx.AsyncClient() as client:
        params = {}
        if status: params["status"] = status
        if team: params["team"] = team
        headers = {"Authorization": authorization} if authorization else {}
        response = await client.get(f"{TICKET_SERVICE_URL}/tickets", params=params, headers=headers)
        return response.json()

@app.get("/tickets/stats")
async def get_ticket_stats(authorization: Optional[str] = Header(None)):
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": authorization} if authorization else {}
        response = await client.get(f"{TICKET_SERVICE_URL}/tickets/stats", headers=headers)
        return response.json()

@app.get("/staff/teams")
async def get_staff_teams(authorization: Optional[str] = Header(None)):
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": authorization} if authorization else {}
        response = await client.get(f"{TICKET_SERVICE_URL}/staff/teams", headers=headers)
        return response.json()

@app.patch("/tickets/{ticket_id}")
async def update_ticket(ticket_id: int, data: dict, authorization: Optional[str] = Header(None)):
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": authorization} if authorization else {}
        response = await client.patch(f"{TICKET_SERVICE_URL}/tickets/{ticket_id}", json=data, headers=headers)
        return response.json()

@app.post("/auth/register")
async def register(data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{AUTH_SERVICE_URL}/register", json=data)
        return response.json()

@app.get("/locations")
async def get_locations():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{MAP_SERVICE_URL}/locations")
        return response.json()

@app.get("/route")
async def get_route(
    start_lat: float, 
    start_lng: float, 
    dest_id: str, 
    time: str = None
):
    async with httpx.AsyncClient() as client:
        params = {
            "start_lat": start_lat,
            "start_lng": start_lng,
            "dest_id": dest_id,
            "time": time
        }
        response = await client.get(f"{MAP_SERVICE_URL}/route", params=params)
        return response.json()

# Social Features
@app.post("/posts")
async def create_post(
    user_id: int = Form(...),
    content: str = Form(...),
    organization_id: int = Form(None),
    image: UploadFile = File(None),
    video: UploadFile = File(None)
):
    async with httpx.AsyncClient() as client:
        files = {}
        if image:
            files["image"] = (image.filename, await image.read(), image.content_type)
        if video:
            files["video"] = (video.filename, await video.read(), video.content_type)
        
        data = {
            "user_id": user_id,
            "content": content
        }
        if organization_id:
            data["organization_id"] = organization_id
            
        response = await client.post(f"{POST_SERVICE_URL}/posts", data=data, files=files)
        return response.json()

@app.get("/uploads/{filename}")
async def serve_upload(filename: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{POST_SERVICE_URL}/uploads/{filename}")
        from fastapi.responses import Response
        return Response(content=response.content, media_type=response.headers.get("content-type"))

@app.get("/feed")
async def get_feed():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{FEED_SERVICE_URL}/feed")
        return response.json()

# Roles & Permissions
@app.get("/roles")
async def get_roles():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{AUTH_SERVICE_URL}/roles")
        return response.json()

@app.put("/roles/{role_name}")
async def update_role(role_name: str, payload: dict):
    async with httpx.AsyncClient() as client:
        response = await client.put(f"{AUTH_SERVICE_URL}/roles/{role_name}", json=payload)
        return response.json()

@app.post("/roles")
async def create_role(payload: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{AUTH_SERVICE_URL}/roles", json=payload)
        return response.json()

@app.post("/posts/{post_id}/like")
async def toggle_like(post_id: int, user_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{POST_SERVICE_URL}/posts/{post_id}/like", params={"user_id": user_id})
        return response.json()

@app.post("/posts/{post_id}/comment")
async def add_comment(post_id: int, data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{POST_SERVICE_URL}/posts/{post_id}/comment", json=data)
        return response.json()

@app.get("/posts/{post_id}/comments")
async def get_comments(post_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{POST_SERVICE_URL}/posts/{post_id}/comments")
        return response.json()

@app.post("/profiles/{follower_id}/follow/{followed_id}")
async def follow_user(follower_id: int, followed_id: int, res: Response):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{PROFILE_SERVICE_URL}/profiles/{follower_id}/follow/{followed_id}")
        res.status_code = response.status_code
        return response.json()

@app.get("/profiles/{user_id}/following")
async def get_following(user_id: int, res: Response):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{PROFILE_SERVICE_URL}/profiles/{user_id}/following")
        res.status_code = response.status_code
        return response.json()

@app.get("/profiles/{user_id}/followers")
async def get_followers(user_id: int, res: Response):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{PROFILE_SERVICE_URL}/profiles/{user_id}/followers")
        res.status_code = response.status_code
        return response.json()

@app.get("/profiles/{user_id}/is_following/{target_id}")
async def check_following(user_id: int, target_id: int, res: Response):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{PROFILE_SERVICE_URL}/profiles/{user_id}/is_following/{target_id}")
        res.status_code = response.status_code
        return response.json()

# Challenge Proxy Routes
@app.get("/challenges")
async def get_challenges():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CHALLENGE_SERVICE_URL}/challenges")
        return response.json()

@app.get("/challenges/{challenge_id}")
async def get_challenge_details(challenge_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CHALLENGE_SERVICE_URL}/challenges/{challenge_id}")
        return response.json()

@app.post("/challenges")
async def create_new_challenge(data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{CHALLENGE_SERVICE_URL}/challenges", json=data)
        return response.json()

@app.post("/challenges/{challenge_id}/submit")
async def submit_challenge_photo(
    challenge_id: int,
    user_id: int = Form(...),
    user_email: str = Form(...),
    caption: str = Form(""),
    image: UploadFile = File(...)
):
    async with httpx.AsyncClient() as client:
        files = {"image": (image.filename, await image.read(), image.content_type)}
        data = {
            "user_id": user_id,
            "user_email": user_email,
            "caption": caption
        }
        response = await client.post(
            f"{CHALLENGE_SERVICE_URL}/challenges/{challenge_id}/submit",
            data=data,
            files=files
        )
        return response.json()

@app.get("/challenges/{challenge_id}/submissions")
async def list_challenge_submissions(challenge_id: int, role: str = "aluno"):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CHALLENGE_SERVICE_URL}/challenges/{challenge_id}/submissions", params={"role": role})
        return response.json()

@app.post("/submissions/{submission_id}/evaluate")
async def evaluate_submission(submission_id: int, data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{CHALLENGE_SERVICE_URL}/submissions/{submission_id}/evaluate", json=data)
        return response.json()

@app.get("/challenge-static/uploads/{filename}")
async def serve_challenge_upload(filename: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CHALLENGE_SERVICE_URL}/uploads/{filename}")
        from fastapi.responses import Response
        return Response(content=response.content, media_type=response.headers.get("content-type"))
