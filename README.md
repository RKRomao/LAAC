# 🎓 Linha de Apoio ao Caloiro (NeoLAAC)

Bem-vindo ao projeto Linha de Apoio ao Caloiro (NeoLAAC)! Este é um ecossistema digital destinado a ajudar caloiros universitários da Universidade da Beira Interior (UBI) com informações e suporte durante a sua adaptação à vida académica, atuando como um verdadeiro "mentor digital".

📋 Sobre

Este projeto tem como objetivo fornecer uma plataforma unificada de suporte para novos alunos, centralizando informações úteis, dicas e recursos para combater a ansiedade espacial, reduzir burocracias e facilitar a sua integração na universidade e na cidade da Covilhã.

## Tecnologias Utilizadas

### Frontend
- **EJS (Embedded JavaScript)** - Template engine para server-side rendering
- **HTML5/CSS3** - Estrutura e estilização semântica
- **Bootstrap 5** - Framework CSS para design responsivo
- **JavaScript Vanilla** - Lógica do lado do cliente com progressive enhancement

### Backend
- **Node.js 18+** - Runtime JavaScript server-side
- **Express.js** - Framework web minimalista e flexível
- **TypeScript** - Tipagem estática para melhor maintainabilidade
- **EJS** - Template engine para renderização de views

### Banco de Dados
- **PostgreSQL 15** - Banco de dados relacional com PostGIS
- **PostGIS** - Extensão para dados geográficos e espaciais
- **Knex.js** - Query builder para migrations e queries
- **Objection.js** - ORM baseado em Knex

### Autenticação e Segurança
- **JWT (JSON Web Tokens)** - Autenticação stateless
- **bcrypt** - Hashing de passwords
- **express-validator** - Validação de inputs
- **helmet** - Headers de segurança
- **express-rate-limit** - Rate limiting
- **cors** - Cross-Origin Resource Sharing

### Infraestrutura e Deploy
- **Docker** - Containerização da aplicação
- **Docker Compose** - Orquestração de containers
- **Nginx** - Reverse proxy e load balancing
- **GitHub Actions** - CI/CD automatizado

### Testes
- **Jest** - Testes unitários e de integração
- **Supertest** - Testes de API
- **Playwright** - Testes E2E end-to-end

## Arquitetura

O projeto LAAC segue uma **arquitetura monolítica bem estruturada**, organizada em camadas claras:

```
src/
Controllers/  # Lógica de negócio das rotas
Models/       # Models de banco de dados (Objection.js)
Services/     # Serviços de negócio reutilizáveis
Middleware/   # Middleware de autenticação, validação, etc.
Routes/       # Definição das rotas da API
server.ts     # Entry point da aplicação
```

### Estrutura de Dados

O projeto utiliza PostgreSQL com as seguintes tabelas principais:

- **users** - Utilizadores e autenticação
- **faqs** - Perguntas e respostas frequentes
- **events** - Eventos académicos e sociais
- **support_tickets** - Sistema de suporte
- **locations** - Localizações com coordenadas PostGIS
- **event_attendees** - Participantes em eventos

🚀 Funcionalidades Principais

## Funcionalidades Implementadas

### Suporte e Segurança
- [x] Sistema de perguntas e respostas frequentes (FAQ)
- [x] Sistema de tickets de suporte com prioridades
- [x] Autenticação JWT com roles (admin, core_team, praxante, student)
- [x] Validação de inputs e rate limiting

### Orientação e Infraestrutura
- [x] Sistema de localização com PostGIS
- [x] Mapa interativo com coordenadas geográficas
- [x] Busca de locais próximos por distância

### Vida Académica e Eventos
- [x] Sistema de eventos académicos e sociais
- [x] Registo de participantes em eventos
- [x] Gestão de capacidade de eventos

### Comunidade e Social
- [x] Perfis de utilizador personalizáveis
- [x] Sistema de notificações
- [x] Interface responsiva com Bootstrap 5

## Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 15+ com PostGIS
- Docker e Docker Compose (opcional)
- Redis (para cache e sessões)

### Instalação Local

1. **Clone o repositório:**
```bash
git clone https://github.com/RKRomao/LAAC.git
cd LAAC
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o banco de dados:**
```bash
# Crie o banco de dados PostgreSQL
createdb laac_dev

# Habilite a extensão PostGIS
psql laac_dev -c "CREATE EXTENSION postgis;"

# Execute as migrations
npm run migrate
```

4. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

5. **Inicie a aplicação:**
```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm run build
npm start
```

### Docker (Recomendado)

1. **Ambiente de Desenvolvimento:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

2. **Ambiente de Produção:**
```bash
docker-compose up -d
```

A aplicação estará disponível em `http://localhost:3000`

## Scripts Disponíveis

- `npm run dev` - Inicia em modo desenvolvimento com hot reload
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Inicia em modo produção
- `npm test` - Executa todos os testes
- `npm run test:unit` - Testes unitários apenas
- `npm run test:integration` - Testes de integração apenas
- `npm run test:e2e` - Testes end-to-end com Playwright
- `npm run lint` - Verifica linting do código
- `npm run type-check` - Verificação de tipos TypeScript
- `npm run migrate` - Executa migrations do banco de dados
- `npm run migrate:rollback` - Reverte última migration

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Registar novo utilizador
- `POST /api/auth/login` - Login de utilizador
- `GET /api/auth/profile` - Obter perfil do utilizador
- `PUT /api/auth/change-password` - Alterar password

### FAQs
- `GET /api/faqs` - Listar FAQs
- `POST /api/faqs` - Criar FAQ (admin/core_team)
- `PUT /api/faqs/:id` - Atualizar FAQ
- `DELETE /api/faqs/:id` - Eliminar FAQ

### Eventos
- `GET /api/events` - Listar eventos
- `POST /api/events` - Criar evento
- `POST /api/events/:id/register` - Registar em evento
- `GET /api/events/my-events` - Meus eventos

### Suporte
- `GET /api/support/tickets` - Listar tickets
- `POST /api/support/tickets` - Criar ticket
- `PUT /api/support/tickets/:id/respond` - Responder ticket

### Localizações
- `GET /api/locations` - Listar localizações
- `POST /api/locations` - Criar localização
- `GET /api/locations/nearby` - Localizações próximas
- `GET /api/locations/search` - Pesquisar localizações

## Testes

O projeto possui uma suite completa de testes:

### Testes Unitários
Testam serviços e funções isoladas:
```bash
npm run test:unit
```

### Testes de Integração
Testam endpoints da API:
```bash
npm run test:integration
```

### Testes E2E
Testam fluxos completos do usuário:
```bash
npm run test:e2e
```

### Coverage
Para ver o relatório de coverage:
```bash
npm run test:unit -- --coverage
open coverage/lcov-report/index.html
```

## Deploy

### GitHub Actions
O projeto possui CI/CD automatizado com GitHub Actions:
- **CI**: Testes, linting, type checking
- **Build**: Criação de imagem Docker
- **Deploy**: Deploy automático para staging/produção

### Deploy Manual
1. **Build da imagem:**
```bash
docker build -t laac:latest .
```

2. **Push para registry:**
```bash
docker tag laac:latest ghcr.io/RKRomao/LAAC:latest
docker push ghcr.io/RKRomao/LAAC:latest
```

3. **Deploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Comunidade e Social**
- [ ] Guia do caloiro (Informação centralizada de acolhimento)
- [ ] Dicas de sobrevivência universitária (Alojamento, cantinas, finanças)
- [ ] Noticias (Feed de avisos institucionais e comunidade)
- [ ] Contactos uteis e Parceiros (Serviços e descontos locais)
- [ ] Espaço pessoal personalizável (Perfis dinâmicos consoante o cargo)
- [ ] Espaços Núcleo (Gestão autónoma por Organizações Académicas)
- [ ] Competições universitárias (Fomento do desporto e tradição)
- [ ] Boot camp (Módulo de preparação para alunos e voluntários)

⚠️ Nota de Desenvolvimento
Isto é um projeto Pessoal, sujeito a alterações estritamente feitas pelo autor.

Base de Dados
- MariaDB
- Esquema ER:
    
```dbdiagram
// --- IDENTITY SYSTEM (AUTH & PROFILES) ---

Table users {
  id integer [primary key]
  email varchar [unique]
  password_hash varchar
  created_at timestamp
}

Table students {
  id integer [primary key]
  user_id integer [unique]
  student_number varchar [unique]
  name varchar
}

Table professors {
  id integer [primary key]
  user_id integer [unique]
  name varchar
  location_id integer
}

Table laac_staff {
  id integer [primary key]
  user_id integer [unique]
  name varchar
  is_admin boolean [default: false]
  support_phone varchar
}

// --- LAAC STAFF DEPARTMENTS ---

Table devs {
  id integer [primary key]
  staff_id integer [unique]
  specialization varchar
}

Table testers {
  id integer [primary key]
  staff_id integer [unique]
  test_type varchar
}

Table marketing {
  id integer [primary key]
  staff_id integer [unique]
  focus_channel varchar
}

Table frontdesk {
  id integer [primary key]
  staff_id integer [unique]
  shift varchar
}

// --- ORGANIZATIONS AND COMMUNITY ---

Table organizations {
  id integer [primary key]
  name varchar [not null]
  type varchar [not null]
  description text
  creation_date date
}

Table organization_members {
  id integer [primary key]
  organization_id integer
  user_id integer
  role varchar [default: 'Member']
  can_manage_events boolean [default: false]
  join_date timestamp [default: `now()`]
}

// --- SOCIAL NETWORK AND COMMUNICATION ---

Table posts {
  id integer [primary key]
  user_id integer
  content text [not null]
  image_url varchar
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table post_comments {
  id integer [primary key]
  post_id integer
  user_id integer
  content text [not null]
  created_at timestamp [default: `now()`]
}

Table post_likes {
  id integer [primary key]
  post_id integer
  user_id integer
  created_at timestamp [default: `now()`]
}

Table direct_messages {
  id integer [primary key]
  sender_id integer
  receiver_id integer
  content text [not null]
  is_read boolean [default: false]
  created_at timestamp [default: `now()`]
}

Table user_connections {
  id integer [primary key]
  follower_id integer
  followed_id integer
  status varchar [default: 'accepted']
  created_at timestamp [default: `now()`]
}

// --- INFRASTRUCTURE AND ORIENTATION ---

Table locations {
  id integer [primary key]
  building varchar
  floor varchar
  room_code varchar [unique]
  description varchar
  geojson text
}

// --- ACADEMIC STRUCTURE AND CALENDAR ---

Table courses {
  id integer [primary key]
  name varchar
  acronym varchar
}

Table subjects {
  id integer [primary key]
  course_id integer
  professor_id integer
  name varchar
  code varchar
}

Table academic_years {
  id integer [primary key]
  label varchar
}

Table semesters {
  id integer [primary key]
  academic_year_id integer
  number integer
}

Table lecture_weeks {
  id integer [primary key]
  semester_id integer
  week_number integer
  start_date date
  is_lecture_week boolean [default: true]
}

// --- CLASS LOGISTICS ---

Table classes {
  id integer [primary key]
  subject_id integer
  location_id integer
  type varchar
  class_name varchar
  weekday integer
  start_time time
  end_time time
}

// --- ENROLLMENTS (CENTRAL POINT) ---

Table enrollments {
  id integer [primary key]
  student_id integer
  course_id integer
  class_id integer
  semester_id integer
  enrollment_date timestamp
}

// --- EVENTS (ORGANIZATIONS EXCLUSIVE) ---

Table events {
  id integer [primary key]
  title varchar [not null]
  description text
  start_at timestamp [not null]
  end_at timestamp
  organization_id integer [not null]
  location_id integer
}

Table event_partners {
  id integer [primary key]
  event_id integer [not null]
  partner_id integer [not null]
  sponsorship_details varchar
}

// --- ADDITIONAL SERVICES (NEO-LAAC) ---

Table partners {
  id integer [primary key]
  name varchar [not null]
  type varchar [not null]
  description text
  discount_for_students varchar
  verified boolean [default: false]
}

Table files {
  id integer [primary key]
  owner_id integer
  path varchar [not null]
  type varchar [not null]
  access_restrictions varchar [default: 'public']
}

// --- RELATIONSHIPS ---

// Profiles and LAAC Staff
Ref: students.user_id - users.id
Ref: professors.user_id - users.id
Ref: laac_staff.user_id - users.id
Ref: devs.staff_id - laac_staff.id
Ref: testers.staff_id - laac_staff.id
Ref: marketing.staff_id - laac_staff.id
Ref: frontdesk.staff_id - laac_staff.id

// Organizations and Community
Ref: organization_members.organization_id > organizations.id
Ref: organization_members.user_id > users.id
Ref: posts.user_id > users.id
Ref: post_comments.post_id > posts.id
Ref: post_comments.user_id > users.id
Ref: post_likes.post_id > posts.id
Ref: post_likes.user_id > users.id
Ref: direct_messages.sender_id > users.id
Ref: direct_messages.receiver_id > users.id
Ref: user_connections.follower_id > users.id
Ref: user_connections.followed_id > users.id

// Academia and Location
Ref: professors.location_id > locations.id
Ref: classes.location_id > locations.id
Ref: subjects.professor_id > professors.id
Ref: subjects.course_id > courses.id
Ref: classes.subject_id > subjects.id
Ref: enrollments.student_id > students.id
Ref: enrollments.course_id > courses.id
Ref: enrollments.class_id > classes.id
Ref: enrollments.semester_id > semesters.id
Ref: semesters.academic_year_id > academic_years.id
Ref: lecture_weeks.semester_id > semesters.id

// Events (Organizations and Location Only)
Ref: events.organization_id > organizations.id
Ref: events.location_id > locations.id
Ref: event_partners.event_id > events.id
Ref: event_partners.partner_id > partners.id

// NeoLAAC Services (Files)
Ref: files.owner_id > users.id
```
