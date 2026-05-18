FROM python:3.10-slim

# Instala cliente MariaDB para o mariadb-dump
RUN apt-get update && apt-get install -y mariadb-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Garante que o diretório de backups existe
RUN mkdir -p /backups

CMD ["python", "main.py"]
