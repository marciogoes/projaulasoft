# Product Service

Microserviço de **catálogo de medicamentos** da farmácia.

## Responsabilidade
Manter os dados cadastrais dos produtos: nome, código de barras, fabricante, preço, flag de receita.

**Não tem conhecimento de estoque ou vendas** — outros serviços cuidam disso.

## Endpoints
| Método | Rota | Descrição |
|--------|------|-----------|
| POST   | `/products` | Cadastra novo produto |
| GET    | `/products` | Lista produtos (paginado) |
| GET    | `/products/{id}` | Busca por ID |
| PATCH  | `/products/{id}` | Atualização parcial |
| DELETE | `/products/{id}` | Remove produto |
| GET    | `/health` | Health check |

Documentação interativa: http://localhost:8001/docs

## Rodar local
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Testar
```bash
pytest -v
```
