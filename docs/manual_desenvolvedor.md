# Manual de Desenvolvimento: Arquitetura Modular e Novas Features

Este manual serve como guia de referência técnica para desenvolvedores e IAs que trabalham na plataforma **Com Amor Vestuário**. Ele estabelece os padrões da **Arquitetura Baseada em Recursos (Feature-Based Architecture)** e instrui sobre a criação e manutenção de módulos no sistema.

---

## 🏛️ A Estrutura de Pastas Modular

O projeto abandonou a organização tradicional baseada em camadas técnicas para adotar uma organização por **Domínio de Negócio**. Todo o código de uma funcionalidade deve estar contido em sua respectiva pasta no diretório `src/features/`.

### Anatomia de um Módulo (Feature)

Cada pasta dentro de `src/features/` segue rigorosamente esta anatomia:

```text
src/features/meu-modulo/
├── components/       # Componentes React exclusivos deste domínio
├── hooks/            # React Hooks, Queries e Mutations do TanStack Query
├── services/         # Funções utilitárias e integrações com o Supabase/APIs
├── types.ts          # Definições de Tipagem TypeScript exclusivas do domínio
└── index.ts          # Barrel File (A "Porta de Entrada" pública do módulo)
```

---

## 🛠️ Como Criar uma Nova Feature (Automatizado)

Para garantir a padronização e governança da arquitetura, o projeto inclui um gerador de scaffolding. **Nunca crie as pastas manualmente.**

### Passo a Passo:

1. Abra o terminal na raiz do projeto.
2. Execute o comando:
   ```bash
   npm run feature:new <nome-da-feature>
   ```
   _(Substitua `<nome-da-feature>` pelo nome em minúsculo, utilizando hífens se necessário)._
3. O script criará toda a estrutura de pastas vazia, o arquivo `types.ts` inicial e a API pública em `index.ts`.

---

## 🚦 Regras Estritas de Comunicação e Acoplamento

Para manter a base de código escalável e evitar dependências circulares:

1. **A Regra do Barrel (`index.ts`):**
   Um arquivo de um módulo **A** nunca deve navegar pelas subpastas internas do módulo **B**. Toda comunicação externa ocorre exclusivamente importando a raiz do módulo.
   - ❌ **Errado:** `import { Card } from "@/features/fidelidade/components/RewardCard"`
   - `import { Card } from "@/features/fidelidade"`

2. **Apenas Exportações Públicas:**
   Apenas exponha componentes e funções no arquivo `index.ts` do módulo se eles forem realmente úteis para o resto do sistema. Detalhes de implementação interna (como subcomponentes específicos) devem permanecer escondidos do lado de fora do módulo.

3. **Inter-módulos via `core`:**
   Se dois módulos de features diferentes precisarem compartilhar a mesma lógica básica, função ou componente de UI, esse código **deve ser transferido para o módulo `core`** (que atua como nosso módulo compartilhado).

4. **Rotas Leves (Controladores):**
   Os arquivos dentro de `src/routes/` atuam apenas como configuradores de URLs e layouts do **TanStack Router**. Eles não devem conter JSX pesado ou lógicas complexas.
   - A rota apenas define a URL, o loader e renderiza o componente de página importado da feature:
   ```tsx
   import { CheckoutPage } from "@/features/vendas";

   export const Route = createFileRoute("/checkout")({
     component: () => <CheckoutPage />,
   });
   ```

---

## 📂 Mapeamento dos 8 Módulos de Negócio Atuais

Para saber onde alocar cada nova linha de código, consulte o escopo de cada domínio:

| Módulo           | Escopo de Atuação                                                                | Exemplo de Arquivos                                              |
| :--------------- | :------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| **`core`**       | Tudo o que for compartilhado (UI Radix, formatadores, Supabase base, PDFs).      | `src/components/ui/`, `format.ts`, `auth.tsx`                    |
| **`fidelidade`** | Gestão de pontos, resgates de recompensas e portal do cliente.                   | `recompensas.index.tsx`, `rewards.ts`                            |
| **`vendas`**     | Carrinho de compras, checkout público, precificação de atacado/varejo e pedidos. | `loja.tsx`, `checkout.tsx`, `cart.ts`, `admin.pedidos.tsx`       |
| **`catalogo`**   | Gestão do catálogo, controle físico de estoque e variações de produtos.          | `admin.produtos.tsx`                                             |
| **`crm`**        | Acompanhamento de leads, funil de fardamento, clientes B2B e orçamentos.         | `admin.kanban.tsx`, `admin.orcamentos.tsx`, `admin.clientes.tsx` |
| **`financeiro`** | Cobranças, faturas públicas e painel de conciliação de tesouraria.               | `admin.faturas.tsx`, `fatura.$token.tsx`, `nfe.tsx`              |
| **`marketing`**  | Rastreabilidade de tráfego, UTMs e métricas de conversão.                        | `admin.utm.tsx`, `admin.analises.tsx`                            |
| **`acessos`**    | Permissões de equipe, convites de portal e regras de login.                      | `admin.equipe.tsx`, `login.tsx`                                  |

---

## ⚙️ Scripts Úteis de Manutenção

- **Scaffolding de Feature:** `npm run feature:new <nome>`
- **Servidor de Desenvolvimento:** `npm run dev`
- **Compilar para Produção (Build):** `npm run build`
