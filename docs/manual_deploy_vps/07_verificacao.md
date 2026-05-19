# Verificação e Troubleshooting

> Como verificar se tudo está funcionando e resolver problemas comuns.

---

## ⚡ Checkpoints de Verificação

| # | Serviço | O que verificar |
|---|---------|----------------|
| 1 | Traefik | HTTPS funcionando |
| 2 | App E-commerce | Site carregando |
| 3 | Supabase | Conexão com banco |
| 4 | n8n | Workflows ativos |
| 5 | Evolution API | WhatsApp conectado |
| 6 | ListMonk | E-mails enviando |

---

## 🔍 Verificação Detalhada

### 1. Traefik (SSL)

```bash
# Ver containers do Traefik
docker ps | grep traefik

# Ver logs
docker logs traefik

# Testar HTTPS
curl -I https://seu-dominio.com
```

**Esperado**: Retorno 200 com certificado válido

---

### 2. App E-commerce

No navegador, acesso:
```
https://seu-dominio.com
```

**Verificações:**
- [ ] Página carrega
- [ ] Logo aparece
- [ ] Menu funciona
- [ ] Produtos listam
- [ ] Login funciona

---

### 3. Supabase

#### No Dashboard Supabase
1. Acesse supabase.com
2. Selecione seu projeto
3. **Table Editor** → Verifique que as tabelas existem

#### No App
Abra DevTools (F12) → Console:
- Verifique erros de conexão
- Teste uma ação (login, adicionar ao carrinho)

---

### 4. n8n

```
https://n8n.seu-dominio.com
```

**Verificações:**
- [ ] Login funciona
- [ ] Workflows aparecem
- [ ] Workflows estão ativos (toggle verde)
- [ ] Última execução bem-sucedida

#### Verificar Execuções
1. Clique em um workflow
2. Clique em **Executions**
3. Verifique se há execuções recentes

---

### 5. Evolution API

```
https://evolution.seu-dominio.com
```

**Verificações:**
- [ ] Login funciona
- [ ] Instância está "connected"
- [ ] QR Code aparece (se precisar parear)

#### Testar Envio
1. Na Evolution API, vá em **Send Message**
2. Envie uma mensagem de teste para seu número

---

### 6. ListMonk

```
https://listmonk.seu-dominio.com
```

**Verificações:**
- [ ] Login funciona
- [ ] Lista "Clientes Com Amor" existe
- [ ] SMTP configurado (Settings → SMTP)
- [ ] Teste de envio funciona

#### Testar Envio
1. **Campaigns** → **New Campaign**
2. Send test para seu e-mail
3. Verifique se recebe

---

## 🛠 Troubleshooting

### "Site não carrega"

**Causas possíveis:**
1. Traefik não está roteando
2. App não está rodando
3. DNS não resolve

**Solução:**
```bash
# 1. Verificar containers
docker ps

# 2. Ver logs do app
docker logs comamor_app

# 3. Ver logs do Traefik
docker logs traefik

# 4. Testar DNS
nslookup seu-dominio.com
```

---

### "n8n não conecta no Supabase"

**Solução:**
1. Verificar URL do Supabase
2. Verificar se a key é a `service_role` (não anon)
3. Testar no browser: `https://xxxx.supabase.co/rest/v1/`

---

### "Evolution API não envia mensagens"

**Causas possíveis:**
1. Instância não está conectada
2. API key incorreta
3. Rate limit

**Solução:**
1. Verificar status da instância (deve estar "connected")
2. Recriar instância se necessário
3. Verificar API key nas credenciais do n8n

---

### "ListMonk não envia e-mails"

**Solução:**
1. **Settings** → **SMTP** → Testar conexão
2. Verificar credenciais SMTP
3. Verificar se não está em spam

---

### "Workflow não ativa"

**Causas:**
1. Credenciais faltando
2. Credenciais inválidas
3. Trigger não configurado

**Solução:**
1. Editar workflow
2. Verificar nó de credenciais (ícone vermelho = erro)
3. Recriar credenciais se necessário

---

### "Erro de CORS no app"

**Solução:**
No Supabase:
1. **Settings** → **API**
2. **CORS**
3. Adicionar seu domínio: `https://seu-dominio.com`

---

## 📊 Monitoramento

### Verificar todos os serviços

```bash
# Ver containers
docker ps

# Ver serviços Swarm
docker service ls

# Ver logs específicos
docker service logs comamor_n8n --tail 50
docker service logs comamor_listmonk --tail 50
```

---

### Verificar recursos

```bash
# Ver uso de recursos
docker stats

# Ver espaço em disco
df -h
```

---

## ⏭️ Próximo Passo

最终的 referência de comandos:

→ [08_comandos.md](08_comandos.md)

---

## 📞 Precisa de Ajuda?

1. **Setup Orion**: [oriondesign.art.br](https://oriondesign.art.br)
2. **n8n Docs**: [docs.n8n.io](https://docs.n8n.io)
3. **Evolution API**: [GitHub](https://github.com/Atendee-Technologies/evolution-api)
4. **ListMonk Docs**: [listmonk.app/docs](https://listmonk.app/docs/)

---

*Voltar ao [Índice](00_indice.md)*