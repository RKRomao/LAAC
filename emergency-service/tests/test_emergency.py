import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Import from main service file
from main import app, get_db

class TestEmergencyService(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_db = MagicMock()
        app.dependency_overrides[get_db] = lambda: self.mock_db

    def tearDown(self):
        app.dependency_overrides.clear()

    @patch("httpx.AsyncClient")
    def test_create_alert_chat_type(self, mock_httpx_client):
        # Chat type alerts do not notify response team via post
        mock_cursor = MagicMock()
        mock_cursor.lastrowid = 12
        self.mock_db.execute.return_value = mock_cursor
        
        # Mocking httpx call
        mock_client_instance = MagicMock()
        mock_httpx_client.return_value.__aenter__.return_value = mock_client_instance
        
        response = self.client.post("/alerts", json={
            "user_email": "caloiro@ubi.pt",
            "type": "chat",
            "lat": 40.28,
            "lng": -7.5
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "alert_received")
        self.assertIn("Mentor Digital", response.json()["message"])
        self.assertEqual(response.json()["incident_id"], 12)
        self.assertTrue(self.mock_db.commit.called)

    @patch("httpx.AsyncClient")
    def test_create_alert_other_type(self, mock_httpx_client):
        # Other types notify response-team
        mock_cursor = MagicMock()
        mock_cursor.lastrowid = 15
        self.mock_db.execute.return_value = mock_cursor
        
        mock_client_instance = MagicMock()
        mock_httpx_client.return_value.__aenter__.return_value = mock_client_instance
        
        response = self.client.post("/alerts", json={
            "user_email": "caloiro@ubi.pt",
            "type": "call",
            "lat": 40.28,
            "lng": -7.5
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "alert_received")
        self.assertIn("A ajuda está a caminho", response.json()["message"])
        self.assertTrue(mock_client_instance.post.called)

    def test_list_alerts(self):
        # returns row details: (id, user_email, type, status, lat, lng, created_at)
        self.mock_db.execute.return_value.fetchall.return_value = [
            (1, "caloiro@ubi.pt", "silent", "PENDENTE", 40.28, -7.5, "2026-06-03 12:00:00")
        ]
        
        response = self.client.get("/alerts")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["status"], "PENDENTE")
        self.assertEqual(response.json()[0]["type"], "silent")

    def test_get_alerts_history(self):
        # returns (id, user_email, type, status, lat, lng, created_at, resolved_at, resolution_note)
        self.mock_db.execute.return_value.fetchall.return_value = [
            (1, "caloiro@ubi.pt", "silent", "RESOLVIDO", 40.28, -7.5, "2026-06-03 12:00:00", "2026-06-03 12:30:00", "Tudo ok")
        ]
        
        response = self.client.get("/alerts/history")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["status"], "RESOLVIDO")
        self.assertEqual(response.json()[0]["resolution_note"], "Tudo ok")

    @patch("httpx.AsyncClient")
    def test_update_alert(self, mock_httpx_client):
        mock_client_instance = MagicMock()
        mock_httpx_client.return_value.__aenter__.return_value = mock_client_instance
        
        response = self.client.put("/alerts/1", json={
            "status": "RESOLVIDO",
            "resolution_note": "Apoio enviado."
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "updated")
        self.assertTrue(self.mock_db.commit.called)
        self.assertTrue(mock_client_instance.post.called)

if __name__ == "__main__":
    unittest.main()
