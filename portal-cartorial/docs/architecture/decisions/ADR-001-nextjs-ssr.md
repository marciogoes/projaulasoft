# ADR-001 — Usar Next.js com SSR para o Web App

**Data:** 2026-02-13
**Status:** Aceito
**Decisores:** Squad Portal Cartorial

---

## Contexto

Precisamos de uma interface web que funcione tanto para cidadãos (experiência pública,
SEO importante para portais governamentais) quanto para atendentes internos (SPA
com interatividade rica). A stack deve suportar TypeScript e integrar bem com NextAuth
para SSO Gov.br via Keycloak.

## Decisão

Adotaremos **Next.js 14** com App Router, usando **SSR (Server-Side Rendering)** nas
páginas públicas e client components nos módulos interativos.

## Alternativas Consideradas

| Alternativa | Prós | Contras | Motivo da Rejeição |
|---|---|---|---|
| **Create React App (SPA puro)** | Simples, sem servidor | Sem SSR, SEO ruim, lento no primeiro carregamento | SEO e performance |
| **Remix** | SSR nativo, ótimo DX | Ecossistema menor, menos plugins | Maturidade do ecossistema |
| **Nuxt.js (Vue)** | SSR nativo | Time já conhece React | Conhecimento do time |
| **Next.js 14** ✅ | SSR+SSG+ISR, App Router, NextAuth nativo | Complexidade do App Router | **Escolhido** |

## Consequências

**Positivo:**
- SSR nas páginas públicas melhora SEO e performance no carregamento inicial
- NextAuth simplifica integração OAuth2 com Keycloak/Gov.br
- App Router permite Layouts compartilhados e Server Components

**Negativo:**
- App Router tem curva de aprendizado (Server vs Client Components)
- Build mais complexo que SPA puro

## Notas de Implementação

```typescript
// Server Component (SSR) — autenticação no servidor
export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect('/auth/login');
  // ...
}

// Client Component — interatividade no navegador
'use client';
export function NewRequestForm() { /* ... */ }
```
