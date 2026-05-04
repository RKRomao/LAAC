import mysql.connector
import os
import random
from datetime import datetime, timedelta

def populate():
    db = mysql.connector.connect(
        host="localhost",
        user="laac_user",
        password="laac_pass",
        database="laac_db",
        port=3306
    )
    cursor = db.cursor()

    # Sample data
    users = [1, 2] # admin and professor
    orgs = [None, 1, 2, 3] # General, Nucleo, Tuna, Praxe
    
    contents = [
        "Bem-vindos à nova rede social da LAAC UBI! 🚀",
        "Alguém sabe se a cantina do Polo I está aberta hoje?",
        "Hoje temos ensaio da Desertuna no anfiteatro! Apareçam! 🎶",
        "O Núcleo de Informática está a organizar um hackathon para o próximo mês. Quem se inscreve? 💻",
        "Mais uma tarde de estudo na biblioteca... a UBI não para! 📚",
        "A Praxe de hoje foi incrível! Orgulho em ser UBI! 🛡️",
        "Dica do dia: O café do Bloco 6 é o melhor do campus. ☕",
        "Alguém para um jogo de basket no pavilhão logo à tarde?",
        "As notas de Engenharia de Software já saíram! Boa sorte a todos. 😅",
        "UBI: Onde o frio nos une e a ciência nos move. ❄️🔥"
    ]

    images = [
        "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1523050853064-952460133d3d?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
        None, None, None
    ]

    videos = [
        "https://www.w3schools.com/html/mov_bbb.mp4",
        None, None, None, None
    ]

    # Insert 15 random posts
    for i in range(15):
        u_id = random.choice(users)
        org_id = random.choice(orgs)
        content = random.choice(contents)
        img = random.choice(images)
        vid = random.choice(videos)
        
        # Create a randomized date within the last week
        days_ago = random.randint(0, 7)
        hours_ago = random.randint(0, 23)
        created_at = datetime.now() - timedelta(days=days_ago, hours=hours_ago)

        query = "INSERT INTO posts (user_id, organization_id, content, image_url, video_url, created_at) VALUES (%s, %s, %s, %s, %s, %s)"
        cursor.execute(query, (u_id, org_id, content, img, vid, created_at))

    db.commit()
    print(f"Sucesso: 15 publicações geradas!")
    cursor.close()
    db.close()

if __name__ == "__main__":
    populate()
