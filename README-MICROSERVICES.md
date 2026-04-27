# LAAC Platform - Arquitetura de Microserviços

## Visão Geral

Este documento descreve a arquitetura de microserviços da plataforma LAAC (Liga de Apoio ao Académico da Covilhã), dividindo a aplicação monolítica em serviços independentes e especializados.

## Arquitetura

### Serviços

1. **API Gateway** (Porta 3000) - Orquestrador e proxy central
2. **Auth Service** (Porta 3001) - Autenticação e gestão de utilizadores
3. **Events Service** (Porta 3002) - Gestão de eventos e participantes
4. **Maps Service** (Porta 3003) - Localizações e mapas
5. **Feed Service** (Porta 3004) - Feed de atividades e notificações
6. **Chat Service** (Porta 3005) - Comunicação e mensagens

### Infraestrutura

- **MariaDB** (Porta 3306) - Base de dados centralizada
- **Redis** (Porta 6379) - Cache e gestão de sessões
- **Nginx** (Porta 80/443) - Reverse proxy e load balancer

## Estrutura de Pastas

```
microservices/
├── api-gateway/          # API Gateway/Orquestrador
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── auth-service/         # Serviço de Autenticação
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── events-service/       # Serviço de Eventos
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── maps-service/         # Serviço de Mapas
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── feed-service/         # Serviço de Feed
│   ├── src/
│   ├── package.json
│   └── Dockerfile
└── chat-service/         # Serviço de Chat
    ├── src/
    ├── package.json
    └── Dockerfile
```

## Como Executar

### Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ (para desenvolvimento local)

### Produção

```bash
# Iniciar todos os serviços
docker-compose -f docker-compose.microservices.yml up -d

# Verificar status dos serviços
docker-compose -f docker-compose.microservices.yml ps

# Verificar logs
docker-compose -f docker-compose.microservices.yml logs -f
```

### Desenvolvimento

```bash
# Iniciar apenas infraestrutura (DB, Redis)
docker-compose -f docker-compose.microservices.yml up -d mariadb redis

# Iniciar cada serviço individualmente
cd microservices/api-gateway
npm install
npm run dev

cd ../auth-service
npm install
npm run dev
# ... etc para outros serviços
```

## Endpoints

### API Gateway
- `http://localhost:3000/health` - Health check
- `http://localhost:3000/health/services` - Status de todos os serviços

### Serviços Individuais
- Auth Service: `http://localhost:3001/health`
- Events Service: `http://localhost:3002/health`
- Maps Service: `http://localhost:3003/health`
- Feed Service: `http://localhost:3004/health`
- Chat Service: `http://localhost:3005/health`

## Rotas da API

Todas as rotas são acessíveis através do API Gateway:

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registo
- `GET /api/events` - Listar eventos
- `POST /api/events` - Criar evento
- `GET /api/locations` - Listar localizações
- `GET /api/feed` - Feed de atividades
- `GET /api/chat/channels` - Canais de chat
- `POST /api/chat/messages` - Enviar mensagem

## Comunicação Entre Serviços

### Autenticação
- O API Gateway valida tokens JWT
- Serviços verificam tokens com o Auth Service
- Comunicação via HTTP REST

### Base de Dados
- Todos os serviços partilham a mesma instância MariaDB
- Cada serviço tem as suas próprias tabelas
- Migrações independentes por serviço

### Cache
- Redis partilhado para sessões e cache
- Configuração centralizada via environment variables

## Variáveis de Ambiente

### Globais
- `NODE_ENV` - Ambiente (development/production)
- `JWT_SECRET` - Segredo para tokens JWT
- `MYSQL_ROOT_PASSWORD` - Password root MariaDB
- `MYSQL_PASSWORD` - Password utilizador MariaDB

### Serviços
- `AUTH_SERVICE_URL` - URL do Auth Service
- `EVENTS_SERVICE_URL` - URL do Events Service
- `MAPS_SERVICE_URL` - URL do Maps Service
- `FEED_SERVICE_URL` - URL do Feed Service
- `CHAT_SERVICE_URL` - URL do Chat Service

## Monitorização

### Health Checks
Cada serviço expõe um endpoint `/health` que retorna:
- Status do serviço
- Tempo de atividade
- Ambiente
- Timestamp

### Logs
- Logs centralizados via Docker Compose
- Formato structured JSON para fácil parsing
- Níveis de log: error, warn, info, debug

## Segurança

### Rede
- Rede Docker isolada (`laac-microservices`)
- Apenas portas necessárias expostas
- Nginx como entry point

### Autenticação
- Tokens JWT com expiração configurável
- Rate limiting por IP
- Headers de segurança via Helmet

## Deploy

### Production
```bash
# Build e deploy
docker-compose -f docker-compose.microservices.yml build
docker-compose -f docker-compose.microservices.yml up -d

# Zero downtime deploy
docker-compose -f docker-compose.microservices.yml up -d --no-deps api-gateway
```

### Scaling
```bash
# Escalar serviço específico
docker-compose -f docker-compose.microservices.yml up -d --scale auth-service=2
```

## Troubleshooting

### Serviços não iniciam
1. Verificar logs: `docker-compose logs [serviço]`
2. Verificar conectividade com DB
3. Validar variáveis de ambiente

### Problemas de rede
1. Verificar se containers estão na mesma rede
2. Testar conectividade: `docker exec [container] ping [outro-container]`

### Performance
1. Monitorizar uso de recursos: `docker stats`
2. Verificar logs de erros
3. Analisar métricas de Redis

## Próximos Passos

1. Implementar service discovery (Consul/etcd)
2. Adicionar circuit breakers
3. Implementar tracing distribuído
4. Configurar monitorização avançada (Prometheus/Grafana)
5. Implementar CI/CD pipeline
