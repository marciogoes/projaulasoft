"""
test_products.py — Testes de integração do Product Service.

Pirâmide de testes (Aula 07):
 - Unidade: testes puros de funções (não vistos aqui)
 - Integração: testes HTTP via TestClient (estes testes)
 - E2E: testes cobrindo múltiplos serviços (fora deste arquivo)
"""


def _produto_valido(codigo="7891111111111"):
    return {
        "nome": "Paracetamol 500mg",
        "codigo_barras": codigo,
        "fabricante": "Medley",
        "preco": 8.90,
        "requer_receita": False,
    }


# --- Health check ---------------------------------------------------
def test_health_retorna_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# --- Criação --------------------------------------------------------
def test_criar_produto_com_sucesso(client):
    r = client.post("/products", json=_produto_valido())
    assert r.status_code == 201
    body = r.json()
    assert body["id"] > 0
    assert body["nome"] == "Paracetamol 500mg"
    assert body["ativo"] is True


def test_criar_produto_duplicado_retorna_409(client):
    client.post("/products", json=_produto_valido())
    r = client.post("/products", json=_produto_valido())
    assert r.status_code == 409


def test_criar_produto_com_preco_invalido_retorna_422(client):
    payload = _produto_valido()
    payload["preco"] = -1
    r = client.post("/products", json=payload)
    assert r.status_code == 422


# --- Leitura --------------------------------------------------------
def test_listar_produtos_vazio(client):
    r = client.get("/products")
    assert r.status_code == 200
    assert r.json() == []


def test_buscar_produto_inexistente_retorna_404(client):
    r = client.get("/products/999")
    assert r.status_code == 404


def test_buscar_produto_existente(client):
    criado = client.post("/products", json=_produto_valido()).json()
    r = client.get(f"/products/{criado['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == criado["id"]


# --- Atualização ----------------------------------------------------
def test_atualizar_preco(client):
    criado = client.post("/products", json=_produto_valido()).json()
    r = client.patch(f"/products/{criado['id']}", json={"preco": 9.99})
    assert r.status_code == 200
    assert r.json()["preco"] == 9.99


def test_atualizar_produto_inexistente_retorna_404(client):
    r = client.patch("/products/999", json={"preco": 10.0})
    assert r.status_code == 404


# --- Exclusão -------------------------------------------------------
def test_remover_produto(client):
    criado = client.post("/products", json=_produto_valido()).json()
    r = client.delete(f"/products/{criado['id']}")
    assert r.status_code == 204
    # Não deve mais encontrar
    assert client.get(f"/products/{criado['id']}").status_code == 404
