from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import os
import uuid
import shutil

app = FastAPI(title="LAAC Post Service")

# Setup uploads directory
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

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

@app.post("/posts")
async def create_post(
    user_id: int = Form(...),
    content: str = Form(...),
    organization_id: int = Form(None),
    image: UploadFile = File(None),
    video: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    image_url = None
    video_url = None

    if image:
        ext = image.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/api/uploads/{filename}"

    if video:
        ext = video.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        video_url = f"/api/uploads/{filename}"

    try:
        db.execute(
            text("INSERT INTO posts (user_id, content, image_url, video_url, organization_id) VALUES (:u, :c, :i, :v, :o)"),
            {"u": user_id, "c": content, "i": image_url, "v": video_url, "o": organization_id}
        )
        db.commit()
        return {"status": "success", "message": "Post criado!", "image_url": image_url, "video_url": video_url}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class CommentCreate(BaseModel):
    user_id: int
    content: str

@app.post("/posts/{post_id}/like")
async def toggle_like(post_id: int, user_id: int, db: Session = Depends(get_db)):
    liked = db.execute(
        text("SELECT id FROM post_likes WHERE post_id = :p AND user_id = :u"),
        {"p": post_id, "u": user_id}
    ).fetchone()
    
    if liked:
        db.execute(text("DELETE FROM post_likes WHERE id = :id"), {"id": liked[0]})
        action = "unliked"
    else:
        db.execute(
            text("INSERT INTO post_likes (post_id, user_id) VALUES (:p, :u)"),
            {"p": post_id, "u": user_id}
        )
        action = "liked"
    
    db.commit()
    return {"status": "success", "action": action}

@app.post("/posts/{post_id}/comment")
async def add_comment(post_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    db.execute(
        text("INSERT INTO post_comments (post_id, user_id, content) VALUES (:p, :u, :c)"),
        {"p": post_id, "u": comment.user_id, "c": comment.content}
    )
    db.commit()
    return {"status": "success", "message": "Comentário adicionado!"}

@app.get("/posts/{post_id}/comments")
async def get_comments(post_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            SELECT c.id, c.content, c.created_at, 
                   COALESCE(up.display_name, u.email) as author_name,
                   up.avatar_url
            FROM post_comments c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN user_profiles up ON u.email = up.email
            WHERE c.post_id = :p
            ORDER BY c.created_at ASC
        """),
        {"p": post_id}
    ).fetchall()
    return [
        {"id": r[0], "content": r[1], "created_at": r[2], "author": r[3], "avatar": r[4]}
        for r in result
    ]
