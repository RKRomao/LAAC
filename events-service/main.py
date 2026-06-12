from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="LAAC Events Service")

class Event(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    date: str
    location: str
    category: str
    organization_id: Optional[int] = None

# Dados iniciais de eventos académicos da UBI
events_db = [
    {
        "id": 1,
        "title": "Acolhimento ao Caloiro UBI 2026",
        "description": "Sessão oficial de boas-vindas aos novos estudantes da UBI com a presença do Reitor e espetáculos culturais.",
        "date": "2026-09-14 10:00",
        "location": "Anfiteatro das Ciências Sociais (Polo IV)",
        "category": "Académico"
    },
    {
        "id": 2,
        "title": "Cortejo da Latada e Batismo do Caloiro",
        "description": "O tradicional desfile dos caloiros pelas ruas da Covilhã, culminando com o batismo nas águas do Rio Goldra.",
        "date": "2026-10-18 14:00",
        "location": "Rotunda do Rato, Pelourinho",
        "category": "Tradição"
    },
    {
        "id": 3,
        "title": "Torneio Inter-Cursos de Futsal",
        "description": "Fase inicial das competições desportivas organizadas pela AAUBI. Representa o teu curso!",
        "date": "2026-11-05 18:00",
        "location": "Pavilhão Desportivo da UBI (Polo II)",
        "category": "Desporto"
    },
    {
        "id": 4,
        "title": "Boot Camp de Voluntários NeoLAAC",
        "description": "Formação intensiva presencial para mentores e voluntários que vão apoiar a Linha de Apoio.",
        "date": "2026-09-08 09:00",
        "location": "Biblioteca Central (Polo I)",
        "category": "Formação"
    },
    {
        "id": 5,
        "title": "Semana Académica da Covilhã 2026",
        "description": "A maior festa académica dos estudantes da UBI, com concertos e atividades recreativas no complexo desportivo.",
        "date": "2026-05-18 21:00",
        "location": "Complexo Desportivo da Covilhã",
        "category": "Tradição"
    },
    {
        "id": 6,
        "title": "Peddy Paper do Polo I",
        "description": "Uma atividade divertida de integração para dar a conhecer os cantos e recantos históricos do Polo I.",
        "date": "2026-04-12 14:00",
        "location": "Pátio da Reitoria (Polo I)",
        "category": "Geral"
    }
]

@app.get("/events", response_model=List[Event])
async def get_events(category: Optional[str] = None, organization_id: Optional[int] = None):
    result = events_db
    if category:
        result = [e for e in result if e.get("category", "").lower() == category.lower()]
    if organization_id is not None:
        result = [e for e in result if e.get("organization_id") == organization_id]
    return result

@app.post("/events", response_model=Event)
async def create_event(event: Event):
    # Validar se o ID já existe
    if event.id is None:
        event.id = max([e["id"] for e in events_db]) + 1 if events_db else 1
    elif any(e["id"] == event.id for e in events_db):
        raise HTTPException(status_code=400, detail="Evento com esse ID já existe.")
    
    new_event = event.dict()
    events_db.append(new_event)
    return event

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8014)
