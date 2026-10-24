import os
import tempfile
import unittest
from pathlib import Path
from urllib.parse import quote

BACKEND_DIR = Path(__file__).resolve().parents[1]
os.environ["DATABASE_URL"] = "sqlite:///" + Path(tempfile.mktemp(suffix=".sqlite3")).as_posix()
os.environ["JWT_SECRET_KEY"] = "test-secret-key-that-is-only-used-by-tests"
os.environ["GROQ_API_KEY"] = "test-key-not-used-by-these-tests"

import sys
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app
from models import Base
from database import engine


class FlowBIApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.database_path = os.environ["DATABASE_URL"].removeprefix("sqlite:///")

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        engine.dispose()
        Path(cls.database_path).unlink(missing_ok=True)

    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        self.owner_headers = self._register_login("owner@example.com")

    def _register_login(self, email):
        registered = self.client.post(
            "/users",
            json={"name": "FlowBI User", "email": email, "password": "safe-pass-123"},
        )
        self.assertEqual(registered.status_code, 200, registered.text)
        logged_in = self.client.post(
            "/login", json={"email": email, "password": "safe-pass-123"}
        )
        self.assertEqual(logged_in.status_code, 200, logged_in.text)
        return {"Authorization": f"Bearer {logged_in.json()['access_token']}"}

    def _upload_csv(self, headers, filename="scores.csv"):
        return self.client.post(
            "/datasets",
            content=b"name,score\nA,10\nA,10\nB,\n",
            headers={**headers, "X-Filename": quote(filename), "Content-Type": "text/csv"},
        )

    def test_dataset_upload_is_parsed_and_requires_authentication(self):
        denied = self.client.post(
            "/datasets",
            content=b"name,score\nA,10\n",
            headers={"X-Filename": "scores.csv", "Content-Type": "text/csv"},
        )
        self.assertEqual(denied.status_code, 403)

        uploaded = self._upload_csv(self.owner_headers)
        self.assertEqual(uploaded.status_code, 200, uploaded.text)
        self.assertEqual(uploaded.json()["name"], "scores.csv")
        self.assertEqual(len(uploaded.json()["data"]), 3)
        self.assertIsNone(uploaded.json()["data"][2]["score"])

    def test_actual_upload_body_over_20_mib_is_rejected(self):
        oversized = b"x" * (20 * 1024 * 1024 + 1)
        response = self.client.post(
            "/datasets",
            content=oversized,
            headers={**self.owner_headers, "X-Filename": "large.csv", "Content-Type": "text/csv"},
        )
        self.assertEqual(response.status_code, 413)

    def test_history_saves_and_returns_pipeline_result_details(self):
        uploaded = self._upload_csv(self.owner_headers)
        dataset_id = uploaded.json()["id"]
        run = self.client.post(
            "/pipelines/run",
            headers=self.owner_headers,
            json={"dataset_id": dataset_id, "operations": ["remove-duplicates", "missing-values", "statistics"]},
        )
        self.assertEqual(run.status_code, 200, run.text)
        run_id = run.json()["run_id"]

        detail = self.client.get(f"/pipelines/{run_id}", headers=self.owner_headers)
        self.assertEqual(detail.status_code, 200, detail.text)
        self.assertEqual(detail.json()["result"]["preview"][0]["name"], "A")
        self.assertGreater(len(detail.json()["result"]["statistics"]["columnStats"]), 0)

        other_user_headers = self._register_login("other@example.com")
        self.assertEqual(self.client.get("/datasets", headers=other_user_headers).json(), [])
        self.assertEqual(self.client.get(f"/pipelines/{run_id}", headers=other_user_headers).status_code, 404)

    def test_invalid_upload_extension_is_rejected(self):
        response = self.client.post(
            "/datasets",
            content=b"not a dataset",
            headers={**self.owner_headers, "X-Filename": "notes.txt", "Content-Type": "text/plain"},
        )
        self.assertEqual(response.status_code, 415)


if __name__ == "__main__":
    unittest.main()
