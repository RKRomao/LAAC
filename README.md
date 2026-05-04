# 🎓 Linha de Apoio ao Caloiro (NeoLAAC)

Bem-vindo ao projeto Linha de Apoio ao Caloiro (NeoLAAC)! Este é um ecossistema digital destinado a ajudar caloiros universitários da Universidade da Beira Interior (UBI) com informações e suporte durante a sua adaptação à vida académica, atuando como um verdadeiro "mentor digital".

📋 Sobre

Este projeto tem como objetivo fornecer uma plataforma unificada de suporte para novos alunos, centralizando informações úteis, dicas e recursos para combater a ansiedade espacial, reduzir burocracias e facilitar a sua integração na universidade e na cidade da Covilhã.

🚀 Funcionalidades Principais

**Suporte e Segurança**
- [ ] Sistema de perguntas e respostas frequentes (FAQ)
- [ ] Botão de emergência (Ligado ao sistema de tickets prioritários)
- [ ] Chat de apoio (Comunicação em tempo real com a equipa Frontdesk)

**Orientação e Infraestrutura**
- [ ] Mapa do campus (Integração espacial de blocos, pisos e salas)
- [ ] Transportes públicos (Rotas, horários e preços atualizados)

**Vida Académica e Tradição**
- [ ] Calendário académico (Sincronização de semestres e épocas)
- [ ] Guias de praxe (Acesso seguro a códigos, estatutos e cancioneiros)
- [ ] Guias de departamentos (Informações específicas por curso)
- [ ] Apoio ao docente (Ferramentas para partilha ágil de informação)

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

## 🛠️ Desenvolvimento e Testes

### 🐳 Local (Docker Compose)
Para testar todo o ecossistema localmente (Frontend, Orchestrator e Base de Dados):
```bash
docker-compose up --build
```
- **Frontend:** `http://localhost:8080`
- **API Orchestrator:** `http://localhost:8000`
- **Saúde da API:** `http://localhost:8000/health`

### ☸️ Kubernetes (Dry Run)
Para validar se os manifestos do Kubernetes estão corretos antes de fazer o deploy:
```bash
kubectl apply -f k8s/ --dry-run=client
```

### 🧪 Testes Unitários (Python)
Para correr os testes do serviço `orq`:
```bash
cd orq
pip install pytest httpx
pytest
```