# Feature: Autenticação/Login

## Descrição

Sistema completo de autenticação para clientes, permitindo login/cadastro na loja. Atualmente o checkout cria cliente automaticamente mas sem login real.

## Escopo

### Necessário
- [ ] Login via e-mail + senha
- [ ] Login via WhatsApp (SMS OTP)
- [ ] Cadastro com validação de dados
- [ ] Recuperação de senha
- [ ] Logout
- [ ] Session persistence

### Desejável
- [ ] Login social (Google, Apple)
- [ ] Two-factor auth (2FA)

## Dependências

| Dependência | Tipo | Motivo |
|-------------|------|--------|
| nenhuma | - | Feature foundation |

## Esforço Estimado

**12-20 horas** distribuídas em:
- Setup Supabase Auth: 2h
- Página login: 4h
- Página cadastro: 4h
- Recuperação senha: 2h
- Integração checkout existente: 4h
- Testes: 4h

## Stack/Tech

- Supabase Auth (já implementado parcialmente em `auth.ts`)
- Supabase RLS (Row Level Security)
- Tipo: `app_role = 'cliente'`

## Arquitetura

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐
│ Cliente  │───→│ /login       │───→│ Supabase    │
│          │    │ /register    │    │ Auth        │
└──────────┘    └──────────────┘    └─────────────┘
                      │                    │
                      ↓                    ↓
               ┌──────────────┐    ┌─────────────┐
               │ Profile      │    │ customers   │
               │ (user_id)    │    │ (dados)     │
               └──────────────┘    └─────────────┘
```

## Schema DB

```sql
-- Já existe em migrations:
-- - profiles (user_id -> auth.users)
-- - user_roles (role: admin, consultor, cliente)

-- Adicionar campo para login method
ALTER TABLE customers ADD COLUMN auth_id UUID REFERENCES auth.users(id);
ALTER TABLE customers ADD COLUMN login_method TEXT DEFAULT 'email'; -- 'email', 'whatsapp'
```

## Fluxo

### Login E-mail
1. Cliente acessa /login
2. Digita e-mail + senha
3. Supabase auth valida credentials
4. Redirect para /conta (Minha Conta)
5. Session storeada no browser

### Cadastro
1. Cliente acessa /cadastro
2. Preenche: nome, e-mail, senha, telefone
3. Supabase cria `auth.users`
4. Sistema cria `customers` vinculado
5. Session iniciada automaticamente

### Login WhatsApp
1. Cliente digita telefone
2. Sistema envia SMS com código (6 dígitos)
3. Cliente insere código
4. Se novo número → cria conta automáticamente
5. Session iniciada

## Files a Modificar/Criar

- `src/routes/login.tsx` - página login (existe, adaptar)
- `src/routes/cadastro.tsx` - nova página cadastro
- `src/routes/esqueci-senha.tsx` - nova página
- `src/routes/_authenticated.conta.tsx` - Minha Conta
- `src/features/core/integrations/auth.ts` - já existe, adaptar
- `src/components/` - criar AuthGuard wrapper

## Considerações

- Usar **RLS** para proteger dados do cliente
- Após login, sincronizar dados do `customers` com formulário checkout
- Provider: "email" ou "phone" no campo `login_method`
- Adicionar campo `email_verified` para validar conta

## Integração Checkout

O checkout atual cria cliente automaticamente via `phone` ou `e-mail`. Com auth:
- Se logado → usar dados do perfil
- Se não logado → manter fluxo anônimo atual (guest checkout)
- Opcional: forçar login para continuar (reduz conversao)

## Alternativas

| Método | Prós | Contras |
|--------|------|---------|
| Supabase Auth | Já integrado, gratis | Limites gratis |
| Clerk | UX melhor, mais features | Custo |
| NextAuth | Flexivel, multiplos providers | Setup |

## Referências

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)