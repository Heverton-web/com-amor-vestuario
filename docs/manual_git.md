# Guia Prático do Git: Gerenciando Alterações e Segurança do Código

Este guia serve como referência rápida para gerenciar alterações, limpar o estado do repositório de forma segura e evitar a perda acidental de códigos e novas features no projeto **Com Amor Vestuário**.

---

## 💾 1. Salvando Alterações com Segurança (Commit)

Sempre que concluir uma funcionalidade, corrigir um bug ou finalizar uma rodada de refatoração, salve seu progresso. Isso limpa a lista de pendências (_changes_) do Git de forma definitiva e segura.

```bash
# 1. Adiciona todas as modificações e novos arquivos ao estágio de preparação
git add .

# 2. Grava as alterações com uma mensagem descritiva (padrão Conventional Commits)
git commit -m "feat: implementa nova feature X"
```

---

## 📦 2. Escondendo Alterações Temporariamente (Git Stash)

Se você precisa limpar temporariamente suas _changes_ (ex: para puxar uma atualização ou testar outra branch) **sem perder** o trabalho que ainda está em andamento:

### Guardar no Baú (Stash)

```bash
# Salva tudo o que foi modificado e guarda arquivos novos (-u / --include-untracked)
git stash -u
```

_A lista de "changes" ficará totalmente limpa e seu projeto voltará ao estado do último commit._

### Recuperar do Baú

```bash
# Traz de volta as alterações salvas e limpa o baú
git stash pop
```

---

## ⚠️ 3. Descartando Alterações (Cuidado: Ação Destrutiva!)

Se você fez testes locais, não gostou do resultado e quer **jogar fora** as modificações para voltar ao estado original do último commit.

> [!WARNING]
> Estas ações são irreversíveis. Qualquer alteração não commitada nesses arquivos será apagada para sempre!

### Descartar modificações em arquivos rastreados

```bash
# Descartar alterações de um arquivo específico (Seguro)
git restore src/routes/checkout.tsx

# Descartar alterações de TODOS os arquivos modificados no projeto
git restore .
```

### Apagar novos arquivos não rastreados

Se você criou arquivos ou pastas novos (que nunca foram commitados antes) e deseja excluí-los:

```bash
# Remove arquivos e diretórios não rastreados de forma forçada
git clean -fd
```

---

## 🎯 Resumo de Comandos Rápidos

| Objetivo                             | Comando                                 | Nível de Risco                     |
| :----------------------------------- | :-------------------------------------- | :--------------------------------- |
| **Salvar o progresso atual**         | `git add . && git commit -m "mensagem"` | **Seguro (Salva tudo)**            |
| **Esconder tudo temporariamente**    | `git stash -u`                          | **Seguro (Recuperável)**           |
| **Recuperar o que foi escondido**    | `git stash pop`                         | **Seguro**                         |
| **Limpar modificações nos arquivos** | `git restore .`                         | 🔴 **Destrutivo (Apaga Edições)**  |
| **Apagar arquivos novos criados**    | `git clean -fd`                         | 🔴 **Destrutivo (Apaga Arquivos)** |
