# Pharmacy Console — Demo Frontend

Interface web estática para consumir o sistema **Pharmacy Microservices**.

## O que é isto?

Uma página HTML única (sem build, sem frameworks, sem npm) que consome a API do gateway e permite:
- Cadastrar e listar medicamentos
- Dar entrada/saída em estoque e ver alertas de estoque baixo
- Registrar vendas multi-item e observar o estoque baixando automaticamente (prova visual de que os eventos funcionam)
- Ver cada requisição HTTP em tempo real no log do rodapé

**Nada disso** é "produção" — é uma demo didática. Para um frontend de verdade, veja a seção "Evoluções sugeridas" no README principal.

## Como usar

**Pré-requisitos:** o backend deve estar rodando (gateway em `localhost:8000` + os 3 serviços).

### Opção 1 — Abrir direto no navegador

Clique duplo em `index.html`. Funciona porque adicionamos CORS permissivo no gateway.

### Opção 2 — Servir via Python (recomendado)

```powershell
cd frontend
python -m http.server 5000
```
Depois acesse: http://localhost:5000

Esta opção evita possíveis quirks de `file://` em alguns navegadores e serve como exemplo de separação frontend/backend em origens distintas.

## Arquitetura

```
  Browser                 Gateway              Microsserviços
  ┌───────┐   HTTP    ┌────────────┐    HTTP   ┌──────────────┐
  │index  │──────────▶│  :8000     │──────────▶│ product :8001│
  │.html  │  JSON     │  (proxy)   │  JSON     │ inventory    │
  └───────┘           └────────────┘           │ sales        │
                                               └──────────────┘
```

O frontend conhece apenas o **gateway**. Não fala diretamente com nenhum microsserviço. Isso é o padrão ideal: cliente tem 1 endereço, evolução do backend fica transparente.

## Paleta e tipografia

- **Cores**: off-white quente (papel), ink profundo, acento sálvia (status saudável), terracota (ações primárias/alertas)
- **Fontes**: Fraunces (display editorial), Figtree (corpo), JetBrains Mono (código/IDs)

## Valor didático

Este frontend foi intencionalmente construído em **vanilla JS** para os alunos conseguirem ler e entender **cada linha**. Nenhuma "magia" de framework. Bons pontos de discussão em aula:

1. Como o CORS foi habilitado no gateway e por quê
2. O padrão de **API client** instrumentado (veja `api()` — log automático de cada chamada)
3. Separação de escopo: um único frontend consome 3 microsserviços sem nunca falar diretamente com eles
4. Como uma ação (venda) dispara múltiplas mudanças no sistema (prova do event-driven via `sale.created`)
