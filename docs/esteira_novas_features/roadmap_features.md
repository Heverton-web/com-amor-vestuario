# Roadmap de Features - Com Amor Vestuário

> Mapa completo de todas as features planned para o projeto.
> Cada feature possui documento dedicado em `docs/feature_*.md`.

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

---

## Visão Geral das Features

| # | Feature | Arquivo | Fase | Esforço | Prioridade |
|---|---------|---------|------|---------|------------|
| 1 | Pagamentos (Mercado Pago) | `feature_pagamentos.md` | 1 | 16-24h | CRÍTICA |
| 2 | Autenticação/Login | `feature_autenticacao.md` | 1 | 12-20h | CRÍTICA |
| 3 | Área "Minha Conta" | `feature_minha_conta.md` | 2 | 16-24h | ALTA |
| 4 | Atacado B2B | `feature_atacado_b2b.md` | 2 | 24-40h | ALTA |
| 5 | Rastreamento | `feature_rastreamento.md` | 2 | 8-16h | MÉDIA |
| 6 | E-mail Transacional | `feature_email_transacional.md` | 1 | 12-20h | MÉDIA |
| 7 | Wishlist | `feature_wishlist.md` | 3 | 12-16h | MÉDIA |
| 8 | Avaliações | `feature_avaliacoes.md` | 3 | 12-20h | BAIXA |

---

## Fases de Implementação

### Fase 1 - Fundamentos
**Duração**: Semanas 1-3 | **Esforço**: ~56h

Objetivo: Colocar o e-commerce para funcionar com vendas reais.

| Feature | Dependências |
|---------|--------------|
| #1 Pagamentos | nenhuma |
| #2 Autenticação | nenhuma |
| #6 E-mail Transacional | nenhuma |

### Fase 2 - Operação
**Duração**: Semanas 4-6 | **Esforço**: ~56-80h

Objetivo: Operacionalizar a operação (Minha Conta, B2B, rastreamento).

| Feature | Dependências |
|---------|--------------|
| #3 Área "Minha Conta" | #2 Autenticação |
| #4 Atacado B2B | #2 Autenticação |
| #5 Rastreamento | #1 Pagamentos |

### Fase 3 - Experiência
**Duração**: Semanas 7-9 | **Esforço**: ~32-48h

Objetivo: Melhorar experiência do cliente (wishlist, avaliações, promoções).

| Feature | Dependências |
|---------|--------------|
| #7 Wishlist | #2 Autenticação |
| #8 Avaliações | #2 Autenticação |
| Frete Grátis | nenhuma |

---

## Assumções Feitas

1. **E-mail**: Supabase Auth + Resend (ou similar) para transacionais
2. **Prazo**: MVP em 1 mês, release completo em 3 meses
3. **Login**: Área cliente completa (historico pedidos, pontos, cupons)
4. **Atacado**: Aprovação manual de lojistas (B2B)
5. **Stock**: Estoque atual é por produto; futura evolução por variante

---

## Próximos Passos

1. Revisar cada `feature_*.md` em detalhes
2. Priorizar desenvolvimento conforme recursos disponíveis
3. Criar tarefas no backlog (Kanban) para cada feature
4. Executar Fase 1 primeiro (fundamentos)