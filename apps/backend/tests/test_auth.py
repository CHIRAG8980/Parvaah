"""Comprehensive tests for production-grade authentication, cookies, refresh rotation, CSRF, rate limiting, and RBAC."""

import time
from app.config import settings


def test_login_sets_httponly_cookies_and_csrf(client):
    """Verify login authenticates official and issues secure HttpOnly cookies + CSRF cookie."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password123"},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert data["username"] == "admin"
    assert data["role"] == "admin"
    assert "access_token" in data
    assert "csrf_token" in data

    # Verify cookies
    cookies = login_res.cookies
    assert settings.ACCESS_TOKEN_COOKIE_NAME in cookies
    assert settings.REFRESH_TOKEN_COOKIE_NAME in cookies
    assert settings.CSRF_COOKIE_NAME in cookies


def test_auth_me_via_cookie_and_bearer(client):
    """Verify /auth/me works with both HttpOnly cookie session and Bearer header."""
    # 1. Login to obtain session
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "sdma_director", "password": "password123"},
    )
    assert login_res.status_code == 200
    access_token = login_res.json()["access_token"]

    # 2. Access /me via Cookie (browser flow)
    me_cookie = client.get("/api/v1/auth/me")
    assert me_cookie.status_code == 200
    me_data = me_cookie.json()
    assert me_data["username"] == "sdma_director"
    assert me_data["role"] == "state_officer"
    assert me_data["district"] == "Statewide HQ"
    assert "csrf_token" in me_data

    # 3. Access /me via Bearer header
    # Clear cookies on client temporarily
    client.cookies.clear()
    me_bearer = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_bearer.status_code == 200
    assert me_bearer.json()["username"] == "sdma_director"

    # 4. Access without any credentials fails with 401
    unauth = client.get("/api/v1/auth/me")
    assert unauth.status_code == 401


def test_refresh_token_rotation_and_replay_detection(client):
    """Verify rotating refresh tokens and invalidating entire token family upon reuse."""
    # 1. Initial Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "dmo_east_khasi", "password": "password123"},
    )
    assert login_res.status_code == 200
    initial_refresh_cookie = login_res.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)
    assert initial_refresh_cookie is not None

    # 2. Perform legitimate token refresh
    refresh_res = client.post("/api/v1/auth/refresh")
    assert refresh_res.status_code == 200
    rotated_refresh_cookie = refresh_res.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)
    assert rotated_refresh_cookie is not None
    assert rotated_refresh_cookie != initial_refresh_cookie

    # 3. Replay attack: Attacker attempts to use the OLD (now rotated/revoked) refresh token
    client.cookies.set(settings.REFRESH_TOKEN_COOKIE_NAME, initial_refresh_cookie)
    replay_res = client.post("/api/v1/auth/refresh")
    assert replay_res.status_code == 401
    assert "Token reuse detected" in replay_res.json()["detail"]

    # 4. Verify family revocation: The newest token is ALSO now revoked
    client.cookies.set(settings.REFRESH_TOKEN_COOKIE_NAME, rotated_refresh_cookie)
    subsequent_res = client.post("/api/v1/auth/refresh")
    assert subsequent_res.status_code == 401


def test_logout_revokes_session_and_clears_cookies(client):
    """Verify logout revokes the active refresh token and deletes session cookies."""
    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password123"},
    )
    assert login_res.status_code == 200

    # Logout
    logout_res = client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "success"

    # Subsequent /auth/me should fail
    me_res = client.get("/api/v1/auth/me")
    assert me_res.status_code == 401


def test_rbac_and_officer_provisioning(client):
    """Verify that only Admin/State Officers can provision emergency officials and view directory."""
    # 1. District officer cannot provision new officials
    client.post(
        "/api/v1/auth/login",
        json={"username": "dmo_east_khasi", "password": "password123"},
    )
    csrf = client.cookies.get(settings.CSRF_COOKIE_NAME)

    forbidden_res = client.post(
        "/api/v1/auth/officers",
        headers={"X-CSRF-Token": csrf},
        json={
            "username": "officer_illegal",
            "password": "Password123!",
            "full_name": "Illegal Provision Officer",
            "role": "district_officer",
            "district": "West Khasi Hills",
        },
    )
    assert forbidden_res.status_code == 403

    # 2. Admin successfully provisions new official
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password123"},
    )
    admin_csrf = client.cookies.get(settings.CSRF_COOKIE_NAME)

    create_res = client.post(
        "/api/v1/auth/officers",
        headers={"X-CSRF-Token": admin_csrf},
        json={
            "username": "dmo_west_khasi",
            "password": "SafePassword2026!",
            "full_name": "Dr. Wanbha Marbaniang",
            "role": "district_officer",
            "district": "West Khasi Hills",
        },
    )
    assert create_res.status_code == 201
    assert create_res.json()["username"] == "dmo_west_khasi"

    # 3. List officers authorized
    list_res = client.get("/api/v1/auth/officers")
    assert list_res.status_code == 200
    officers = list_res.json()
    assert any(o["username"] == "dmo_west_khasi" for o in officers)


def test_csrf_protection_on_mutating_requests(client):
    """Verify CSRF double-submit protection blocks mutating requests without valid header token."""
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "password123"},
    )

    # Attempt password change without X-CSRF-Token header
    fail_res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "password123", "new_password": "BrandNewSecurePassword123!"},
    )
    assert fail_res.status_code == 403
    assert "CSRF" in fail_res.json()["detail"]

    # Supply valid X-CSRF-Token header
    valid_csrf = client.cookies.get(settings.CSRF_COOKIE_NAME)
    success_res = client.post(
        "/api/v1/auth/change-password",
        headers={"X-CSRF-Token": valid_csrf},
        json={"current_password": "password123", "new_password": "BrandNewSecurePassword123!"},
    )
    assert success_res.status_code == 200

    # Reset password back for subsequent tests
    new_csrf = client.cookies.get(settings.CSRF_COOKIE_NAME)
    client.post(
        "/api/v1/auth/change-password",
        headers={"X-CSRF-Token": new_csrf},
        json={"current_password": "BrandNewSecurePassword123!", "new_password": "password123"},
    )


def test_rate_limiting_on_login(client):
    """Verify rapid repeated failed login attempts trigger 429 Too Many Requests."""
    for _ in range(5):
        res = client.post(
            "/api/v1/auth/login",
            json={"username": "rate_limit_target", "password": "WrongPassword!"},
        )
        assert res.status_code in (401, 429)

    rate_limited_res = client.post(
        "/api/v1/auth/login",
        json={"username": "rate_limit_target", "password": "WrongPassword!"},
    )
    assert rate_limited_res.status_code == 429
    assert "Too many failed login attempts" in rate_limited_res.json()["detail"]
