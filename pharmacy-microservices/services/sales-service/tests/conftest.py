"""
conftest.py — Fixtures do sales-service.

Mocka completamente os serviços externos (product e inventory),
permitindo testar a lógica do sales isoladamente.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app import external_services


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

    # --- Mocks dos serviços externos ---
    # Catálogo fake: produto 1 custa 10.00, produto 2 custa 25.50
    precos_fake = {1: 10.00, 2: 25.50, 3: 5.00}

    def fake_obter_produto(produto_id: int):
        if produto_id not in precos_fake:
            raise external_services.ProductNotFoundError(f"{produto_id} não existe")
        return {"id": produto_id, "nome": f"Produto {produto_id}",
                "preco": precos_fake[produto_id]}

    # Estoque fake: todos com 100 unidades
    def fake_verificar_estoque(produto_id, quantidade):
        if quantidade > 100:
            raise external_services.EstoqueInsuficienteError(
                f"Produto {produto_id}: solicitado={quantidade}, disponível=100"
            )

    eventos_publicados = []

    def fake_publicar(venda_id, itens):
        eventos_publicados.append({"venda_id": venda_id, "itens": itens})

    monkeypatch.setattr(external_services, "obter_produto", fake_obter_produto)
    monkeypatch.setattr(external_services, "verificar_estoque", fake_verificar_estoque)
    monkeypatch.setattr(external_services, "publicar_venda_criada", fake_publicar)

    tc = TestClient(app)
    tc.eventos_publicados = eventos_publicados  # expõe p/ asserts
    yield tc
    app.dependency_overrides.clear()
