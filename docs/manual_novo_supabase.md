# 📖 Guia de Instalação e Configuração: Novo Supabase do Zero

Este manual descreve o passo a passo completo para configurar uma **nova conta e projeto no Supabase** e apontar a aplicação **Com Amor Vestuário** para este novo banco de dados.

O banco de dados é responsável pela autenticação (Auth), armazenamento físico das imagens (Storage Buckets), logs de webhooks e todas as entidades do sistema (vendas, clientes, orçamentos, produtos, fidelidade, etc.).

---

## 📋 Pré-requisitos
Antes de começar, certifique-se de ter em mãos:
1. Uma conta ativa na plataforma [Supabase](https://supabase.com/).
2. Acesso à VPS por SSH com permissões de administrador (`root`).
3. O script SQL consolidado gerado em [docs/supabase_setup.sql](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/docs/supabase_setup.sql) (ou copiado diretamente da aba **Supabase** no painel de desenvolvedor `/dev`).

---

## 🛠️ Passo a Passo da Instalação

### Passo 1: Criar o Novo Projeto no Supabase
1. Acesse o [Painel do Supabase](https://supabase.com/dashboard) e faça login.
2. Clique no botão **New Project** (Novo Projeto).
3. Selecione a sua organização.
4. Preencha as configurações do projeto:
   * **Name:** `Com Amor Vestuário` (ou outro de sua preferência).
   * **Database Password:** Insira uma senha forte e **anote-a** em um local seguro.
   * **Region:** Escolha uma região próxima aos seus clientes (recomendado: `sa-east-1` - São Paulo, ou a região padrão da AWS na América do Sul).
   * **Pricing Plan:** Escolha o plano adequado (o plano *Free* atende para testes e homologação).
5. Clique em **Create new project** e aguarde alguns minutos enquanto o Supabase provisiona o seu banco de dados.

---

### Passo 2: Copiar as Credenciais do Projeto
Assim que o provisionamento terminar, a página inicial do projeto exibirá as chaves de acesso. Copie e guarde os seguintes dados:

* **Project URL:** A URL de acesso à API (exemplo: `https://xxxxxx.supabase.co`).
* **API Keys (anon / public):** A chave pública do cliente, usada no frontend (exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`).
* **API Keys (service_role / secret):** A chave de serviço de administração, usada apenas no backend das Server Functions para contornar políticas RLS de forma segura.
  
  > [!CAUTION]
  > **NUNCA** divulgue ou exponha a chave `service_role` publicamente. Ela possui privilégios de superusuário e controle total sobre o seu banco.

---

### Passo 3: Executar o Script SQL Consolidado
Todas as tabelas, políticas de acesso (RLS), triggers, funções e buckets de armazenamento são criados executando o nosso script SQL unificado.

1. No menu lateral esquerdo do painel do Supabase, clique em **SQL Editor** (ícone de terminal `>_`).
2. Clique em **New Query** (Nova Consulta) e selecione **Blank Query**.
3. Copie o conteúdo completo do arquivo consolidado [supabase_setup.sql](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/docs/supabase_setup.sql).
4. Cole o script inteiro no editor SQL do Supabase.
5. Clique no botão **Run** (Executar) no canto inferior direito.
6. Certifique-se de que a mensagem de retorno seja `Success. No rows returned` ou similar, sem mensagens de erros em vermelho.

> [!NOTE]
> Este script criará automaticamente os Buckets de Armazenamento (`product-images` e `branding`) e todas as políticas de leitura/gravação necessárias para que o upload de imagens de produtos e marcas funcione de forma correta.

---

### Passo 4: Atualizar as Variáveis de Ambiente na VPS
Com o banco populado e as chaves em mãos, precisamos apontar o servidor de produção na VPS para as novas credenciais.

1. Acesse o seu servidor via terminal SSH:
   ```bash
   ssh root@KhenServer
   ```
2. Navegue até o diretório onde está a aplicação:
   ```bash
   cd ~/com-amor-vestuario
   ```
3. Abra o arquivo `.env` para edição (ou crie-o caso não exista):
   ```bash
   nano .env
   ```
4. Atualize as variáveis com os valores do novo Supabase:
   ```env
   # Endereço da API do seu novo projeto
   VITE_SUPABASE_URL="https://seu-novo-projeto.supabase.co"

   # Chave pública anon do seu novo projeto
   VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-anon-publica"

   # Chave service_role secreta (usada no backend)
   SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role-secreta"

   # Outras chaves mantidas sem alteração
   NODE_ENV="production"
   PORT=3000
   ```
5. Salve o arquivo (no nano: `Ctrl + O`, depois `Enter`, e saia com `Ctrl + X`).

---

### Passo 5: Atualizar e Reiniciar o Serviço Docker
Agora que a configuração local foi atualizada na VPS, aplique as modificações no contêiner atualizando a imagem e forçando o reinício do serviço do Docker Swarm:

1. Atualize o repositório local na VPS:
   ```bash
   git pull
   ```
2. Realize o build da nova imagem com as configurações atuais:
   ```bash
   docker build -t comamor-app:latest .
   ```
3. Force o serviço a recriar o contêiner com as novas variáveis de ambiente injetadas pelo arquivo `.env`:
   ```bash
   docker service update --force comamor-app
   ```
4. Monitore a inicialização para garantir que o serviço subiu sem falhas:
   ```bash
   docker service ps comamor-app
   ```

---

## 🔍 Validação e Teste do Ambiente
Para certificar-se de que a migração foi bem-sucedida:

1. Acesse a aplicação na web.
2. Acesse a rota restrita do desenvolvedor: `https://comamor.signa-docs.com/dev` (ou o domínio equivalente configurado).
3. Faça login com o seu e-mail exclusivo de desenvolvedor: `hevertoneduardoperes@gmail.com` e a senha secreta cadastrada.
4. Acesse a aba **Diagnostics** (Diagnósticos) e verifique se o status do banco de dados e conexão do Supabase aparecem como **ONLINE**.
5. Crie uma conta de administrador de testes ou tente criar/editar um produto e faça o upload de uma imagem. Se a imagem carregar e salvar com sucesso, os Storage Buckets e as tabelas estão funcionando perfeitamente!
