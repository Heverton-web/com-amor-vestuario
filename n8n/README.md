# n8n Workflows - Marketing Automation

Este diretório contém os workflows n8n para automação de marketing.

## Como Importar

1. Acesse o painel n8n: `http://n8n.seu-dominio.com`
2. Vá em **Workflows** → **Import from File**
3. Selecione o arquivo JSON desejado
4. Configure as credenciais (Supabase, EvolutionAPI, ListMonk)

## Workflows Disponíveis

| Arquivo | Descrição | Trigger |
|---------|-----------|---------|
| `01-marketing-campaign-crud.json` | CRUD de campanhas | Manual |
| `02-followup-order-delivered.json` | Follow-up após entrega | Automático (order status) |
| `03-abandoned-cart.json` | Recuperação de carrinho | A cada 30 min |
| `04-birthday.json` | Mensagem aniversário | Daily 9h |
| `05-points-expiring.json` | Aviso pontos Expirando | Seg 10h |
| `06-wholesale-approved.json` | Welcome lojista | Automático |
| `07-newsletter-weekly.json` | Newsletter semanal | Qua 9h |
| `08-new-order-notification.json` | Notificação admin novo pedido | Automático |
| `09-low-stock-alert.json` | Alerta estoque baixo (≤5) | Diário 8h |
| `10-new-product-notification.json` | Notificação produto novo | Automático |

## Variáveis de Ambiente (n8n)

Configure estas variáveis em **Settings** → **Environment Variables**:

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...

# EvolutionAPI (WhatsApp)
EVOLUTION_API_URL=http://evolution:8080
EVOLUTION_API_KEY=sua_api_key_aqui

# ListMonk (E-mail)
LISTMONK_URL=http://listmonk:9000
LISTMONK_API_KEY=sua_api_key_listmonk
LISTMONK_LIST_ID=1

# Admin (notificações)
ADMIN_PHONE=+55219xxxxxxx
```

## Credenciais n8n

Após importar cada workflow, configure as credenciais:

### 1. Supabase
- **Type**: Supabase
- **URL**: `https://xxx.supabase.co`
- **Key**: `eyJxxx...` (service_role key)

### 2. Evolution API
- **Type**: HTTP Request (Basic Auth ou Header)
- **URL**: `http://evolution:8080`
- **Headers**: `apikey: sua_chave`

### 3. ListMonk
- **Type**: ListMonk
- **URL**: `http://listmonk:9000`
- **API Key**: obtainable em ListMonk Settings

## Estrutura dos Workflows

```
┌─────────────────────────────────────────────────────────────┐
│                         TRIGGER                              │
│  (Schedule ou Supabase Watch Changes)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      PROCESS DATA                            │
│  (Query Supabase para buscar clientes, pedidos, etc)        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       LOOP CUSTOMERS                         │
│  (Processa um cliente por vez)                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SEND MESSAGE (WhatsApp ou Email)               │
│  (EvolutionAPI ou ListMonk)                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         LOG RESULT                           │
│  (Salva log em marketing_campaign_logs)                    │
└─────────────────────────────────────────────────────────────┘
```

## Fluxos Automáticos

| Evento | Workflow | Tempo |
|--------|----------|-------|
| Pedido entregue | `02-followup-order-delivered` | 3 dias |
| Carrinho abandonado | `03-abandoned-cart` | 1 hora |
| Aniversário | `04-birthday` | Dia (9h) |
| Pontos expirando | `05-points-expiring` | 30 dias |
| Lojista aprovado | `06-wholesale-approved` | Imediato |
| Newsletter | `07-newsletter-weekly` | Quarta 9h |
| Novo pedido | `08-new-order-notification` | Imediato |
| Estoque baixo | `09-low-stock-alert` | Diário 8h |
| Produto novo | `10-new-product-notification` | Imediato |

## Troubleshooting

### Rate Limiting (WhatsApp)
- Adicione wait nodes entre envios
- Recomendado: 10-20 segundos entre mensagens

### EvolutionAPI não conecta
- Verifique se o container está rodando: `docker ps | grep evolution`
- Check logs: `docker logs evolution`

### ListMonk não envia
- Verifique SMTP em ListMonk Settings
- Teste com ListMonk built-in send test

## Próximos Passos

1. ✅ 10 Workflows criados
2. ⬜ Configurar EvolutionAPI na VPS
3. ⬜ Configurar ListMonk na VPS
4. ⬜ Importar workflows no n8n
5. ⬜ Testar cada workflow
6. ⬜ Ajustar variáveis de ambiente

## Documentação

- [n8n Documentation](https://docs.n8n.io/)
- [EvolutionAPI](https://github.com/Atendee-Technologies/evolution-api)
- [ListMonk](https://listmonk.app/docs/)