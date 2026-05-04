from fastapi.testclient import TestClient
from main import app
import pytest

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "LAAC Orchestrator is running", "status": "active"}

def test_health_check_no_db():
    # This might fail if DB is not running, which is expected in a unit test 
    # unless we mock the engine/session.
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
