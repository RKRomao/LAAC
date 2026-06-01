from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import os
import json
import shutil
import uuid

app = FastAPI(title="LAAC Profile Service")

# Database setup
DB_HOST = os.getenv("DB_HOST", "mariadb")
DB_USER = os.getenv("DB_USER", "laac_user")
DB_PASS = os.getenv("DB_PASS", "laac_pass")
DB_NAME = os.getenv("DB_NAME", "laac_db")
DATABASE_URL = f"mysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Ensure upload directory exists
UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Models
class ProfileUpdate(BaseModel):
    email: str
    display_name: str = None
    bio: str = None
    avatar_url: str = None
    banner_url: str = None
    course: str = None
    year: int = None
    social_links: dict = None
    privacy_settings: dict = None

@app.get("/profiles/{email}")
async def get_profile(email: str, db: Session = Depends(get_db)):
    # Get user_id first
    user = db.execute(text("SELECT id FROM users WHERE email = :e"), {"e": email}).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    user_id = user[0]
    
    # Query with explicit columns to avoid index issues
    query = text("""
        SELECT email, display_name, bio, avatar_url, course, year, social_links, banner_url, privacy_settings 
        FROM user_profiles 
        WHERE email = :e
    """)
    result = db.execute(query, {"e": email}).fetchone()
    
    # Get organizations
    orgs_result = db.execute(text("""
        SELECT o.id, o.name, o.type, m.role 
        FROM organizations o
        JOIN organization_members m ON o.id = m.organization_id
        WHERE m.user_id = :uid
    """), {"uid": user_id}).fetchall()
    
    organizations = [{"id": r[0], "name": r[1], "type": r[2], "role": r[3]} for r in orgs_result]

    if not result:
        return {
            "id": user_id,
            "email": email,
            "display_name": email.split('@')[0],
            "bio": "Novo utilizador LAAC",
            "avatar_url": "https://ui-avatars.com/api/?name=" + email,
            "banner_url": None,
            "course": "Não especificado",
            "year": 1,
            "social_links": {},
            "privacy_settings": {"show_email": True, "show_course": True, "show_orgs": True},
            "organizations": organizations
        }
    
    # Map row to dictionary using column names (SQLAlchemy rows support ._mapping or named access)
    return {
        "id": user_id,
        "email": result[0],
        "display_name": result[1],
        "bio": result[2],
        "avatar_url": result[3],
        "course": result[4],
        "year": result[5],
        "social_links": json.loads(result[6]) if result[6] else {},
        "banner_url": result[7],
        "privacy_settings": json.loads(result[8]) if result[8] else {"show_email": True, "show_course": True, "show_orgs": True},
        "organizations": organizations
    }

@app.post("/profiles")
async def update_profile(profile: ProfileUpdate, db: Session = Depends(get_db)):
    try:
        # Check if exists
        exists = db.execute(text("SELECT 1 FROM user_profiles WHERE email = :e"), {"e": profile.email}).fetchone()
        
        # Ensure dict inputs are robustly converted to JSON strings
        social_links_str = json.dumps(profile.social_links) if profile.social_links is not None else "{}"
        privacy_settings_str = json.dumps(profile.privacy_settings) if profile.privacy_settings is not None else "{}"
        
        if exists:
            db.execute(
                text("""
                    UPDATE user_profiles 
                    SET display_name = :d, bio = :b, avatar_url = :a, banner_url = :banner, 
                        course = :c, year = :y, social_links = :s, privacy_settings = :p
                    WHERE email = :e
                """),
                {
                    "d": profile.display_name, "b": profile.bio, "a": profile.avatar_url, 
                    "banner": profile.banner_url, "c": profile.course, "y": profile.year, 
                    "s": social_links_str, "p": privacy_settings_str,
                    "e": profile.email
                }
            )
        else:
            db.execute(
                text("""
                    INSERT INTO user_profiles (email, display_name, bio, avatar_url, banner_url, course, year, social_links, privacy_settings)
                    VALUES (:e, :d, :b, :a, :banner, :c, :y, :s, :p)
                """),
                {
                    "e": profile.email, "d": profile.display_name, "b": profile.bio, 
                    "a": profile.avatar_url, "banner": profile.banner_url, "c": profile.course, 
                    "y": profile.year, "s": social_links_str, 
                    "p": privacy_settings_str
                }
            )
        
        db.commit()
        return {"status": "success", "message": "Perfil atualizado!"}
    except Exception as error:
        db.rollback()
        print(f"CRITICAL ERROR in update_profile: {str(error)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar perfil: {str(error)}")

@app.post("/profiles/upload")
async def upload_profile_image(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/profile-static/uploads/{filename}"}

@app.post("/profiles/{follower_id}/follow/{followed_id}")
async def follow_user(follower_id: int, followed_id: int, db: Session = Depends(get_db)):
    if follower_id == followed_id:
        raise HTTPException(status_code=400, detail="Não podes seguir-te a ti próprio")
    
    try:
        db.execute(
            text("INSERT INTO user_follows (follower_id, followed_id) VALUES (:f, :t)"),
            {"f": follower_id, "t": followed_id}
        )
        db.commit()
        return {"status": "success", "action": "followed"}
    except Exception:
        # If already follows, unfollow (toggle behavior)
        db.execute(
            text("DELETE FROM user_follows WHERE follower_id = :f AND followed_id = :t"),
            {"f": follower_id, "t": followed_id}
        )
        db.commit()
        return {"status": "success", "action": "unfollowed"}

@app.get("/profiles/{user_id}/following")
async def get_following(user_id: int, db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT u.id, p.display_name, p.avatar_url 
        FROM users u
        JOIN user_profiles p ON u.email = p.email
        JOIN user_follows f ON u.id = f.followed_id
        WHERE f.follower_id = :uid
    """), {"uid": user_id}).fetchall()
    
    return [{"id": r[0], "name": r[1], "avatar": r[2]} for r in result]

@app.get("/profiles/{user_id}/is_following/{target_id}")
async def is_following(user_id: int, target_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT 1 FROM user_follows WHERE follower_id = :f AND followed_id = :t"),
        {"f": user_id, "t": target_id}
    ).fetchone()
    return {"is_following": True if result else False}
