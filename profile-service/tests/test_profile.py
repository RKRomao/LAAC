import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import json

# Import from main service file
from main import app, get_db

class TestProfileService(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_db = MagicMock()
        app.dependency_overrides[get_db] = lambda: self.mock_db

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_profile_not_found(self):
        # Mock query: users fetchone returns None (user not found)
        self.mock_db.execute.return_value.fetchone.return_value = None
        
        response = self.client.get("/profiles/nonexistent@ubi.pt")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Utilizador não encontrado")

    def test_get_profile_new_user_default_values(self):
        # Mock user_id query: user exists, id=10
        self.mock_db.execute.return_value.fetchone.side_effect = [(10,), None]
        # Mock organizations query: empty list
        self.mock_db.execute.return_value.fetchall.return_value = []
        
        response = self.client.get("/profiles/newuser@ubi.pt")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "newuser@ubi.pt")
        self.assertEqual(response.json()["display_name"], "newuser")
        self.assertEqual(response.json()["course"], "Não especificado")
        self.assertEqual(response.json()["organizations"], [])

    def test_get_profile_existing(self):
        # Mock user_id: (10,)
        # Mock profile: (email, display_name, bio, avatar_url, course, year, social_links, banner_url, privacy_settings)
        profile_data = ("existing@ubi.pt", "Tiago Silva", "Bio test", "avatar_url", "EI", 2, '{"instagram": "tiago"}', "banner_url", '{"show_email": true}')
        self.mock_db.execute.return_value.fetchone.side_effect = [(10,), profile_data]
        # Mock organizations
        self.mock_db.execute.return_value.fetchall.return_value = [(1, "Núcleo EI", "Academic", "Member")]
        
        response = self.client.get("/profiles/existing@ubi.pt")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["display_name"], "Tiago Silva")
        self.assertEqual(response.json()["course"], "EI")
        self.assertEqual(response.json()["organizations"][0]["name"], "Núcleo EI")

    def test_update_profile_new(self):
        # Check exists returns None
        self.mock_db.execute.return_value.fetchone.return_value = None
        
        response = self.client.post("/profiles", json={
            "email": "test@ubi.pt",
            "display_name": "Tiago Updated",
            "course": "EI",
            "year": 1
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")
        self.assertTrue(self.mock_db.commit.called)

    def test_update_profile_existing(self):
        # Check exists returns 1
        self.mock_db.execute.return_value.fetchone.return_value = (1,)
        
        response = self.client.post("/profiles", json={
            "email": "test@ubi.pt",
            "display_name": "Tiago Updated",
            "course": "EI",
            "year": 2
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")
        self.assertTrue(self.mock_db.commit.called)

    @patch("shutil.copyfileobj")
    @patch("builtins.open")
    def test_upload_image(self, mock_open, mock_copy):
        file_payload = {"file": ("avatar.jpg", b"fake_bytes", "image/jpeg")}
        response = self.client.post("/profiles/upload", files=file_payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("/profile-static/uploads/", response.json()["url"])

    def test_follow_user_create_follow(self):
        # Mocking first insert to succeed
        response = self.client.post("/profiles/1/follow/2")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")
        self.assertEqual(response.json()["action"], "followed")
        self.assertTrue(self.mock_db.commit.called)

    def test_follow_user_toggle_unfollow(self):
        # Mocking insert to fail (throws exception) to trigger unfollow branch
        self.mock_db.execute.side_effect = [Exception("Already follows"), None]
        
        response = self.client.post("/profiles/1/follow/2")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")
        self.assertEqual(response.json()["action"], "unfollowed")
        self.assertTrue(self.mock_db.commit.called)

    def test_follow_self_error(self):
        response = self.client.post("/profiles/1/follow/1")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Não podes seguir-te a ti próprio")

    def test_get_following(self):
        # returns row list of (id, display_name, avatar_url)
        self.mock_db.execute.return_value.fetchall.return_value = [
            (2, "Silva UBI", "avatar_url")
        ]
        
        response = self.client.get("/profiles/1/following")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["id"], 2)
        self.assertEqual(response.json()[0]["name"], "Silva UBI")

    def test_is_following(self):
        # returns 1 if following, None if not
        self.mock_db.execute.return_value.fetchone.side_effect = [(1,), None]
        
        # 1. Is following
        res1 = self.client.get("/profiles/1/is_following/2")
        self.assertEqual(res1.status_code, 200)
        self.assertTrue(res1.json()["is_following"])

        # 2. Is not following
        res2 = self.client.get("/profiles/1/is_following/2")
        self.assertEqual(res2.status_code, 200)
        self.assertFalse(res2.json()["is_following"])

if __name__ == "__main__":
    unittest.main()
