import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import jwt

# Import from main service file
from main import app, get_db, SECRET_KEY, ALGORITHM

class TestAuthService(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_db = MagicMock()
        app.dependency_overrides[get_db] = lambda: self.mock_db

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_register_new_user(self):
        # Mock checking: existing user is None
        self.mock_db.execute.return_value.fetchone.return_value = None
        
        response = self.client.post("/register", json={
            "email": "newcaloiro@ubi.pt",
            "password": "strongpassword123",
            "role": "aluno"
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Utilizador criado com sucesso")
        self.assertTrue(self.mock_db.commit.called)

    def test_register_existing_user(self):
        # Mock checking: user already exists
        self.mock_db.execute.return_value.fetchone.return_value = (1,)
        
        response = self.client.post("/register", json={
            "email": "existing@ubi.pt",
            "password": "pass",
            "role": "aluno"
        })
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "E-mail já registado")

    def test_login_admin(self):
        response = self.client.post("/login", json={
            "email": "admin@laac.pt",
            "password": "admin123"
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertEqual(response.json()["role"], "admin")

    @patch("main.pwd_context.verify")
    def test_login_user_success(self, mock_verify):
        # Mock user query return row: (id, hashed_pass, role)
        self.mock_db.execute.return_value.fetchone.return_value = (12, "hashed_pass", "aluno")
        mock_verify.return_value = True
        
        response = self.client.post("/login", json={
            "email": "caloiro@ubi.pt",
            "password": "mypassword"
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertEqual(response.json()["role"], "aluno")
        self.assertEqual(response.json()["user_id"], 12)

    def test_login_user_failed(self):
        self.mock_db.execute.return_value.fetchone.return_value = None
        
        response = self.client.post("/login", json={
            "email": "wrong@ubi.pt",
            "password": "wrongpassword"
        })
        
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "E-mail ou palavra-passe incorretos")

    def test_list_users(self):
        # Mocking database fetchall to return some users
        self.mock_db.execute.return_value.fetchall.return_value = [
            (1, "u1@ubi.pt", "aluno", "912345678", 1, "2026-06-03 12:00:00"),
            (2, "u2@ubi.pt", "docente", None, 0, "2026-06-03 13:00:00")
        ]
        
        response = self.client.get("/users")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)
        self.assertEqual(response.json()[0]["email"], "u1@ubi.pt")
        self.assertEqual(response.json()[1]["role"], "docente")

    def test_update_user(self):
        response = self.client.put("/users/1", json={
            "role": "docente",
            "phone": "999999999",
            "is_online": True
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Utilizador atualizado com sucesso")
        self.assertTrue(self.mock_db.commit.called)

    def test_validate_token_success(self):
        # Generate token
        token = jwt.encode({"sub": "caloiro@ubi.pt"}, SECRET_KEY, algorithm=ALGORITHM)
        response = self.client.get(f"/validate?token={token}")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["valid"])
        self.assertEqual(response.json()["user"], "caloiro@ubi.pt")

    def test_validate_token_invalid(self):
        response = self.client.get("/validate?token=invalid_token")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Token inválido")

    def test_list_roles(self):
        # Returns (role_name, description, permissions)
        self.mock_db.execute.return_value.fetchall.return_value = [
            ("aluno", "Estudante", '["read", "chat"]')
        ]
        
        response = self.client.get("/roles")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["role_name"], "aluno")
        self.assertIn("chat", response.json()[0]["permissions"])

    def test_create_role(self):
        response = self.client.post("/roles", json={
            "role_name": "gestor",
            "description": "Gestor de Núcleo",
            "permissions": ["manage_events"]
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Role gestor criado")
        self.assertTrue(self.mock_db.commit.called)

    def test_update_role(self):
        response = self.client.put("/roles/gestor", json={
            "description": "Novo Gestor",
            "permissions": ["manage_events", "edit_feed"]
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Role gestor atualizado")
        self.assertTrue(self.mock_db.commit.called)

if __name__ == "__main__":
    unittest.main()
