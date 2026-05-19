# Roadmap de Features - Com Amor Vestuário

> Mapa completo de todas as features planned para o projeto.
> Cada feature possui documento dedicado.

## Estado Atual do Projeto

### ✅ Implementado
- Loja com catálogo + filtros (cor, tamanho, preço)
- Sistema preços varejo/atacado (≥6 peças = atacado)
- Carrinho com variante cor/tamanho
- Checkout com ViaCEP
- Programa fidelidade completo
- Cadastro cliente PF/PJ
- Pedidos → Kanban automático
- Estoque com controle (trigger baixa no faturamento)
- Admin: CRM, financeiro, relatórios

### ❌ Pendente
- Integração pagamento (Mercado Pago)
- Autenticação/Login cliente
- Área "Minha Conta"
- Atacado B2B para lojistas
- Rastreamento pedido
- E-mail transacional
- Wishlist
- Avaliações
- Marketing Automation (n8n + ListMonk + EvolutionAPI)

---

## Visão Geral das Features

| # | Feature | Arquivo | Fase | Esforço | Prioridade |
|---|---------|---------|------|---------|------------|
| 1 | Pagamentos (Mercado Pago) | `feature_pagamentos.md` | 1 | 16-24h | CRÍTICA |
| 2 | Autenticação/Login | `feature_autenticacao.md` | 1 | 12-20h | CRÍTICA |
| 3 | E-mail Transacional | `feature_email_transacional.md` | 1 | 12-20h | MÉDIA |
| 4 | Área "Minha Conta" | `feature_minha_conta.md` | 2 | 16-24h | ALTA |
| 5 | Atacado B2B | `feature_atacado_b2b.md` | 2 | 24-40h | ALTA |
| 6 | Rastreamento | `feature_rastreamento.md` | 2 | 8-16h | MÉDIA |
| 7 | Wishlist | `feature_wishlist.md` | 3 | 12-16h | MÉDIA |
| 8 | Avaliações | `feature_avaliacoes.md` | 3 | 12-20h | BAIXA |
| 9 | Marketing Automation | `feature_marketing_automation.md` | 2 | 24-40h | ALTA |

---

## Fases de Implementação

### Fase 1 - Fundamentos
**Duração**: Semanas 1-3 | **Esforço**: ~56h

Objetivo: Colocar o e-commerce para funcionar com vendas reais.

| Feature | Dependências |
|---------|--------------|
| #1 Pagamentos | nenhuma |
| #2 Autenticação | nenhuma |
| #3 E-mail Transacional | nenhuma |

### Fase 2 - Operação
**Duração**: Semanas 4-6 | **Esforço**: ~80-96h

Objetivo: Operacionalizar a operação (Minha Conta, B2B, rastreamento, automação).

| Feature | Dependências |
|---------|--------------|
| #4 Área "Minha Conta" | #2 Autenticação |
| #5 Atacado B2B | #2 Autenticação |
| #6 Rastreamento | #1 Pagamentos |
| #9 Marketing Automation | #2 Autenticação + #3 E-mail |

### Fase 3 - Experiência
**Duração**: Semanas 7-9 | **Esforço**: ~32-48h

Objetivo: Melhorar experiência do cliente (wishlist, avaliações, promoções).

| Feature | Dependências |
|---------|--------------|
| #7 Wishlist | #2 Autenticação |
| #8 Avaliações | #2 Autenticação |

---

## Infraestrutura Externa (VPS Contabo)

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER SWARM (Contabo)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                │
│  │ Supabase│    │  n8n    │    │ListMonk │                │
│  │  (DB)   │    │(automate)│   │ (email)  │                │
│  └────┬────┘    └────┬────┘    └────┬────┘                │
│       │              │              │                      │
│       └──────────────┼──────────────┘                      │
│                      │                                      │
│                ┌─────▼─────┐                                 │
│                │Evolution │                                 │
│                │  API     │                                 │
│                │(WhatsApp)│                                 │
│                └──────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Assumções Feitas

1. **E-mail**: Supabase + ListMonk (self-hosted) para transacionais + campanhas
2. **WhatsApp**: EvolutionAPI (self-hosted) no Docker Swarm
3. **Automação**: n8n (self-hosted) no Docker Swarm
4. **Prazo**: MVP em 1 mês, release completo em 3 meses
5. **Login**: Área cliente completa (historico pedidos, pontos, cupons)
6. **Atacado**: Aprovação manual de lojistas (B2B)

---

## Próximos Passos

1. Revisar cada `feature_*.md` em detalhes
2. Priorizar desenvolvimento conforme recursos disponíveis
3. Criar tarefas no backlog (Kanban) para cada feature
4. Executar Fase 1 primeiro (fundamentos)
5. Configurar infraestrutura VPS (Docker Swarm, n8n, ListMonk, EvolutionAPI)