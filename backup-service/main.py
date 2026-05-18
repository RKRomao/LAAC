import os
import time
import subprocess
import schedule
from datetime import datetime

# Configurações via Environment Variables
DB_HOST = os.getenv('DB_HOST', 'mariadb')
DB_USER = os.getenv('DB_USER', 'laac_user')
DB_PASS = os.getenv('DB_PASS', 'laac_pass')
DB_NAME = os.getenv('DB_NAME', 'laac_db')

CALENDAR_DB_HOST = os.getenv('CALENDAR_DB_HOST', 'calendar-mariadb')
CALENDAR_DB_NAME = os.getenv('CALENDAR_DB_NAME', 'laac_calendar_db')

BACKUP_PATH = "/backups"

def run_backup():
    print(f"[{datetime.now()}] Iniciando backups...")
    
    # 1. Backup Base Principal
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    main_file = f"{BACKUP_PATH}/main_db_{timestamp}.sql"
    
    try:
        print(f"Fazendo dump de {DB_NAME}...")
        command = [
            "mariadb-dump",
            f"--host={DB_HOST}",
            f"--user={DB_USER}",
            f"--password={DB_PASS}",
            DB_NAME
        ]
        with open(main_file, "w") as f:
            subprocess.run(command, stdout=f, check=True)
        print(f"Backup principal concluído: {main_file}")
    except Exception as e:
        print(f"Erro no backup principal: {e}")

    # 2. Backup Base Calendário
    calendar_file = f"{BACKUP_PATH}/calendar_db_{timestamp}.sql"
    try:
        print(f"Fazendo dump de {CALENDAR_DB_NAME}...")
        command = [
            "mariadb-dump",
            f"--host={CALENDAR_DB_HOST}",
            f"--user={DB_USER}",
            f"--password={DB_PASS}",
            CALENDAR_DB_NAME
        ]
        with open(calendar_file, "w") as f:
            subprocess.run(command, stdout=f, check=True)
        print(f"Backup calendário concluído: {calendar_file}")
    except Exception as e:
        print(f"Erro no backup calendário: {e}")

# Agenda o backup (ex: todos os dias às 03:00)
schedule.every().day.at("03:00").do(run_backup)

# Também executa um backup no início para testar
run_backup()

print("Serviço de Backup iniciado e agendado.")

while True:
    schedule.run_pending()
    time.sleep(60)
