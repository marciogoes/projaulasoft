# API Gateway

Ponto único de entrada do sistema.

## Responsabilidade
- Rotear requisições `/api/*` para o microserviço correto
- Agregar health check
- (Futuro: autenticação, rate limiting, cache)

## Roteamento
| Prefixo cliente | → Serviço downstream |
|-----------------|----------------------|
| `/api/products/*` | product-service (8001) |
| `/api/inventory/*` | inventory-service (8002) |
| `/api/sales/*` | sales-service (8003) |

## Health agregado
```bash
curl http://localhost:8000/health
```
Retorna o status de todos os serviços downstream.
