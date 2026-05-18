from fastapi.testclient import TestClient
from main import app
import pytest
from unittest.mock import patch, MagicMock

client = TestClient(app)

def test_health_placeholder():
    # Simple placeholder test to verify pytest is working
    assert True

@patch("main.get_db_connection")
def test_create_ticket_validation(mock_db):
    # Test validation (missing required fields)
    response = client.post("/tickets", json={
        "type": "bug"
        # title and description missing
    })
    assert response.status_code == 422

@patch("main.get_db_connection")
@patch("main.send_log")
def test_create_ticket_success(mock_log, mock_db):
    # Mocking DB connection and cursor
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.lastrowid = 123
    
    response = client.post("/tickets", json={
        "type": "bug",
        "title": "Test Bug",
        "description": "This is a test bug description"
    })
    
    assert response.status_code == 201
    assert response.json()["id"] == 123
    mock_cursor.execute.assert_called()
    mock_conn.commit.assert_called()
