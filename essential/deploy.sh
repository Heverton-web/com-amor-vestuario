#!/bin/bash
# =============================================================================
# Script de Deploy - Com Amor Vestuário
# VPS com Docker Swarm
# =============================================================================
# Uso: ./deploy.sh [produção|desenvolvimento]
# =============================================================================

set -e

# Cores para output
VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
AZUL='\033[0;34m'
SEM_COR='\033[0m'

# Configurações
AMBIENTE=${1:-produção}
PROJETO="comamor"
STACK_FILE="docker-compose.yaml"
ENV_FILE=".env"

# Funções
log_info() {
    echo -e "${AZUL}[INFO]${SEM_COR} $1"
}

log_success() {
    echo -e "${VERDE}[✓]${SEM_COR} $1"
}

log_warn() {
    echo -e "${AMARELO}[!]${SEM_COR} $1"
}

log_error() {
    echo -e "${VERMELHO}[✗]${SEM_COR} $1"
}

# Verificar se é o diretório correto
verificar_diretorio() {
    if [ ! -f "$STACK_FILE" ]; then
        log_error "Arquivo $STACK_FILE não encontrado!"
        echo "Execute este script no diretório do projeto (onde está o docker-compose.yaml)"
        exit 1
    fi
}

# Verificar variáveis de ambiente
verificar_env() {
    log_info "Verificando variáveis de ambiente..."

    if [ ! -f "$ENV_FILE" ]; then
        log_error "Arquivo $ENV_FILE não encontrado!"
        echo "Copie .env.example para .env e configure as variáveis"
        exit 1
    fi

    # Verificar variáveis obrigatórias
    vars_obrigatorias=(
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "EVOLUTION_API_KEY"
        "LISTMONK_API_KEY"
        "LISTMONK_DB_PASSWORD"
        "EVOLUTION_DB_PASSWORD"
    )

    for var in "${vars_obrigatorias[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Variável $var não está definida em $ENV_FILE"
            exit 1
        fi
    done

    log_success "Variáveis de ambiente verificadas"
}

# Verificar Docker Swarm
verificar_swarm() {
    log_info "Verificando Docker Swarm..."

    if ! docker info > /dev/null 2>&1; then
        log_error "Docker não está instalado ou não está em execução"
        exit 1
    fi

    if ! docker info | grep -q "Swarm: active"; then
        log_warn "Docker Swarm não está ativo. Inicializando..."
        docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')
        log_success "Swarm inicializado"
    else
        log_success "Docker Swarm está ativo"
    fi
}

# Criar networks necessárias
criar_networks() {
    log_info "Criando redes Docker..."

    if ! docker network ls | grep -q "comamor-network"; then
        docker network create --driver overlay comamor-network
        log_success "Rede comamor-network criada"
    else
        log_info "Rede comamor-network já existe"
    fi
}

# Deploy da stack
deploy_stack() {
    log_info "Fazendo deploy da stack $PROJETO..."

    # Carregar variáveis de ambiente
    export $(cat $ENV_FILE | grep -v '^#' | xargs)

    # Deploy
    docker stack deploy -c $STACK_FILE $PROJETO

    log_success "Deploy iniciado"
}

# Verificar status
verificar_status() {
    log_info "Verificando status dos serviços..."

    echo ""
    echo "========================================"
    echo "   SERVIÇOS DO DOCKER SWARM"
    echo "========================================"
    echo ""

    docker service ls

    echo ""
    echo "========================================"
    echo "   LOGS RECENTES - N8N"
    echo "========================================"
    echo ""

    docker service logs ${PROJETO}_n8n --tail 20

    echo ""
    log_success "Deploy concluído!"
    echo ""
    echo "Acesse:"
    echo "  - n8n: https://n8n.seu-dominio.com"
    echo "  - ListMonk: https://listmonk.seu-dominio.com"
    echo "  - EvolutionAPI: https://evolution.seu-dominio.com"
    echo ""
    echo "Para ver todos os logs: docker service logs ${PROJETO}_<serviço>"
    echo "Para remover a stack: docker stack rm $PROJETO"
    echo ""
}

# Menu de ajuda
mostrar_ajuda() {
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos:"
    echo "  deploy      - Faz o deploy da stack (padrão)"
    echo "  status      - Verifica o status dos serviços"
    echo "  logs        - Mostra os logs"
    echo "  remove      - Remove a stack"
    echo "  ajuda       - Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 deploy      # Deploy normal"
    echo "  $0 status     # Ver status"
    echo "  $0 remove     # Remove tudo"
}

# remover stack
remove_stack() {
    log_warn "Removendo stack $PROJETO..."
    docker stack rm $PROJETO
    log_success "Stack removida"
}

# mostrar logs
mostrar_logs() {
    echo "Logs dos serviços:"
    echo "  1. n8n"
    echo "  2. ListMonk"
    echo "  3. Evolution API"
    echo "  4. Todos"
    echo ""

    read -p "Escolha uma opção (1-4): " opcao

    case $opcao in
        1) docker service logs -f ${PROJETO}_n8n ;;
        2) docker service logs -f ${PROJETO}_listmonk ;;
        3) docker service logs -f ${PROJETO}_evolution-api ;;
        4) docker service logs -f $(docker service ls -q --filter "label=com.stack=${PROJETO}") ;;
        *) log_error "Opção inválida" ;;
    esac
}

# Main
case "$1" in
    deploy)
        verificar_diretorio
        verificar_env
        verificar_swarm
        criar_networks
        deploy_stack
        verificar_status
        ;;
    status)
        docker service ls
        ;;
    logs)
        mostrar_logs
        ;;
    remove)
        remove_stack
        ;;
    ajuda|--help|-h)
        mostrar_ajuda
        ;;
    "")
        verificar_diretorio
        verificar_env
        verificar_swarm
        criar_networks
        deploy_stack
        verificar_status
        ;;
    *)
        log_error "Comando desconhecido: $1"
        mostrar_ajuda
        exit 1
        ;;
esac