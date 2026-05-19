# Supabase Local (Opção B)

> Configuração do Supabase instalado via Setup Orion.

---

## ⚡ Visão Rápida

Esta é a **opção B** se você instalou o Supabase durante o Setup Orion.

---

## 🎯 Pré-requisitos

- ✅ Supabase instalado via Setup Orion (opção 6)
- ✅ URL do Supabase local conhecida

---

## 🔧 Configuração

### 1. Verificar se o Supabase está rodando

```bash
docker ps | grep supabase
```

Você deve ver containers como:
- `supabase-db` (PostgreSQL)
- `supabase-storage`
- `supabase-auth`

---

### 2. Obter URL do Supabase

Se instalou via Setup Orion, o Supabase está em:

```
https://supabase.seu-dominio.com
```

Ou se for IP direto:
```
http://IP-DA-VPS:8000
```

---

### 3. Credenciais do Supabase Local

#### Via Setup Orion

O Setup Orion normalmente mostra as credenciais após a instalação. Você verá:

```
╔══════════════════════════════════════════════════════════╗
║  SUPABASE INSTALADO                                      ║
╠══════════════════════════════════════════════════════════╣
║  URL: https://supabase.seu-dominio.com                    ║
║  User: postgres                                          ║
║  Password: xxxxxxxxxxxxxx                                ║
║  POSTGRES_PASSWORD: xxxxxxxxxxxxxx                       ║
╚══════════════════════════════════════════════════════════╝
```

**Guarde estas informações!**

---

### 4. Configurar Acesso Remoto

Para o n8n (que pode estar em outro container) acessar o Supabase local, você tem duas opções:

#### Opção A: Tunnel (Recomendado)

Se o Supabase está no mesmo Docker network que o n8n (via Setup Orion), use o nome do serviço:

```env
SUPABASE_URL=http://supabase:5432
```

⚠️ Isso pode não funcionar dependendo da configuração de rede.

#### Opção B: Expor porta publicamente

No docker-compose do Supabase, adicione:

```yaml
ports:
  - "5432:5432"
```

⚠️ **Cuidado**: Não exponha publicamente sem senha!

---

### 5. Executar Migration

#### Opção A: Via SQL Editor

1. Acesse `https://supabase.seu-dominio.com`
2. SQL Editor
3. Execute o conteúdo de `supabase/migrations/20260520000000_features_stack.sql`

#### Opção B: Via psql

```bash
docker exec -it supabase-db psql -U postgres
```

```sql
-- Cole o conteúdo da migration aqui
```

---

### 6. Configurar no .env

```env
# Supabase Local
SUPABASE_URL=https://supabase.seu-dominio.com
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)
```

---

## 🔐 Obtendo as Keys

### Se não tiver as chaves:

1. Acesse o painel do Supabase
2. **Settings** → **API**
3. As chaves estão lá

Se não conseguir acessar as chaves (Setup Orion pode ter gerado outras), você pode gerar novas via SQL:

```sql
-- Resetar anon key
SELECT gen_random_uuid();

-- ou ver keys existentes
SELECT * FROM auth.config;
```

---

## 📋 Checklist

- [ ] Supabase rodando (docker ps)
- [ ] URL identificada
- [ ] Credenciais obtidas
- [ ] Migration executada
- [ ] .env configurado

---

## ⚠️ Problemas Comuns

### "Conexão negada"
- Verifique se o container está rodando
- Verifique se a porta está exposta

### "Autenticação falhou"
- Verifique usuário e senha do PostgreSQL
- A senha é a `POSTGRES_PASSWORD` do Setup Orion

---

## ⏭️ Próximo Passo

Agora vamos fazer o **Deploy do App E-commerce**:

→ [05_app_ecommerce.md](05_app_ecommerce.md)

---

## 📌 Alternativa

Se você usa Supabase Cloud (externo), vá para:

→ [04_supabase_cloud.md](04_supabase_cloud.md)

---

*Voltar ao [Índice](00_indice.md)*