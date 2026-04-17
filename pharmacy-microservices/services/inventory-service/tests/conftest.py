"""
conftest.py — Fixtures do inventory-service.

Demonstra MOCKING de chamadas externas (product-service).
Nos testes, não queremos depender de outro serviço estar rodando —
isolamos o SUT (System Under Test) substituindo as chamadas externas.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app import product_client


@pytest.fixture()
def client(monkeypatch):
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

    # Mock do product-service — sempre retorna produto válido
    def fake_validar(produto_id: int):
        return {"id": produto_id, "nome": "Produto Fake", "preco": 10.0}

    monkeypatch.setattr(product_client, "validar_produto", fake_validar)

    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def client_produto_inexistente(monkeypatch):
    """Cliente onde o product-service sempre retorna 404."""
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

    def fake_validar(produto_id: int):
        raise product_client.ProductNotFoundError(f"Produto {produto_id} não existe")

    monkeypatch.setattr(product_client, "validar_produto", fake_validar)

    yield TestClient(app)
    app.dependency_overrides.clear()
