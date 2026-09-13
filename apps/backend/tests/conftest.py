"""Pytest test client and database fixtures."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timezone, timedelta
from app.database import Base, get_db
from app.ingest.real_data_loader import run_real_ingestion
from app.models.alert import Alert
from app.models.road import RoadSegment
from app.main import app

# Use in-memory SQLite for high-speed isolated test runs
TEST_DB_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create test tables, ingest real data, and configure test operational records."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    run_real_ingestion(db)

    now = datetime.now(timezone.utc)
    # Add an active test alert linked to an authentic zone for alert workflow tests
    test_alert = Alert(
        alert_id="ALT-TEST-001",
        title="Landslide Warning - Sohra Sector",
        zone_id="ZONE-EAST-KHASI-HILLS",
        severity="Critical",
        status="pending_review",
        draft_message="Continuous rainfall saturation triggers high probability of slope failure.",
        escalation_deadline=now + timedelta(minutes=30),
        created_at=now,
    )
    db.add(test_alert)

    test_alert_2 = Alert(
        alert_id="ALT-TEST-002",
        title="Cautionary Rainfall Warning - Nongstoin",
        zone_id="ZONE-WEST-KHASI-HILLS",
        severity="High",
        status="pending_review",
        draft_message="Localized slope runoff along highway cut.",
        escalation_deadline=now + timedelta(minutes=60),
        created_at=now,
    )
    db.add(test_alert_2)

    # Add a blocked road segment for reroute testing
    blocked_road = RoadSegment(
        road_id="RD-TEST-BLOCKED",
        name="NH-106 Mountain Cut Blockage",
        road_class="national_highway",
        zone_id="ZONE-EAST-KHASI-HILLS",
        status="blocked",
        blockage_reason="Active mudslide across 50m highway section.",
        start_point="Shillong",
        end_point="Nongstoin",
        is_single_access=False,
        status_updated_at=now,
    )
    db.add(blocked_road)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide isolated database session per test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """Provide FastAPI test client wired to test database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
