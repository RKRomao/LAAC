from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient

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
        elif "following" in url:
            return MockResponse([{"id": 2}])
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
    # Tests GET /
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "LAAC Orchestrator is running", "status": "active"}

def test_health_success():
    # Tests GET /health with successful DB ping
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "database": "connected"}

def test_health_failure():
    # Tests GET /health with database error
    mock_db = MagicMock()
    mock_db.execute.side_effect = Exception("DB Connection Timeout")
    app.dependency_overrides[get_db] = lambda: mock_db
    
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "degraded"
    assert "DB Connection Timeout" in response.json()["database"]
    
    # Restore standard mock override
    app.dependency_overrides[get_db] = mock_get_db

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_users_endpoints():
    # Tests GET /users
    res_get = client.get("/users")
    assert res_get.status_code == 200
    assert res_get.json() == [{"id": 1, "email": "test@ubi.pt"}]

    # Tests PUT /users/{user_id}
    res_put = client.put("/users/1", json={"email": "new@ubi.pt"})
    assert res_put.status_code == 200
    assert res_put.json()["status"] == "mocked_put"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_logs_endpoint():
    # Tests GET /logs
    response = client.get("/logs")
    assert response.status_code == 200
    assert response.json()[0]["level"] == "INFO"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_news_endpoints():
    # Tests GET /news
    res_get = client.get("/news")
    assert res_get.status_code == 200
    assert res_get.json()[0]["title"] == "Noticia UBI"

    # Tests POST /news
    res_post = client.post("/news", json={"title": "Nova Noticia"})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_bot_message_endpoint():
    # Tests POST /bot/message
    response = client.post("/bot/message", json={"message": "Olá"})
    assert response.status_code == 200
    assert response.json() == {"reply": "Resposta automática do Bot"}

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_events_endpoints():
    # Tests GET /events
    res_get = client.get("/events?category=desporto")
    assert res_get.status_code == 200
    assert res_get.json()[0]["title"] == "Evento Académico"

    # Tests POST /events
    res_post = client.post("/events", json={"title": "Novo Evento"})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_faqs_endpoint():
    # Tests GET /faqs
    response = client.get("/faqs")
    assert response.status_code == 200
    assert response.json()[0]["question"] == "O que é a UBI?"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_emergency_alerts_endpoints():
    # Tests POST /emergency/alerts
    res_post = client.post("/emergency/alerts", json={"type": "panic"})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

    # Tests GET /emergency/alerts
    res_get = client.get("/emergency/alerts")
    assert res_get.status_code == 200
    assert res_get.json()[0]["status"] == "active"

    # Tests PUT /emergency/alerts/{alert_id}
    res_put = client.put("/emergency/alerts/1", json={"status": "resolved"})
    assert res_put.status_code == 200
    assert res_put.json()["status"] == "mocked_put"

    # Tests GET /emergency/history
    res_hist = client.get("/emergency/history")
    assert res_hist.status_code == 200
    assert res_hist.json()[0]["type"] == "panic"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_profiles_endpoints():
    # Tests GET /profiles/{email}
    res_get = client.get("/profiles/test@ubi.pt")
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "Tiago Silva"

    # Tests POST /profiles
    res_post = client.post("/profiles", json={"name": "Tiago Silva Update"})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

    # Tests POST /profiles/upload
    file_payload = {"file": ("avatar.png", b"avatar_bytes", "image/png")}
    res_upload = client.post("/profiles/upload", files=file_payload)
    assert res_upload.status_code == 200
    assert res_upload.json()["status"] == "mocked_post"

    # Tests GET /profile-static/uploads/{filename}
    res_static = client.get("/profile-static/uploads/avatar.png")
    assert res_static.status_code == 200
    assert res_static.headers["content-type"] == "image/png"
    assert res_static.content == b"image_bytes"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_calendar_endpoints():
    # Tests GET /calendar/{academic_year}
    res_get = client.get("/calendar/2023-2024")
    assert res_get.status_code == 200
    assert res_get.json()["year"] == "2023/2024"

    # Tests POST /calendar/reports/schedule
    res_report = client.post("/calendar/reports/schedule", json={"issue": "overlap"}, headers={"Authorization": "Bearer token"})
    assert res_report.status_code == 200
    assert res_report.json()["status"] == "mocked_post"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_academic_courses_and_subjects():
    # Tests GET /courses
    res_courses = client.get("/courses?study_cycle=1")
    assert res_courses.status_code == 200
    assert res_courses.json()[0]["name"] == "EI"

    # Tests GET /subjects
    res_subjects = client.get("/subjects?course_id=1&curricular_year=1")
    assert res_subjects.status_code == 200
    assert res_subjects.json()[0]["name"] == "POO"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_classes_endpoints():
    # Tests GET /classes
    res_get = client.get("/classes?course_id=1")
    assert res_get.status_code == 200
    assert res_get.json()[0]["weekday"] == 1

    # Tests POST /classes
    res_post = client.post("/classes", json={"subject_id": 1, "weekday": 1})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

    # Tests DELETE /classes/{class_id}
    res_del = client.delete("/classes/1")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "mocked_delete"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_notifications_endpoint():
    # Tests GET /notifications/{role}
    response = client.get("/notifications/student")
    assert response.status_code == 200
    assert response.json()[0]["message"] == "Notification"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_chat_messages_endpoint_flow():
    # 1. Tests GET /chat/messages/{incident_id}
    res_get = client.get("/chat/messages/100")
    assert res_get.status_code == 200
    assert res_get.json()[0]["sender_email"] == "mentor@ubi.pt"

    # 2. Tests POST /chat/messages (normal path)
    payload_normal = {"incident_id": 100, "sender_email": "caloiro@ubi.pt", "message": "Qual é a sala de POO?", "is_responder": False}
    res_normal = client.post("/chat/messages", json=payload_normal)
    assert res_normal.status_code == 200
    assert res_normal.json()["status"] == "resolved_by_bot"
    assert ESCALATED_INCIDENTS.get(100) is None

    # 3. Tests POST /chat/messages (critical keyword escalation)
    payload_critical = {"incident_id": 100, "sender_email": "caloiro@ubi.pt", "message": "Estou em pânico, tive um acidente!", "is_responder": False}
    res_critical = client.post("/chat/messages", json=payload_critical)
    assert res_critical.status_code == 200
    assert res_critical.json()["status"] == "escalated_to_human"
    assert ESCALATED_INCIDENTS.get(100) is True

    # 4. Tests POST /chat/messages (subsequent messages after escalation)
    payload_after = {"incident_id": 100, "sender_email": "caloiro@ubi.pt", "message": "Preciso mesmo que venham", "is_responder": False}
    res_after = client.post("/chat/messages", json=payload_after)
    assert res_after.status_code == 200
    assert res_after.json()["status"] == "message_sent"

    # Reset
    ESCALATED_INCIDENTS.clear()

    # 5. Tests POST /chat/messages (fallback escalation)
    payload_fallback = {"incident_id": 101, "sender_email": "caloiro@ubi.pt", "message": "como posso fazer isto não consegui compreender", "is_responder": False}
    res_fallback = client.post("/chat/messages", json=payload_fallback)
    assert res_fallback.status_code == 200
    assert res_fallback.json()["status"] == "escalated_due_to_fallback"
    assert ESCALATED_INCIDENTS.get(101) is True

    # 6. Tests POST /chat/messages (human responder)
    payload_responder = {"incident_id": 102, "sender_email": "frontdesk@ubi.pt", "message": "Olá, sou a Rita. Como posso ajudar?", "is_responder": True}
    res_resp = client.post("/chat/messages", json=payload_responder)
    assert res_resp.status_code == 200
    assert res_resp.json()["status"] == "message_sent"
    assert ESCALATED_INCIDENTS.get(102) is True

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_emergency_call():
    # Tests POST /emergency/call
    response = client.post("/emergency/call", json={"phone": "999999999"})
    assert response.status_code == 200
    assert response.json()["status"] == "call_requested"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_auth_endpoints():
    # Tests POST /auth/login
    res_login = client.post("/auth/login", json={"email": "caloiro@ubi.pt", "password": "pass"})
    assert res_login.status_code == 200
    assert "token" in res_login.json()

    # Tests POST /auth/register
    res_reg = client.post("/auth/register", json={"email": "docente@ubi.pt", "password": "pass"})
    assert res_reg.status_code == 200
    assert res_reg.json()["email"] == "docente@ubi.pt"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_tickets_endpoints():
    # Tests POST /tickets
    res_post = client.post("/tickets", json={"title": "Problema horários"}, headers={"Authorization": "Bearer token"})
    assert res_post.status_code == 200
    assert res_post.json()["title"] == "Problema horários"

    # Tests GET /tickets
    res_get = client.get("/tickets?status=open&team=frontdesk", headers={"Authorization": "Bearer token"})
    assert res_get.status_code == 200
    assert res_get.json()[0]["title"] == "Ticket UBI"

    # Tests GET /tickets/stats
    res_stats = client.get("/tickets/stats", headers={"Authorization": "Bearer token"})
    assert res_stats.status_code == 200
    assert res_stats.json()["open"] == 5

    # Tests GET /staff/teams
    res_teams = client.get("/staff/teams", headers={"Authorization": "Bearer token"})
    assert res_teams.status_code == 200
    assert res_teams.json()[0]["team"] == "frontdesk"

    # Tests PATCH /tickets/{ticket_id}
    res_patch = client.patch("/tickets/123", json={"status": "resolved"}, headers={"Authorization": "Bearer token"})
    assert res_patch.status_code == 200
    assert res_patch.json()["status"] == "mocked_patch"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_locations_and_route():
    # Tests GET /locations
    res_loc = client.get("/locations")
    assert res_loc.status_code == 200
    assert res_loc.json()[0]["building"] == "Bloco VI"

    # Tests GET /route
    res_route = client.get("/route?start_lat=40.281&start_lng=-7.502&dest_id=B6&time=14:00")
    assert res_route.status_code == 200
    assert res_route.json()["distance_meters"] == 150

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_posts_and_social_features():
    # Tests POST /posts
    data_payload = {
        "user_id": (None, "1"),
        "content": (None, "Olá comunidade!"),
        "organization_id": (None, "2")
    }
    file_payload = {
        "image": ("image.jpg", b"image_data", "image/jpeg")
    }
    response = client.post("/posts", data=data_payload, files=file_payload)
    assert response.status_code == 200
    assert response.json()["content"] == "Olá comunidade!"

    # Tests GET /uploads/{filename}
    res_upload = client.get("/uploads/image.jpg")
    assert res_upload.status_code == 200
    assert res_upload.headers["content-type"] == "image/jpeg"
    assert res_upload.content == b"upload_bytes"

    # Tests GET /feed
    res_feed = client.get("/feed")
    assert res_feed.status_code == 200
    assert res_feed.json()[0]["content"] == "Feed post"

    # Tests POST /posts/{post_id}/like
    res_like = client.post("/posts/1/like?user_id=1")
    assert res_like.status_code == 200
    assert res_like.json()["status"] == "liked"

    # Tests POST /posts/{post_id}/comment
    res_comment = client.post("/posts/1/comment", json={"user_id": 1, "content": "Excelente iniciativa!"})
    assert res_comment.status_code == 200
    assert res_comment.json()["content"] == "Excelente iniciativa!"

    # Tests GET /posts/{post_id}/comments
    res_comments = client.get("/posts/1/comments")
    assert res_comments.status_code == 200
    assert res_comments.json()[0]["content"] == "Comentario"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_roles_endpoints():
    # Tests GET /roles
    res_get = client.get("/roles")
    assert res_get.status_code == 200
    assert res_get.json()[0]["role_name"] == "student"

    # Tests POST /roles
    res_post = client.post("/roles", json={"role_name": "professor"})
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "mocked_post"

    # Tests PUT /roles/{role_name}
    res_put = client.put("/roles/student", json={"permissions": ["read"]})
    assert res_put.status_code == 200
    assert res_put.json()["status"] == "mocked_put"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_following_endpoints():
    # Tests POST /profiles/{follower_id}/follow/{followed_id}
    res_follow = client.post("/profiles/1/follow/2")
    assert res_follow.status_code == 200
    assert res_follow.json()["status"] == "followed"

    # Tests GET /profiles/{user_id}/following
    res_following = client.get("/profiles/1/following")
    assert res_following.status_code == 200
    assert res_following.json()[0]["id"] == 2

    # Tests GET /profiles/{user_id}/is_following/{target_id}
    res_check = client.get("/profiles/1/is_following/2")
    assert res_check.status_code == 200
    assert res_check.json()["following"] is True
