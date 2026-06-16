import sys
import os
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient

# Add orq directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../orq')))

from main import app, get_db, ESCALATED_INCIDENTS

# --- MOCKS FOR DB AND HTTP CLIENT ---

class MockResponse:
    def __init__(self, json_data, status_code=200, content=b"mock content", headers=None):
        self._json_data = json_data
        self.status_code = status_code
        self.content = content
        self.headers = headers or {"content-type": "application/json"}

    def json(self):
        return self._json_data

class MockAsyncClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    async def get(self, url, params=None, headers=None, *args, **kwargs):
        if "is_following" in url:
            return MockResponse({"following": True})
        elif "followers" in url:
            return MockResponse([{"id": 1, "email": "follower@ubi.pt", "name": "Maria Silva", "avatar": "avatar_url"}])
        elif "following" in url:
            return MockResponse([{"id": 2, "email": "following@ubi.pt", "name": "Rita Santos", "avatar": "avatar_url"}])
        elif "profiles/" in url:
            return MockResponse({"email": "test@ubi.pt", "name": "Tiago Silva"})
        elif "users" in url:
            return MockResponse([{"id": 1, "email": "test@ubi.pt"}])
        elif "logs" in url:
            return MockResponse([{"id": 1, "level": "INFO", "message": "Log test"}])
        elif "news" in url:
            return MockResponse([{"id": 1, "title": "Noticia UBI"}])
        elif "events" in url:
            return MockResponse([{"id": 1, "title": "Evento Académico"}])
        elif "faqs" in url:
            return MockResponse([{"id": 1, "question": "O que é a UBI?"}])
        elif "alerts/history" in url:
            return MockResponse([{"id": 1, "type": "panic"}])
        elif "alerts" in url:
            return MockResponse([{"id": 1, "status": "active"}])
        elif "static/uploads" in url:
            return MockResponse(None, status_code=200, content=b"image_bytes", headers={"content-type": "image/png"})
        elif "calendar/" in url:
            return MockResponse({"year": "2023/2024", "events": []})
        elif "courses" in url:
            return MockResponse([{"id": 1, "name": "EI"}])
        elif "subjects" in url:
            return MockResponse([{"id": 1, "name": "POO"}])
        elif "classes" in url:
            return MockResponse([{"id": 1, "weekday": 1}])
        elif "notifications/" in url:
            return MockResponse([{"id": 1, "message": "Notification"}])
        elif "messages/" in url:
            return MockResponse([{"sender_email": "mentor@ubi.pt", "message": "Olá"}])
        elif "tickets/stats" in url:
            return MockResponse({"open": 5, "resolved": 10})
        elif "tickets" in url:
            return MockResponse([{"id": 1, "title": "Ticket UBI"}])
        elif "staff/teams" in url:
            return MockResponse([{"team": "frontdesk"}])
        elif "locations" in url:
            return MockResponse([{"id": 1, "building": "Bloco VI"}])
        elif "route" in url:
            return MockResponse({"distance_meters": 150})
        elif "uploads/" in url:
            return MockResponse(None, status_code=200, content=b"upload_bytes", headers={"content-type": "image/jpeg"})
        elif "feed" in url:
            return MockResponse([{"id": 1, "content": "Feed post"}])
        elif "roles" in url:
            return MockResponse([{"role_name": "student"}])
        elif "comments" in url:
            return MockResponse([{"id": 1, "content": "Comentario"}])
        
        return MockResponse({"status": "mocked_get", "url": url})

    async def post(self, url, json=None, data=None, files=None, params=None, headers=None, *args, **kwargs):
        if "like" in url:
            return MockResponse({"status": "liked"})
        elif "comment" in url:
            return MockResponse({"id": 1, "content": json.get("content")})
        elif "bot/message" in url:
            msg = json.get("message", "") if json else ""
            if "não consegui compreender" in msg.lower():
                return MockResponse({"reply": "Não consegui compreender a sua questão."})
            return MockResponse({"reply": "Resposta automática do Bot"})
        elif "register" in url:
            return MockResponse({"id": 2, "email": json.get("email")})
        elif "login" in url:
            return MockResponse({"token": "jwt_token_example"})
        elif "tickets" in url:
            return MockResponse({"id": 123, "title": json.get("title")})
        elif "posts" in url:
            content = data.get("content") if data else "post"
            return MockResponse({"id": 1, "content": content})
        elif "follow" in url:
            return MockResponse({"status": "followed"})
        elif "calls" in url:
            return MockResponse({"status": "call_requested"})
        elif "messages" in url:
            return MockResponse({"status": "message_sent"})
        elif "notify" in url:
            return MockResponse({"status": "notification_sent"})

        return MockResponse({"status": "mocked_post", "url": url, "json": json})

    async def put(self, url, json=None, *args, **kwargs):
        return MockResponse({"status": "mocked_put", "url": url, "json": json})

    async def delete(self, url, *args, **kwargs):
        return MockResponse({"status": "mocked_delete", "url": url})

    async def patch(self, url, json=None, *args, **kwargs):
        return MockResponse({"status": "mocked_patch", "url": url, "json": json})


# FastAPI Dependency Overrides
def mock_get_db():
    db = MagicMock()
    return db

app.dependency_overrides[get_db] = mock_get_db
client = TestClient(app)

# Reset escalated incidents before each test
@pytest.fixture(autouse=True)
def run_before_and_after_tests():
    ESCALATED_INCIDENTS.clear()
    yield

# --- TESTS ---

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "LAAC Orchestrator is running", "status": "active"}

def test_health_success():
    # Test health check when DB works
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "database": "connected"}

def test_health_failure():
    # Test health check when DB throws an exception
    mock_db = MagicMock()
    mock_db.execute.side_effect = Exception("DB Connection Timeout")
    app.dependency_overrides[get_db] = lambda: mock_db
    
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "degraded"
    assert "DB Connection Timeout" in response.json()["database"]
    
    # Restore mock_get_db override
    app.dependency_overrides[get_db] = mock_get_db

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_users_endpoints():
    # GET /users
    res_get = client.get("/users")
    assert res_get.status_code == 200
    assert res_get.json() == [{"id": 1, "email": "test@ubi.pt"}]

    # PUT /users/{user_id}
    res_put = client.put("/users/1", json={"email": "new@ubi.pt"})
    assert res_put.status_code == 200
    assert res_put.json()["status"] == "mocked_put"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_logs_endpoint():
    response = client.get("/logs")
    assert response.status_code == 200
    assert response.json()[0]["level"] == "INFO"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_news_endpoints():
    # GET /news
    res_get = client.get("/news")
    assert res_get.status_code == 200
    assert res_get.json()[0]["title"] == "Noticia UBI"

    # POST /news
    res_post = client.post("/news", json={"title": "Nova Noticia"})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_bot_message_endpoint():
    response = client.post("/bot/message", json={"message": "Olá"})
    assert response.status_code == 200
    assert response.json() == {"reply": "Resposta automática do Bot"}

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_events_endpoints():
    # GET /events
    res_get = client.get("/events?category=desporto")
    assert res_get.status_code == 200
    assert res_get.json()[0]["title"] == "Evento Académico"

    # POST /events
    res_post = client.post("/events", json={"title": "Novo Evento"})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_faqs_endpoint():
    response = client.get("/faqs")
    assert response.status_code == 200
    assert response.json()[0]["question"] == "O que é a UBI?"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_emergency_alerts_endpoints():
    # POST /emergency/alerts
    res_post = client.post("/emergency/alerts", json={"type": "panic"})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

    # GET /emergency/alerts
    res_get = client.get("/emergency/alerts")
    assert res_get.status_code == 200
    assert res_get.json()[0]["status"] == "active"

    # PUT /emergency/alerts/{alert_id}
    res_put = client.put("/emergency/alerts/1", json={"status": "resolved"})
    assert res_put.status_code == 200
    assert res_put.json()["status"] == "mocked_put"

    # GET /emergency/history
    res_hist = client.get("/emergency/history")
    assert res_hist.status_code == 200
    assert res_hist.json()[0]["type"] == "panic"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_profiles_endpoints():
    # GET /profiles/{email}
    res_get = client.get("/profiles/test@ubi.pt")
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "Tiago Silva"

    # POST /profiles
    res_post = client.post("/profiles", json={"name": "Tiago Silva Update"})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

    # POST /profiles/upload
    # Mocking multi-part file upload
    file_payload = {"file": ("avatar.png", b"avatar_bytes", "image/png")}
    res_upload = client.post("/profiles/upload", files=file_payload)
    assert res_upload.status_code == 200
    assert res_upload.json()["status"] == "mocked_post"

    # GET /profile-static/uploads/{filename}
    res_static = client.get("/profile-static/uploads/avatar.png")
    assert res_static.status_code == 200
    assert res_static.headers["content-type"] == "image/png"
    assert res_static.content == b"image_bytes"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_calendar_endpoints():
    # GET /calendar/{academic_year}
    res_get = client.get("/calendar/2023-2024")
    assert res_get.status_code == 200
    assert res_get.json()["year"] == "2023/2024"

    # POST /calendar/reports/schedule
    res_report = client.post("/calendar/reports/schedule", json={"issue": "overlap"}, headers={"Authorization": "Bearer token"})
    assert res_report.status_code == 200
    assert res_report.json()["status"] == "mocked_post"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_academic_courses_and_subjects():
    # GET /courses
    res_courses = client.get("/courses?study_cycle=1")
    assert res_courses.status_code == 200
    assert res_courses.json()[0]["name"] == "EI"

    # GET /subjects
    res_subjects = client.get("/subjects?course_id=1&curricular_year=1")
    assert res_subjects.status_code == 200
    assert res_subjects.json()[0]["name"] == "POO"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_classes_endpoints():
    # GET /classes
    res_get = client.get("/classes?course_id=1")
    assert res_get.status_code == 200
    assert res_get.json()[0]["weekday"] == 1

    # POST /classes
    res_post = client.post("/classes", json={"subject_id": 1, "weekday": 1})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

    # DELETE /classes/{class_id}
    res_del = client.delete("/classes/1")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "mocked_delete"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_notifications_endpoint():
    response = client.get("/notifications/student")
    assert response.status_code == 200
    assert response.json()[0]["message"] == "Notification"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_chat_messages_endpoint_flow():
    # 1. GET /chat/messages/{incident_id}
    res_get = client.get("/chat/messages/100")
    assert res_get.status_code == 200
    assert res_get.json()[0]["sender_email"] == "mentor@ubi.pt"

    # 2. POST /chat/messages - normal message (bot answers)
    payload_normal = {"incident_id": 100, "sender_email": "caloiro@ubi.pt", "message": "Qual é a sala de POO?", "is_responder": False}
    res_normal = client.post("/chat/messages", json=payload_normal)
    assert res_normal.status_code == 200
    assert res_normal.json()["status"] == "resolved_by_bot"
    assert ESCALATED_INCIDENTS.get(100) is None

    # 3. POST /chat/messages - message containing critical keyword (escalates to human)
    payload_critical = {"incident_id": 100, "sender_email": "caloiro@ubi.pt", "message": "Estou em pânico, tive um acidente!", "is_responder": False}
    res_critical = client.post("/chat/messages", json=payload_critical)
    assert res_critical.status_code == 200
    assert res_critical.json()["status"] == "escalated_to_human"
    assert ESCALATED_INCIDENTS.get(100) is True

    # 4. POST /chat/messages - message when already escalated
    payload_after = {"incident_id": 100, "sender_email": "caloiro@ubi.pt", "message": "Preciso mesmo que venham", "is_responder": False}
    res_after = client.post("/chat/messages", json=payload_after)
    assert res_after.status_code == 200
    assert res_after.json()["status"] == "message_sent"

    # Reset escalation for next test case
    ESCALATED_INCIDENTS.clear()

    # 5. POST /chat/messages - message triggering bot fallback ("não consegui compreender")
    payload_fallback = {"incident_id": 101, "sender_email": "caloiro@ubi.pt", "message": "como posso fazer isto não consegui compreender", "is_responder": False}
    res_fallback = client.post("/chat/messages", json=payload_fallback)
    assert res_fallback.status_code == 200
    assert res_fallback.json()["status"] == "escalated_due_to_fallback"
    assert ESCALATED_INCIDENTS.get(101) is True

    # 6. POST /chat/messages - message from responder (human staff)
    payload_responder = {"incident_id": 102, "sender_email": "frontdesk@ubi.pt", "message": "Olá, sou a Rita. Como posso ajudar?", "is_responder": True}
    res_resp = client.post("/chat/messages", json=payload_responder)
    assert res_resp.status_code == 200
    assert res_resp.json()["status"] == "message_sent"
    assert ESCALATED_INCIDENTS.get(102) is True

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_emergency_call():
    response = client.post("/emergency/call", json={"phone": "999999999"})
    assert response.status_code == 200
    assert response.json()["status"] == "call_requested"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_auth_endpoints():
    # POST /auth/login
    res_login = client.post("/auth/login", json={"email": "caloiro@ubi.pt", "password": "pass"})
    assert res_login.status_code == 200
    assert "token" in res_login.json()

    # POST /auth/register
    res_reg = client.post("/auth/register", json={"email": "docente@ubi.pt", "password": "pass"})
    assert res_reg.status_code == 200
    assert res_reg.json()["email"] == "docente@ubi.pt"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_tickets_endpoints():
    # POST /tickets
    res_post = client.post("/tickets", json={"title": "Problema horários"}, headers={"Authorization": "Bearer token"})
    assert res_post.status_code == 200
    assert res_post.json()["title"] == "Problema horários"

    # GET /tickets
    res_get = client.get("/tickets?status=open&team=frontdesk", headers={"Authorization": "Bearer token"})
    assert res_get.status_code == 200
    assert res_get.json()[0]["title"] == "Ticket UBI"

    # GET /tickets/stats
    res_stats = client.get("/tickets/stats", headers={"Authorization": "Bearer token"})
    assert res_stats.status_code == 200
    assert res_stats.json()["open"] == 5

    # GET /staff/teams
    res_teams = client.get("/staff/teams", headers={"Authorization": "Bearer token"})
    assert res_teams.status_code == 200
    assert res_teams.json()[0]["team"] == "frontdesk"

    # PATCH /tickets/{ticket_id}
    res_patch = client.patch("/tickets/123", json={"status": "resolved"}, headers={"Authorization": "Bearer token"})
    assert res_patch.status_code == 200
    assert res_patch.json()["status"] == "mocked_patch"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_locations_and_route():
    # GET /locations
    res_loc = client.get("/locations")
    assert res_loc.status_code == 200
    assert res_loc.json()[0]["building"] == "Bloco VI"

    # GET /route
    res_route = client.get("/route?start_lat=40.281&start_lng=-7.502&dest_id=B6&time=14:00")
    assert res_route.status_code == 200
    assert res_route.json()["distance_meters"] == 150

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_posts_and_social_features():
    # POST /posts (form data)
    # Using simple form inputs
    data_payload = {
        "user_id": (None, "1"),
        "content": (None, "Olá comunidade!"),
        "organization_id": (None, "2")
    }
    # Mocking files too
    file_payload = {
        "image": ("image.jpg", b"image_data", "image/jpeg")
    }
    response = client.post("/posts", data=data_payload, files=file_payload)
    assert response.status_code == 200
    assert response.json()["content"] == "Olá comunidade!"

    # GET /uploads/{filename}
    res_upload = client.get("/uploads/image.jpg")
    assert res_upload.status_code == 200
    assert res_upload.headers["content-type"] == "image/jpeg"
    assert res_upload.content == b"upload_bytes"

    # GET /feed
    res_feed = client.get("/feed")
    assert res_feed.status_code == 200
    assert res_feed.json()[0]["content"] == "Feed post"

    # POST /posts/{post_id}/like
    res_like = client.post("/posts/1/like?user_id=1")
    assert res_like.status_code == 200
    assert res_like.json()["status"] == "liked"

    # POST /posts/{post_id}/comment
    res_comment = client.post("/posts/1/comment", json={"user_id": 1, "content": "Excelente iniciativa!"})
    assert res_comment.status_code == 200
    assert res_comment.json()["content"] == "Excelente iniciativa!"

    # GET /posts/{post_id}/comments
    res_comments = client.get("/posts/1/comments")
    assert res_comments.status_code == 200
    assert res_comments.json()[0]["content"] == "Comentario"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_roles_endpoints():
    # GET /roles
    res_get = client.get("/roles")
    assert res_get.status_code == 200
    assert res_get.json()[0]["role_name"] == "student"

    # POST /roles
    res_post = client.post("/roles", json={"role_name": "professor"})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

    # PUT /roles/{role_name}
    res_put = client.put("/roles/student", json={"permissions": ["read"]})
    assert res_put.status_code == 200
    assert res_put.json()["status"] == "mocked_put"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_following_endpoints():
    # POST /profiles/{follower_id}/follow/{followed_id}
    res_follow = client.post("/profiles/1/follow/2")
    assert res_follow.status_code == 200
    assert res_follow.json()["status"] == "followed"

    # GET /profiles/{user_id}/following
    res_following = client.get("/profiles/1/following")
    assert res_following.status_code == 200
    assert res_following.json()[0]["id"] == 2

    # GET /profiles/{user_id}/followers
    res_followers = client.get("/profiles/1/followers")
    assert res_followers.status_code == 200
    assert res_followers.json()[0]["id"] == 1

    # GET /profiles/{user_id}/is_following/{target_id}
    res_check = client.get("/profiles/1/is_following/2")
    assert res_check.status_code == 200
    assert res_check.json()["following"] is True
