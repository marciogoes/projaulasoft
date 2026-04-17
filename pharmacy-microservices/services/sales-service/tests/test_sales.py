"""Testes de integração do sales-service."""


def test_health(client):
    assert client.get("/health").status_code == 200


def test_criar_venda_simples(client):
    r = client.post("/sales", json={
        "cliente": "Maria Silva",
        "itens": [{"produto_id": 1, "quantidade": 2}],
    })
    assert r.status_code == 201
    body = r.json()
    assert body["total"] == 20.00
    assert body["cliente"] == "Maria Silva"
    assert len(body["itens"]) == 1
    assert body["itens"][0]["subtotal"] == 20.00


def test_criar_venda_varios_itens(client):
    r = client.post("/sales", json={
        "itens": [
            {"produto_id": 1, "quantidade": 3},   # 3 x 10.00 = 30.00
            {"produto_id": 2, "quantidade": 2},   # 2 x 25.50 = 51.00
        ],
    })
    assert r.status_code == 201
    assert r.json()["total"] == 81.00


def test_venda_publica_evento(client):
    client.post("/sales", json={
        "itens": [{"produto_id": 1, "quantidade": 1}],
    })
    # Verifica que o evento foi publicado
    assert len(client.eventos_publicados) == 1
    evento = client.eventos_publicados[0]
    assert evento["itens"] == [{"produto_id": 1, "quantidade": 1}]


def test_venda_com_produto_inexistente(client):
    r = client.post("/sales", json={
        "itens": [{"produto_id": 999, "quantidade": 1}],
    })
    assert r.status_code == 404


def test_venda_com_estoque_insuficiente(client):
    r = client.post("/sales", json={
        "itens": [{"produto_id": 1, "quantidade": 200}],  # mock aceita até 100
    })
    assert r.status_code == 409


def test_venda_sem_itens_invalida(client):
    r = client.post("/sales", json={"itens": []})
    assert r.status_code == 422


def test_listar_vendas(client):
    client.post("/sales", json={"itens": [{"produto_id": 1, "quantidade": 1}]})
    client.post("/sales", json={"itens": [{"produto_id": 2, "quantidade": 1}]})
    r = client.get("/sales")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_detalhar_venda(client):
    criada = client.post("/sales", json={
        "itens": [{"produto_id": 1, "quantidade": 1}],
    }).json()
    r = client.get(f"/sales/{criada['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == criada["id"]


def test_detalhar_venda_inexistente(client):
    assert client.get("/sales/9999").status_code == 404
