# Cloudflare Tunnel Service (NeoLAAC Edge Ingress)

Este módulo adiciona suporte ao **Cloudflare Tunnel** (anteriormente designado *Argo Tunnel*) no ecossistema NeoLAAC. O túnel estabelece uma ligação segura e encriptada entre o seu ambiente de execução local (Docker/Kubernetes) e a rede da Cloudflare, permitindo expor a aplicação `http://localhost:8080` de forma pública e segura na internet, sem necessidade de abrir portas no router ou gerir DNS dinâmico.

---

## 🛠️ Como Funciona a Arquitetura

```mermaid
flowchart LR
    Utilizador((Utilizador Externo)) -->|HTTPS| CF[Rede Cloudflare]
    CF -->|Túnel Seguro / Outbound| CFT[Cloudflare Tunnel Container]
    CFT -->|HTTP (Porta 80)| FE[Nginx Frontend]
```

O contentor do Cloudflare corre localmente e estabelece uma ligação de saída (*outbound*) persistente com os servidores Edge da Cloudflare. Isto significa que a sua máquina local nunca fica exposta diretamente à internet, atuando a Cloudflare como escudo protetor contra ataques DDoS e gerindo o certificado SSL/TLS de forma 100% automática.

---

## 🚀 Como Configurar e Ativar

### Passo 1: Criar o Túnel na Cloudflare
1. Aceda ao seu painel do **Cloudflare Zero Trust** ([https://one.dash.cloudflare.com](https://one.dash.cloudflare.com)).
2. Vá a **Networks** -> **Tunnels** -> **Create a Tunnel**.
3. Escolha o nome para o túnel (ex: `neolaac-dev-tunnel`) e clique em Guardar.
4. Na secção de instalação, escolha **Docker** e copie o **Token** fornecido (um longo código alfanumérico).
5. Defina a rota pública (ex: `laac.oseudominio.com`) e aponte o destino interno para:
   * **Service Type:** `HTTP`
   * **URL:** `frontend:80` (o nome do contentor Nginx do NeoLAAC e a sua porta interna).

### Passo 2: Configurar o NeoLAAC Localmente
Crie um ficheiro `.env` na raiz do projeto (se ainda não existir) e adicione o seu token de ligação:

```env
CLOUDFLARE_TUNNEL_TOKEN=o_seu_token_aqui
```

### Passo 3: Executar o Ecossistema com o Túnel
O túnel já está pré-configurado no vosso `docker-compose.yaml`. Basta correr:

```bash
docker-compose up --build -d
```

O contentor `laac-tunnel` irá arrancar em background, ligar-se à Cloudflare e o seu NeoLAAC ficará imediatamente acessível a partir do domínio público configurado com SSL ativo!
