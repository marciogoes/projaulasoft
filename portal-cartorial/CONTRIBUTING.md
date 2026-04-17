# Guia de Contribuição — Portal Cartorial

## Padrão de Commits (Conventional Commits)

```
<tipo>(<escopo>): <descrição imperativa>
```

| Tipo | Quando usar | Impacto SemVer |
|---|---|---|
| `feat` | Nova funcionalidade | MINOR |
| `fix` | Correção de bug | PATCH |
| `docs` | Documentação apenas | nenhum |
| `refactor` | Refatoração sem feat/fix | nenhum |
| `test` | Adicionar/corrigir testes | nenhum |
| `chore` | Build, deps, config | nenhum |
| `ci` | Pipelines CI/CD | nenhum |
| `perf` | Melhoria de performance | PATCH |
| `feat!` | BREAKING CHANGE | MAJOR |

**Exemplos:**
```bash
feat(requests): adicionar solicitação de certidão de nascimento
fix(auth): corrigir validação de token expirado
docs(architecture): atualizar diagrama C2 com Worker Service
chore(deps): atualizar NestJS para v10.3
```

## Fluxo de Branches (Gitflow)

```
main          ← produção (tags de versão)
develop       ← integração (CI sempre verde aqui)
feature/*     ← novas funcionalidades (base: develop)
release/*     ← preparação de versão (base: develop)
hotfix/*      ← correção urgente em produção (base: main)
```

**Criar uma feature:**
```bash
git flow feature start nome-da-feature
# ou manualmente:
git checkout -b feature/nome-da-feature develop
```

**Regras:**
- Nunca faça push direto para `main` ou `develop`
- Todo merge passa por Pull Request com mínimo 1 reviewer
- PR deve ter menos de 400 linhas modificadas
- Sempre passe o CI antes de solicitar review

## Estratégia de Merge

**Padrão escolhido:** Squash and Merge

> Um commit limpo por feature na main. Histórico legível.

## Ferramenta de Diagramação

**Escolhida:** draw.io + Mermaid no README

| Arquivo | Onde fica |
|---|---|
| Fonte dos diagramas | `docs/architecture/*.drawio.xml` |
| Imagens exportadas | `docs/architecture/images/*.png` |
| Diagramas no README | Blocos Mermaid (renderizados pelo GitHub) |

**Para atualizar diagramas:**
```bash
# 1. Edite o .drawio.xml
# 2. Exporte como PNG 300 DPI em docs/architecture/images/
# 3. Commite os dois arquivos
git add docs/architecture/
git commit -m "chore(docs): atualizar C2 container diagram com Worker Service"
```

## Checklist de Pull Request

- [ ] Testes adicionados ou atualizados
- [ ] `npm run lint` passa sem erros
- [ ] `npm run test` passa sem erros
- [ ] `.env.example` atualizado (se adicionou variável)
- [ ] Sem segredos ou tokens hardcoded
- [ ] PR tem menos de 400 linhas modificadas
- [ ] Diagrama de arquitetura atualizado (se mudou a estrutura)
