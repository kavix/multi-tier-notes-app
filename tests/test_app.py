import time
import requests
import pytest

BASE_URL = "http://localhost:8088"

def test_static_page_served():
    resp = requests.get(f"{BASE_URL}/")
    assert resp.status_code == 200
    assert "5-Tier Distributed Notes" in resp.text
    assert "<form id=\"noteForm\">" in resp.text

def test_static_assets():
    css = requests.get(f"{BASE_URL}/style.css")
    assert css.status_code == 200
    assert "body" in css.text

    js = requests.get(f"{BASE_URL}/app.js")
    assert js.status_code == 200
    assert "fetchVisits" in js.text

def test_health_check():
    resp = requests.get(f"{BASE_URL}/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["postgres"] == "ok"
    assert data["redis"] == "ok"

def test_visit_counter_increments():
    resp1 = requests.get(f"{BASE_URL}/api/visits")
    assert resp1.status_code == 200
    count1 = resp1.json()["visits"]

    resp2 = requests.get(f"{BASE_URL}/api/visits")
    assert resp2.status_code == 200
    count2 = resp2.json()["visits"]

    assert count2 == count1 + 1

def test_notes_crud_and_redis_caching():
    # 1. Create a note
    unique_title = f"Test Note {int(time.time())}"
    unique_content = "Testing 5-tier FastAPI, Redis, and Postgres integration."

    create_resp = requests.post(
        f"{BASE_URL}/api/notes",
        json={"title": unique_title, "content": unique_content}
    )
    assert create_resp.status_code == 201
    created_note = create_resp.json()
    assert created_note["title"] == unique_title
    assert created_note["content"] == unique_content
    assert "id" in created_note

    # 2. Fetch notes immediately (should be DB query since POST flushes cache)
    get_resp_1 = requests.get(f"{BASE_URL}/api/notes")
    assert get_resp_1.status_code == 200
    data_1 = get_resp_1.json()
    assert data_1["cached"] is False
    assert data_1["source"] == "postgres"
    assert any(n["title"] == unique_title for n in data_1["notes"])

    # 3. Fetch notes immediately again (should hit 10-second Redis cache)
    get_resp_2 = requests.get(f"{BASE_URL}/api/notes")
    assert get_resp_2.status_code == 200
    data_2 = get_resp_2.json()
    assert data_2["cached"] is True
    assert data_2["source"] == "redis-cache"
    assert data_2["ttl_remaining"] is not None
    assert data_2["ttl_remaining"] > 0
    assert any(n["title"] == unique_title for n in data_2["notes"])

if __name__ == "__main__":
    pytest.main(["-v", __file__])
