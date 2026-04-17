# Sales Service

Microserviço de **vendas** — orquestra product + inventory e publica eventos.

## Responsabilidade
- Registrar vendas
- Calcular total (buscando preço no product-service)
- Validar estoque disponível (via inventory-service)
- **Publicar evento `sale.created`** (inventory consome para baixa)

## Endpoints
| Método | Rota | Descrição |
|--------|------|-----------|
| POST   | `/sales` | Registra venda |
| GET    | `/sales` | Lista vendas |
| GET    | `/sales/{id}` | Detalha venda |

## Dependências externas
- **product-service** (REST) — preços
- **inventory-service** (REST) — verificar estoque + receber evento

## Fluxo (SAGA simplificada)
```
1. POST /sales
2. [sales] → GET /products/:id       (product-service)
3. [sales] → GET /inventory/stock/:id (inventory-service)
4. [sales] grava venda localmente
5. [sales] → POST /events/sale-created (inventory-service)
6. [inventory] dá baixa em cada item
```
