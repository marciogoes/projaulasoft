"""
conftest.py — Fixtures compartilhadas dos testes.

Usa banco de dados em memória (SQLite :memory:) para isolar cada
teste, garantindo que não sobram dados entre execuções.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db


@pytest.fixture()
def client():
    """Cliente de teste com banco SQLite em memória."""
    # Banco em memória + StaticPool para compartilhar a conexão entre
    # a thread do TestClient e a thread do app.
    engine = create_engine(
        "sqlite:///:memory:",
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
    yield TestClient(app)
    app.dependency_overrides.clear()
