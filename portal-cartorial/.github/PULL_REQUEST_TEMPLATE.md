## O que esta PR faz?

<!-- Descreva brevemente as mudancas. Ex: "Adiciona endpoint de cancelamento de pedidos" -->

## Por que essa mudanca?

<!-- Contexto e motivacao. Qual problema resolve? Qual issue resolve? -->

Resolve #<!-- numero da issue -->

## Como testar?

1. `git checkout esta-branch`
2. Execute: `docker compose up -d && cd backend && npm run start:dev`
3. Acesse: `http://localhost:3000/api/docs`
4. Esperado: <!-- descreva o comportamento esperado -->

## Screenshots (se alterou UI)

<!-- Cole prints ou GIFs aqui. Delete esta secao se nao houve mudanca de UI. -->

## Tipo de mudanca

- [ ] Bug fix (correcao sem quebrar comportamento existente)
- [ ] Nova feature (adicao sem quebrar comportamento existente)
- [ ] Breaking change (mudanca que pode quebrar funcionalidade existente)
- [ ] Refatoracao (sem mudanca funcional)
- [ ] Documentacao / diagramas

## Checklist

- [ ] Testes unitarios adicionados ou atualizados (`npm run test:cov`)
- [ ] CI esta verde nesta branch
- [ ] `.env.example` atualizado (se adicionei variavel de ambiente)
- [ ] Sem segredos, tokens ou senhas hardcoded no codigo
- [ ] PR tem menos de 400 linhas modificadas
- [ ] Diagrama de arquitetura atualizado se mudei a estrutura (C2/C3)
- [ ] `CONTRIBUTING.md` segue as convencoes de commit usadas nesta PR
