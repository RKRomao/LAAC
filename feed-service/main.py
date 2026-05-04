from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
import os
import httpx

app = FastAPI(title="LAAC Feed Service")

# Database setup
DB_HOST = os.getenv("DB_HOST", "mariadb")
DB_USER = os.getenv("DB_USER", "laac_user")
DB_PASS = os.getenv("DB_PASS", "laac_pass")
DB_NAME = os.getenv("DB_NAME", "laac_db")
DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/feed")
async def get_global_feed(db: Session = Depends(get_db)):
    query = """
        SELECT p.id, p.content, p.image_url, p.video_url, p.created_at, 
               COALESCE(up.display_name, u.email) as author_name,
               up.avatar_url,
               o.name as org_name,
               (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
               (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count,
               p.user_id
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN user_profiles up ON u.email = up.email
        LEFT JOIN organizations o ON p.organization_id = o.id
        ORDER BY p.created_at DESC
        LIMIT 50
    """
    
    result = db.execute(text(query)).fetchall()
    return [
        {
            "id": r[0], "content": r[1], "image_url": r[2], "video_url": r[3],
            "created_at": r[4], "author": r[5], "avatar": r[6],
            "organization": r[7], "likes": r[8], "comments": r[9],
            "author_id": r[10]
        } for r in result
    ]
