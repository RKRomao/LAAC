from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="LAAC News Service")

class NewsItem(BaseModel):
    id: int
    title: str
    summary: str
    date: str
    image: str

# Dados iniciais de notícias
news_db = [
    {
        "id": 1,
        "title": "Semana Académica UBI 2026",
        "description": "Prepara-te para a melhor semana do ano! Bilhetes já à venda na sede da AAUBI e online.",
        "summary": "Prepara-te para a melhor semana do ano! Bilhetes já à venda.",
        "date": "2026-05-10",
        "image": "https://images.unsplash.com/photo-1540575861501-7ce0e1d1aa99?auto=format&fit=crop&q=80&w=800"
    },
    {
        "id": 2,
        "title": "Novos Menus nas Cantinas da UBI",
        "description": "Os SASUBI introduziram novas opções vegetarianas e menus diversificados em todos os polos universitários.",
        "summary": "A UBI introduziu opções vegetarianas em todos os polos.",
        "date": "2026-04-28",
        "image": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800"
    },
    {
        "id": 3,
        "title": "Workshop de IA e Robótica Aplicada",
        "description": "Inscrições abertas e gratuitas para o workshop interativo organizado pelo Departamento de Informática no Bloco 6.",
        "summary": "Inscrições abertas para o workshop no Bloco 6.",
        "date": "2026-05-02",
        "image": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800"
    }
]

@app.get("/news", response_model=List[NewsItem])
async def get_news():
    return news_db

@app.post("/news", response_model=NewsItem)
async def create_news_item(item: NewsItem):
    if any(n["id"] == item.id for n in news_db):
        raise HTTPException(status_code=400, detail="Notícia com esse ID já existe.")
    
    new_item = item.dict()
    news_db.append(new_item)
    return item

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8015)
