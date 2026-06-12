from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
import jwt
import httpx
import os
from datetime import datetime, timedelta
import json

app = FastAPI(title="LAAC Auth Service")

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "laac-super-secret-key-2026")
ALGORITHM = "HS256"
LOGGING_SERVICE_URL = os.getenv("LOGGING_SERVICE_URL", "http://logging-service:8000")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database
DB_USER = os.getenv("DB_USER", "laac_user")
DB_PASS = os.getenv("DB_PASS", "laac_pass")
DB_HOST = os.getenv("DB_HOST", "mariadb")
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

# Models
class UserAuth(BaseModel):
    email: EmailStr
    password: str
    role: str = "aluno"

# Helpers
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def send_log(action: str, email: str, details: str = "", status: str = "info"):
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{LOGGING_SERVICE_URL}/logs", json={
                "service": "auth-service",
                "action": action,
                "user_email": email,
                "details": details,
                "status": status
            })
    except Exception as e:
        import traceback
        print(f"CRITICAL LOG ERROR: {str(e)}")
        traceback.print_exc()

@app.post("/register")
async def register(user: UserAuth, db: Session = Depends(get_db)):
    print(f"DEBUG: Registering {user.email} with role {user.role}. Password length: {len(user.password)}")
    # Check if user exists
    existing = db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": user.email}).fetchone()
    if existing:
        await send_log("register_failed", user.email, "E-mail já registado", "warning")
        raise HTTPException(status_code=400, detail="E-mail já registado")
    
    hashed_pass = pwd_context.hash(user.password)
    db.execute(
        text("INSERT INTO users (email, password_hash, role) VALUES (:email, :pass, :role)"),
        {"email": user.email, "pass": hashed_pass, "role": user.role}
    )
    db.commit()
    await send_log("register_success", user.email, f"Conta criada com role: {user.role}")
    return {"message": "Utilizador criado com sucesso"}

@app.post("/login")
async def login(user: UserAuth, db: Session = Depends(get_db)):
    print(f"DEBUG: Login attempt for {user.email}. Password length: {len(user.password)}")
    # Special check for admin
    if user.email == "admin@laac.pt" and user.password == "admin123":
        await send_log("admin_login", "admin@laac.pt", "Acesso ao painel administrativo")
        token = create_access_token({"sub": "admin@laac.pt", "role": "admin"})
        return {"access_token": token, "token_type": "bearer", "role": "admin", "user_id": 9999}

    row = db.execute(text("SELECT id, password_hash, role FROM users WHERE email = :email"), {"email": user.email}).fetchone()
    if not row or not pwd_context.verify(user.password, row[1]):
        await send_log("login_failed", user.email, "Credenciais inválidas", "warning")
        raise HTTPException(status_code=401, detail="E-mail ou palavra-passe incorretos")
    
    token = create_access_token({"sub": user.email, "id": row[0], "role": row[2]})
    await send_log("login_success", user.email, f"Login efetuado com role: {row[2]}")
    return {"access_token": token, "token_type": "bearer", "role": row[2], "user_id": row[0]}

@app.get("/users")
async def list_users(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT id, email, role, phone, is_online, created_at FROM users ORDER BY id DESC")).fetchall()
    return [{"id": r[0], "email": r[1], "role": r[2], "phone": r[3], "is_online": r[4], "created_at": str(r[5])} for r in result]

@app.put("/users/{user_id}")
async def update_user(user_id: int, payload: dict, db: Session = Depends(get_db)):
    role = payload.get("role")
    phone = payload.get("phone")
    is_online = payload.get("is_online")
    
    # Construir query dinâmica
    update_parts = []
    params = {"id": user_id}
    
    if role is not None:
        update_parts.append("role = :role")
        params["role"] = role
    if phone is not None:
        update_parts.append("phone = :phone")
        params["phone"] = phone
    if is_online is not None:
        update_parts.append("is_online = :is_online")
        params["is_online"] = 1 if is_online else 0
        
    if not update_parts:
        return {"message": "Nada para atualizar"}
        
    query = f"UPDATE users SET {', '.join(update_parts)} WHERE id = :id"
    db.execute(text(query), params)
    db.commit()
    
    await send_log("user_updated", "system", f"User #{user_id} atualizado: {params}")
    return {"message": "Utilizador atualizado com sucesso"}

@app.get("/validate")
async def validate_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"valid": True, "user": payload["sub"]}
    except:
        raise HTTPException(status_code=401, detail="Token inválido")

# Roles & Permissions Management
@app.get("/roles")
async def list_roles(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT role_name, description, permissions FROM roles")).fetchall()
    return [{"role_name": r[0], "description": r[1], "permissions": json.loads(r[2]) if r[2] else []} for r in result]

@app.put("/roles/{role_name}")
async def update_role(role_name: str, payload: dict, db: Session = Depends(get_db)):
    description = payload.get("description")
    permissions = payload.get("permissions") # List of strings
    
    if permissions is not None:
        db.execute(
            text("UPDATE roles SET description = :desc, permissions = :perms WHERE role_name = :name"),
            {"desc": description, "perms": json.dumps(permissions), "name": role_name}
        )
    else:
        db.execute(
            text("UPDATE roles SET description = :desc WHERE role_name = :name"),
            {"desc": description, "name": role_name}
        )
    db.commit()
    return {"message": f"Role {role_name} atualizado"}

@app.post("/roles")
async def create_role(payload: dict, db: Session = Depends(get_db)):
    name = payload.get("role_name")
    desc = payload.get("description", "")
    perms = payload.get("permissions", [])
    
    db.execute(
        text("INSERT INTO roles (role_name, description, permissions) VALUES (:name, :desc, :perms)"),
        {"name": name, "desc": desc, "perms": json.dumps(perms)}
    )
    db.commit()
    return {"message": f"Role {name} criado"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
