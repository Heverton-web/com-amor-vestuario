# 🎨 Guia de Uso — Painel de Branding & Conteúdo Ultra-Premium

Este documento apresenta as novas funcionalidades introduzidas na aba **Branding & Conteúdo** ([admin.branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/_authenticated/admin.branding.tsx)). O painel foi totalmente redesenhado para oferecer uma experiência interativa, sofisticada e de alta costura.

---

## 💎 Funcionalidades Estilizadas

### 1. 📲 Simulador Visual em Tempo Real (Estúdio de Design)
Ao lado direito da tela, você conta com um simulador virtual de dispositivos móveis e desktop com renderização reativa em tempo real.
* **Seletor de Páginas (Multi-Ambiente):** No topo do simulador, você pode alternar entre:
  * **`Landing` (Página Inicial):** Renderiza o banner de entrada principal, slogan da marca, logotipo da Landing e a seção editorial sobre o atelier.
  * **`Loja` (Catálogo Virtual):** Renderiza uma simulação do e-commerce com cartões de roupas de luxo, preços integrados com a cor primária e botão de sacola de compras reativo.
  * **`Fidelidade` (Clube de Recompensas):** Exibe a área do clube com pontuações acumuladas e cupons de recompensa.
* **Toggle de Visualização:** Um botão de controle no topo do simulador permite alternar rapidamente entre o mockup de **Celular (Mobile)** ou a tela do navegador de **Computador (Desktop)**.
* **Aplicações de Cores Dinâmicas:** A cor primária escolhida colore os botões de ação (CTAs) e pequenos detalhes como corações de ícones de forma automática.

### 2. 🗂️ Nomes de Abas Simplificados
Simplificamos os nomes das abas para garantir que fiquem alinhados horizontalmente em uma única linha, melhorando muito a navegabilidade:
1. **Identidade & Cores:** Logotipos específicos por ambiente, slogan e seletores de cores da identidade.
2. **Página Inicial:** Configurações de banner principal (Hero), Bloco Sobre o Atelier e links CTAs da Landing Page.
3. **Canais & Horários:** Dados de contato, telefone, WhatsApp, endereço físico e tabelas semanais de horários.
4. **Emissor de Recibos:** Dados fiscais/jurídicos do faturamento e chancela de assinatura digital.

### 3. 🖼️ Logotipos Múltiplos por Ambiente (PNG/SVG transparentes)
Para garantir um design limpo e que combine com os contrastes escuros/claros de cada cabeçalho, agora você pode definir arquivos de imagens exclusivos para cada finalidade:
* **Logo Geral (Fallback):** Usado quando nenhum outro for informado.
* **Logo da Landing Page:** Exibido no cabeçalho institucional.
* **Logo da Loja Virtual:** Exibido no e-commerce e catálogo de peças.
* **Logo do Clube de Recompensas:** Exibido no clube de fidelidade do cliente.
* **Logo de Recibos & Faturamento:** Inserido no cabeçalho de PDFs e recibos emitidos.

### 🍁 4. Paletas Sazonais & Personalização
* **Paletas Sazonais por Sazonalidade:** Temos dois grupos curados prontos para aplicação instantânea com um clique:
  * **🎉 Datas Especiais & Festas:** *Dia das Mães 🌸* (rosa antigo e creme), *Natal Mágico 🎄* (vermelho cereja e verde pinheiro) e *Ano Novo Real 🌟* (champanhe e seda off-white).
  * **🍂 Estações do Ano:** *Primavera/Verão ☀️* (amarelo sol e areia) e *Outono/Inverno 🍂* (terracota e cacau profundo).
* **Criador de Paleta Customizada (Minhas Paletas):**
  * Você pode ajustar livremente as cores nos campos de **Cores da Identidade**.
  * Digite um nome exclusivo no campo "Minhas Paletas" e clique em **💾 Salvar Paleta**.
  * Ela será adicionada à sua coleção de paletas exclusivas, podendo ser aplicada a qualquer momento ou removida clicando na lixeira vermelha. Lembre-se de clicar em **"Salvar Tudo"** no canto superior direito para gravar na nuvem de forma definitiva!

### 📊 5. Barra de Completude da Identidade (Completeness Score)
Um painel no topo do formulário indica, de 0 a 100%, quão completa está a parametrização do seu branding. Ele calcula o progresso à medida que você insere dados essenciais, servindo de guia para garantir que nenhuma informação importante fique em branco.

---

## 🧪 Homologação e Build
* O projeto foi verificado com o compilador estrito TypeScript (`Exit code: 0`).
* O build de produção otimizado com o Vite gerou o novo módulo com sucesso absoluto (`Exit code: 0`).
