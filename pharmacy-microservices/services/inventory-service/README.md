# Inventory Service

Microserviço de **controle de estoque** da farmácia.

## Responsabilidade
- Rastrear quantidade atual de cada produto
- Registrar movimentações (entrada/saída)
- Detectar estoque baixo
- **Consumir eventos** de venda e dar baixa automática

## Endpoints principais
| Método | Rota | Descrição |
|--------|------|-----------|
| GET    | `/inventory/stock` | Lista todos os estoques |
| GET    | `/inventory/stock/{produto_id}` | Consulta estoque |
| POST   | `/inventory/movements` | Registra entrada/saída |
| GET    | `/inventory/movements` | Histórico |
| PATCH  | `/inventory/stock/{produto_id}/minimo` | Ajusta mínimo |
| POST   | `/events/sale-created` | **[Evento]** baixa por venda |

## Dependências externas
- **product-service** (via REST, porta 8001) — valida existência de produtos.

## Rodar local
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```
