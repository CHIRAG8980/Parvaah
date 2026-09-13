"""Tests for user registration, authentication, token validation, and officer directory."""

def test_register_login_and_me(client):
    """Verify full authentic auth lifecycle: register -> login -> inspect /me."""
    username = "officer_shillong_test"
    password = "SafePassword2026!"

    # 1. Register new user
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "password": password,
            "full_name": "Test Officer Shillong",
            "role": "District Disaster Management Officer",
            "district": "East Khasi Hills",
            "contact_number": "+91-9876543210",
        },
    )
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert reg_data["username"] == username
    assert "access_token" in reg_data
    token = reg_data["access_token"]

    # 2. Duplicate registration fails
    dup_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "password": password,
            "full_name": "Duplicate Officer",
            "role": "Citizen",
            "district": "East Khasi Hills",
        },
    )
    assert dup_response.status_code == 400

    # 3. Login with correct credentials
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["username"] == username
    assert login_data["access_token"] == token

    # 4. Login with wrong password fails
    wrong_login = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": "WrongPassword123"},
    )
    assert wrong_login.status_code == 401

    # 5. Access /auth/me with Bearer token
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["username"] == username
    assert me_data["full_name"] == "Test Officer Shillong"
    assert me_data["district"] == "East Khasi Hills"

    # 6. Access /auth/me without token fails
    unauth_response = client.get("/api/v1/auth/me")
    assert unauth_response.status_code == 401


def test_list_and_create_officers(client):
    """Verify emergency officer directory listing and creation."""
    list_res = client.get("/api/v1/auth/officers")
    assert list_res.status_code == 200
    officers = list_res.json()
    assert isinstance(officers, list)
