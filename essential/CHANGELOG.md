# Changelog - Com Amor Vestuário

Todas as mudançasnotáveis deste projeto serão documentadas neste arquivo.

## [Em Desenvolvimento] - 2026-XX-XX

### Adicionado

- Documentação completa em `docs/esteira_novas_features/`
  - Roadmap de features
  - 9 especificações de feature
  - Migration SQL completo
  - 7 workflows n8n
- Configurações essenciais em `essential/`
  - docker-compose.yaml (Docker Swarm)
  - .env.example
  - deploy.sh
  - API.md
  - CHANGELOG.md

### Features Planejadas

| Feature | Status | Fase |
|---------|--------|------|
| Pagamentos (Mercado Pago) | Pendente | 1 |
| Autenticação/Login | Pendente | 1 |
| E-mail Transacional | Pendente | 1 |
| Área "Minha Conta" | Pendente | 2 |
| Atacado B2B | Pendente | 2 |
| Rastreamento | Pendente | 2 |
| Marketing Automation | Pendente | 2 |
| Wishlist | Pendente | 3 |
| Avaliações | Pendente | 3 |

---

## [1.0.0] - 2026-05-19

### Funcionalidades Implementadas

#### Loja Virtual
- Catálogo de produtos com filtros (cor, tamanho, preço)
- Sistema de preços dinâmico (varejo/atacado)
- Carrinho de compras com seleção de variante
- Checkout com formulário de dados e ViaCEP

#### Programa de Fidelidade
- Sistema de pontos (R$ 1 = 1 ponto)
- Club de recompensas com 3 níveis
- Vouchers (% OFF, valor fixo, frete grátis)
- Resgate de recompensas com catálogo

#### Gestão de Clientes
- Cadastro de clientes PF e PJ
- Kategorização (varejo/atacado/fardamento)
- Histórico de pedidos

#### Pedidos e Estoque
- Criação automática de pedidos
- Status automático (realizado → separado → pago → enviado → finalizado)
- Integração com Kanban
- Controle de estoque com trigger de baixa

#### Admin
- Dashboard com métricas
- Gestão de produtos
- Gestão de clientes
- Gestão de pedidos
- CRM completo
- Relatórios e análises
- Orçamento
- Faturas e recibos
- NFe
- UTM tracking
- Equipe

#### Infraestrutura
- Supabase (PostgreSQL + Auth + Storage)
- Cloudflare Workers (hospedagem)
- TanStack Start + React
- Tailwind CSS 4 + Shadcn/UI
- Docker para desenvolvimento

---

## Estrutura de Versões

Este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/):

- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs compatíveis

### Formato de Commits

Este projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação de código
refactor: refatoração
test: testes
chore: tarefas diversas
```

### Exemplos

```
feat(catalogo): adicionar filtro por cor
fix(checkout): corrigir erro ao buscar CEP
docs(readme): atualizar instruções de deploy
```

---

## Como Contribuir

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Faça suas alterações
4. Commit com mensagem convencional: `git commit -m 'feat: adiciona feature'`
5. Push para a branch: `git push origin feature/nova-feature`
6. Abra um Pull Request

---

## Histórico de Versões

- [1.0.0] - 2026-05-19 - Versão inicial com funcionalidades core
- [Em Desenvolvimento] - 2026-XX-XX - Próximas features