from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import os
import uuid
import shutil
import httpx
from datetime import datetime, timedelta

app = FastAPI(title="LAAC Challenge Service")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup uploads directory
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Database setup
DB_HOST = os.getenv("DB_HOST", "challenge-mariadb")
DB_USER = os.getenv("DB_USER", "laac_user")
DB_PASS = os.getenv("DB_PASS", "laac_pass")
DB_NAME = os.getenv("DB_NAME", "laac_challenge_db")
DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

# Service communication
PROFILE_SERVICE_URL = os.getenv("PROFILE_SERVICE_URL", "http://profile-service:8010")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models
class ChallengeCreate(BaseModel):
    title: str
    description: str
    prize: str
    end_date: str  # Format: YYYY-MM-DD HH:MM

class Evaluation(BaseModel):
    status: str  # 'approved', 'rejected', 'winner'

def populate_initial_challenges(db: Session):
    try:
        count = db.execute(text("SELECT COUNT(*) FROM challenges")).fetchone()[0]
        if count == 0:
            print("Populating initial challenges...")
            now = datetime.now()
            challenges_data = [
                {
                    "title": "Outono na UBI",
                    "description": "Capta a transição do outono nos campi da UBI. Destaca o contraste entre as folhas caídas, a neblina serrana e a arquitetura dos pólos.",
                    "prize": "Vale de Compras Fnac de 50€",
                    "end_date": (now + timedelta(days=15)).strftime("%Y-%m-%d %H:%M"),
                    "status": "active"
                },
                {
                    "title": "Covilhã Cidade-Neve",
                    "description": "Mostra a Covilhã sob o olhar do inverno académico, a neve a cobrir a serra e as ruelas históricas da cidade.",
                    "prize": "Câmara Instantânea Fujifilm Instax Mini 12",
                    "end_date": (now + timedelta(days=45)).strftime("%Y-%m-%d %H:%M"),
                    "status": "active"
                },
                {
                    "title": "Vida de Estudante no Polo I",
                    "description": "Retrata o dia a dia e a energia contagiante de ser estudante no Polo I, entre as aulas na Reitoria e os estudos na Biblioteca.",
                    "prize": "Passe Geral para a Semana Académica da Covilhã 2026",
                    "end_date": (now + timedelta(days=30)).strftime("%Y-%m-%d %H:%M"),
                    "status": "active"
                }
            ]
            for c in challenges_data:
                db.execute(
                    text("""
                        INSERT INTO challenges (title, description, prize, end_date, status)
                        VALUES (:title, :description, :prize, :end_date, :status)
                    """),
                    c
                )
            db.commit()
            print("Initial challenges populated successfully!")
    except Exception as e:
        print(f"Error populating challenges: {e}")

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Create challenges table (in its isolated database)
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS challenges (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              description TEXT NOT NULL,
              prize VARCHAR(255) NOT NULL,
              start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              end_date VARCHAR(50) NOT NULL,
              status VARCHAR(50) DEFAULT 'active',
              winner_id INT NULL,
              winner_name VARCHAR(255) NULL,
              winner_photo_url VARCHAR(255) NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        # Create challenge_submissions table (no foreign keys to main users table)
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS challenge_submissions (
              id INT AUTO_INCREMENT PRIMARY KEY,
              challenge_id INT NOT NULL,
              user_id INT NOT NULL,
              user_email VARCHAR(255) NOT NULL,
              photo_url VARCHAR(255) NOT NULL,
              caption TEXT,
              status VARCHAR(50) DEFAULT 'pending',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
            )
        """))
        db.commit()
        populate_initial_challenges(db)
    except Exception as e:
        print(f"Error during DB initialization: {e}")
    finally:
        db.close()

# Challenges API endpoints
@app.get("/challenges")
async def list_challenges(db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT id, title, description, prize, start_date, end_date, status, winner_id, winner_name, winner_photo_url FROM challenges ORDER BY status ASC, end_date ASC")
    ).fetchall()
    
    return [
        {
            "id": r[0],
            "title": r[1],
            "description": r[2],
            "prize": r[3],
            "start_date": str(r[4]),
            "end_date": r[5],
            "status": r[6],
            "winner_id": r[7],
            "winner_name": r[8],
            "winner_photo_url": r[9]
        }
        for r in result
    ]

@app.get("/challenges/{challenge_id}")
async def get_challenge(challenge_id: int, db: Session = Depends(get_db)):
    r = db.execute(
        text("SELECT id, title, description, prize, start_date, end_date, status, winner_id, winner_name, winner_photo_url FROM challenges WHERE id = :id"),
        {"id": challenge_id}
    ).fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    return {
        "id": r[0],
        "title": r[1],
        "description": r[2],
        "prize": r[3],
        "start_date": str(r[4]),
        "end_date": r[5],
        "status": r[6],
        "winner_id": r[7],
        "winner_name": r[8],
        "winner_photo_url": r[9]
    }

@app.post("/challenges")
async def create_challenge(challenge: ChallengeCreate, db: Session = Depends(get_db)):
    try:
        db.execute(
            text("""
                INSERT INTO challenges (title, description, prize, end_date, status)
                VALUES (:title, :description, :prize, :end_date, 'active')
            """),
            {
                "title": challenge.title,
                "description": challenge.description,
                "prize": challenge.prize,
                "end_date": challenge.end_date
            }
        )
        db.commit()
        return {"status": "success", "message": "Desafio criado com sucesso!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/challenges/{challenge_id}/submit")
async def submit_photo(
    challenge_id: int,
    user_id: int = Form(...),
    user_email: str = Form(...),
    caption: str = Form(""),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Check if challenge is active
    chal = db.execute(
        text("SELECT status FROM challenges WHERE id = :id"),
        {"id": challenge_id}
    ).fetchone()
    
    if not chal:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    if chal[0] == "ended":
        raise HTTPException(status_code=400, detail="Este desafio já terminou")

    # Check if user already submitted an entry for this challenge
    existing = db.execute(
        text("SELECT id FROM challenge_submissions WHERE challenge_id = :cid AND user_id = :uid"),
        {"cid": challenge_id, "uid": user_id}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Já submeteste uma fotografia para este desafio!")

    # Save uploaded file
    ext = image.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
        
    photo_url = f"/api/challenge-static/uploads/{filename}"

    try:
        db.execute(
            text("""
                INSERT INTO challenge_submissions (challenge_id, user_id, user_email, photo_url, caption, status)
                VALUES (:cid, :uid, :uemail, :purl, :caption, 'pending')
            """),
            {
                "cid": challenge_id,
                "uid": user_id,
                "uemail": user_email,
                "purl": photo_url,
                "caption": caption
            }
        )
        db.commit()
        return {"status": "success", "message": "Fotografia submetida com sucesso!", "photo_url": photo_url}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/challenges/{challenge_id}/submissions")
async def get_submissions(challenge_id: int, role: str = "aluno", db: Session = Depends(get_db)):
    is_staff = role == "admin" or role.startswith("LAAC-staff")

    query = """
        SELECT id, challenge_id, user_id, user_email, photo_url, caption, status, created_at
        FROM challenge_submissions
        WHERE challenge_id = :cid
    """
    
    if not is_staff:
        query += " AND status IN ('approved', 'winner')"
        
    query += " ORDER BY created_at DESC"

    result = db.execute(text(query), {"cid": challenge_id}).fetchall()
    
    submissions = []
    async with httpx.AsyncClient() as client:
        for r in result:
            u_email = r[3]
            user_name = u_email.split('@')[0]
            try:
                # Query the profile service for display name
                profile_url = f"{PROFILE_SERVICE_URL}/profiles/{u_email}"
                resp = await client.get(profile_url, timeout=2.0)
                if resp.status_code == 200:
                    profile_data = resp.json()
                    user_name = profile_data.get("display_name") or user_name
            except Exception as e:
                print(f"Error fetching profile for {u_email}: {e}")
                
            submissions.append({
                "id": r[0],
                "challenge_id": r[1],
                "user_id": r[2],
                "user_email": r[3],
                "photo_url": r[4],
                "caption": r[5],
                "status": r[6],
                "created_at": str(r[7]),
                "user_name": user_name
            })
            
    return submissions

@app.post("/submissions/{submission_id}/evaluate")
async def evaluate_submission(submission_id: int, eval_data: Evaluation, db: Session = Depends(get_db)):
    # Find submission
    sub = db.execute(
        text("SELECT challenge_id, user_id, user_email, photo_url FROM challenge_submissions WHERE id = :id"),
        {"id": submission_id}
    ).fetchone()
    
    if not sub:
        raise HTTPException(status_code=404, detail="Submissão não encontrada")

    challenge_id, user_id, user_email, photo_url = sub

    try:
        if eval_data.status == "winner":
            # Declare this submission as winner
            db.execute(
                text("UPDATE challenge_submissions SET status = 'winner' WHERE id = :id"),
                {"id": submission_id}
            )
            
            # Change all other submissions for this challenge to 'approved' (so they aren't marked as winner)
            db.execute(
                text("UPDATE challenge_submissions SET status = 'approved' WHERE challenge_id = :cid AND id != :id AND status = 'winner'"),
                {"cid": challenge_id, "id": submission_id}
            )

            # Get user display name via Profile Service
            winner_name = user_email.split('@')[0]
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(f"{PROFILE_SERVICE_URL}/profiles/{user_email}", timeout=2.0)
                    if resp.status_code == 200:
                        profile_data = resp.json()
                        winner_name = profile_data.get("display_name") or winner_name
            except Exception as e:
                print(f"Error fetching profile during evaluation: {e}")

            # Close challenge and store winner info
            db.execute(
                text("""
                    UPDATE challenges 
                    SET status = 'ended', winner_id = :wid, winner_name = :wname, winner_photo_url = :wphoto
                    WHERE id = :cid
                """),
                {
                    "wid": user_id,
                    "wname": winner_name,
                    "wphoto": photo_url,
                    "cid": challenge_id
                }
            )
        else:
            # Simple approve/reject
            db.execute(
                text("UPDATE challenge_submissions SET status = :status WHERE id = :id"),
                {"status": eval_data.status, "id": submission_id}
            )

        db.commit()
        return {"status": "success", "message": f"Submissão avaliada como '{eval_data.status}' com sucesso!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8017)
