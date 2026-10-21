from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Multi-Tier Notes API"


def test_create_and_get_note():
    # Test creating a note with list tags
    payload = {
        "title": "Unit Test Note",
        "content": "This is a test note content for multi-tier verification.",
        "tags": ["testing", "fastapi", "react"],
    }
    response = client.post("/api/notes", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Unit Test Note"
    assert data["content"] == payload["content"]
    assert data["tags"] == ["testing", "fastapi", "react"]
    assert "id" in data
    note_id = data["id"]

    # Test retrieving single note
    get_res = client.get(f"/api/notes/{note_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == note_id
    assert get_res.json()["title"] == "Unit Test Note"


def test_validation_errors():
    # Empty title should fail with 422
    response = client.post("/api/notes", json={"title": "", "content": "Valid content"})
    assert response.status_code == 422

    # Missing content should fail with 422
    response = client.post("/api/notes", json={"title": "Valid title"})
    assert response.status_code == 422


def test_update_and_delete_note():
    # Create note
    res = client.post("/api/notes", json={"title": "To Update", "content": "Original content"})
    assert res.status_code == 201
    note_id = res.json()["id"]

    # Update note
    update_res = client.put(f"/api/notes/{note_id}", json={"title": "Updated Title", "tags": ["updated"]})
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Title"
    assert update_res.json()["tags"] == ["updated"]

    # Delete note
    del_res = client.delete(f"/api/notes/{note_id}")
    assert del_res.status_code == 204

    # Verify deleted note returns 404
    get_res = client.get(f"/api/notes/{note_id}")
    assert get_res.status_code == 404
