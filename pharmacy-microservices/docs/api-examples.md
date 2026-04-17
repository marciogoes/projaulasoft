# API Examples — Pharmacy Microservices

Exemplos prontos de requisições via `curl`. Assume que os serviços estão rodando via `docker-compose up`.

> 💡 **Dica didática:** todas as APIs têm Swagger em `/docs`. É lá que você deveria experimentar primeiro.

---

## Via API Gateway (recomendado)

Todas as chamadas passam pelo gateway em `localhost:8000/api/*`.

### 1. Cadastrar medicamentos
```bash
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Dipirona 500mg 20cpr",
    "codigo_barras": "7891234000001",
    "fabricante": "EMS",
    "preco": 12.50,
    "requer_receita": false
  }'
```

```bash
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Amoxicilina 500mg 21cps",
    "codigo_barras": "7891234000002",
    "fabricante": "Eurofarma",
    "preco": 35.90,
    "requer_receita": true
  }'
```

### 2. Listar medicamentos
```bash
curl http://localhost:8000/api/products
```

### 3. Dar entrada em estoque
```bash
curl -X POST http://localhost:8000/api/inventory/movements \
  -H "Content-Type: application/json" \
  -d '{
    "produto_id": 1,
    "tipo": "ENTRADA",
    "quantidade": 100,
    "observacao": "Compra fornecedor A — NF 12345"
  }'
```

### 4. Consultar estoque de um produto
```bash
curl http://localhost:8000/api/inventory/stock/1
```

### 5. Listar apenas itens com estoque baixo
```bash
curl "http://localhost:8000/api/inventory/stock?apenas_baixo=true"
```

### 6. Registrar venda
```bash
curl -X POST http://localhost:8000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "João Silva",
    "itens": [
      {"produto_id": 1, "quantidade": 2},
      {"produto_id": 2, "quantidade": 1}
    ]
  }'
```

Após esta chamada, o estoque dos produtos 1 e 2 será decrementado automaticamente via evento.

### 7. Ver vendas
```bash
curl http://localhost:8000/api/sales
curl http://localhost:8000/api/sales/1
```

---

## Verificando a saúde do sistema

### Health agregado (via gateway)
```bash
curl http://localhost:8000/health
```
Retorna status do gateway e de cada serviço downstream:
```json
{
  "gateway": "ok",
  "services": {
    "product": "ok",
    "inventory": "ok",
    "sales": "ok"
  }
}
```

### Health de cada serviço individualmente
```bash
curl http://localhost:8001/health   # product
curl http://localhost:8002/health   # inventory
curl http://localhost:8003/health   # sales
```

---

## Cenários didáticos — prove que funciona

### Cenário 1: Venda bem-sucedida abate o estoque
```bash
# 1. Cadastra produto
ID=$(curl -s -X POST http://localhost:8000/api/products -H "Content-Type: application/json" \
  -d '{"nome":"Teste","codigo_barras":"9999999999999","fabricante":"X","preco":10}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['id'])")

# 2. Dá entrada de 50
curl -X POST http://localhost:8000/api/inventory/movements -H "Content-Type: application/json" \
  -d "{\"produto_id\":$ID,\"tipo\":\"ENTRADA\",\"quantidade\":50}"

# 3. Confirma 50 em estoque
curl http://localhost:8000/api/inventory/stock/$ID

# 4. Vende 3
curl -X POST http://localhost:8000/api/sales -H "Content-Type: application/json" \
  -d "{\"itens\":[{\"produto_id\":$ID,\"quantidade\":3}]}"

# 5. Confirma 47 em estoque (baixa automática via evento!)
curl http://localhost:8000/api/inventory/stock/$ID
```

### Cenário 2: Venda falha se não há estoque
```bash
# Tentar vender mais do que há em estoque → HTTP 409
curl -X POST http://localhost:8000/api/sales -H "Content-Type: application/json" \
  -d '{"itens":[{"produto_id":1,"quantidade":99999}]}'
```

### Cenário 3: Venda falha se produto não existe
```bash
# Produto inexistente → HTTP 404
curl -X POST http://localhost:8000/api/sales -H "Content-Type: application/json" \
  -d '{"itens":[{"produto_id":99999,"quantidade":1}]}'
```

### Cenário 4: Isolamento dos bancos
```bash
# product-service não enxerga estoque — não deveria mesmo.
curl http://localhost:8001/products/1            # OK
curl http://localhost:8001/inventory/stock/1     # 404 — não tem esse endpoint!
```

---

## Explorando pela documentação interativa

| Serviço | URL |
|---------|-----|
| Gateway | http://localhost:8000/docs |
| Product | http://localhost:8001/docs |
| Inventory | http://localhost:8002/docs |
| Sales | http://localhost:8003/docs |

Cada `/docs` é uma UI do Swagger onde você pode testar os endpoints direto do navegador.
