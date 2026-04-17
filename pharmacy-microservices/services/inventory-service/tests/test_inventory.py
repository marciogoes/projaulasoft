"""Testes de integração do inventory-service."""


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200


def test_dar_entrada_em_produto_novo(client):
    r = client.post("/inventory/movements", json={
        "produto_id": 1,
        "tipo": "ENTRADA",
        "quantidade": 50,
        "observacao": "Compra inicial",
    })
    assert r.status_code == 201
    # Estoque deve refletir a entrada
    r2 = client.get("/inventory/stock/1")
    assert r2.status_code == 200
    assert r2.json()["quantidade"] == 50


def test_saida_sem_estoque_retorna_409(client):
    r = client.post("/inventory/movements", json={
        "produto_id": 1,
        "tipo": "SAIDA",
        "quantidade": 5,
    })
    assert r.status_code == 409


def test_entrada_seguida_de_saida(client):
    client.post("/inventory/movements", json={
        "produto_id": 1, "tipo": "ENTRADA", "quantidade": 100,
    })
    r = client.post("/inventory/movements", json={
        "produto_id": 1, "tipo": "SAIDA", "quantidade": 30,
    })
    assert r.status_code == 201
    assert client.get("/inventory/stock/1").json()["quantidade"] == 70


def test_produto_inexistente_no_catalogo(client_produto_inexistente):
    r = client_produto_inexistente.post("/inventory/movements", json={
        "produto_id": 99, "tipo": "ENTRADA", "quantidade": 10,
    })
    assert r.status_code == 404


def test_listar_apenas_estoque_baixo(client):
    # Entra 5 unidades (abaixo do mínimo padrão 10)
    client.post("/inventory/movements", json={
        "produto_id": 1, "tipo": "ENTRADA", "quantidade": 5,
    })
    # Entra 50 unidades em outro (acima do mínimo)
    client.post("/inventory/movements", json={
        "produto_id": 2, "tipo": "ENTRADA", "quantidade": 50,
    })
    r = client.get("/inventory/stock?apenas_baixo=true")
    assert r.status_code == 200
    ids = [s["produto_id"] for s in r.json()]
    assert 1 in ids and 2 not in ids


def test_evento_venda_criada_baixa_estoque(client):
    # Prepara estoque
    client.post("/inventory/movements", json={
        "produto_id": 1, "tipo": "ENTRADA", "quantidade": 100,
    })
    client.post("/inventory/movements", json={
        "produto_id": 2, "tipo": "ENTRADA", "quantidade": 100,
    })
    # Simula evento de venda
    r = client.post("/events/sale-created", json={
        "evento": "sale.created",
        "venda_id": 42,
        "itens": [
            {"produto_id": 1, "quantidade": 3},
            {"produto_id": 2, "quantidade": 5},
        ],
    })
    assert r.status_code == 200
    assert client.get("/inventory/stock/1").json()["quantidade"] == 97
    assert client.get("/inventory/stock/2").json()["quantidade"] == 95


def test_atualizar_estoque_minimo(client):
    client.post("/inventory/movements", json={
        "produto_id": 1, "tipo": "ENTRADA", "quantidade": 20,
    })
    r = client.patch("/inventory/stock/1/minimo", json={"estoque_minimo": 5})
    assert r.status_code == 200
    assert r.json()["estoque_minimo"] == 5
