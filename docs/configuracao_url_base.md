# Configuração da URL Base do Sistema

Este documento explica como a **URL Base do Sistema** é configurada e utilizada na plataforma "Com Amor Vestuário".

---

## 💡 Cenário e Necessidade

Em ambientes de produção, homologação ou desenvolvimento, o sistema precisa gerar links absolutos para faturas, recibos e orçamentos para compartilhamento (ex.: via WhatsApp, E-mail ou em notificações enviadas em processos de background). 

Como processos que rodam no servidor (Edge Functions, Cron Jobs ou webhooks do Supabase) não possuem o objeto `window` (disponível apenas no navegador), a URL base não pode ser inferida de forma 100% dinâmica no backend.

Para sanar este problema, adicionamos a possibilidade de configuração manual da **URL Base do Sistema** diretamente pelo painel administrativo de desenvolvimento.

---

## 🔧 Como Configurar (Painel do Desenvolvedor)

1. Acesse o **Ambiente Dev** da plataforma (Menu lateral esquerdo ou diretamente em `/admin/dev`).
2. Acesse a aba **APIs & Chaves**.
3. No card **URL Base do Sistema**, insira o endereço absoluto onde o sistema está hospedado (exemplo: `https://comamor-vestuario.com.br`).
4. Clique em **Salvar URL Base**.

> [!NOTE]
> Se o campo for deixado vazio, o sistema continuará adotando o comportamento fallback automático, inferindo dinamicamente a URL usando `window.location.origin` no lado do cliente.

---

## 🛠️ Onde a URL Base é Consumida

A URL Base é integrada centralizadamente ao serviço de **Branding** do sistema e consumida dinamicamente nos seguintes locais:

1. **Orçamentos (`/admin/orcamentos`):**
   - Na geração do link exclusivo de visualização online compartilhado pelo WhatsApp ou E-mail.
   - Na ação de copiar link do orçamento para a área de transferência.

2. **Faturas (`/admin/faturas`):**
   - Na geração da URL pública do visualizador online da fatura que é enviada aos clientes.

3. **Recibos (`/admin/recibos` e visualizador público):**
   - No link de acesso ao recibo online disponibilizado para consulta.
   - Na geração do arquivo PDF oficial do recibo para download.
