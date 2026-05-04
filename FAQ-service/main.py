from fastapi import FastAPI
from typing import List
from pydantic import BaseModel

app = FastAPI(title="LAAC FAQ Service")

class FAQItem(BaseModel):
    id: int
    question: str
    answer: str
    category: str

# Initial FAQ Data
faqs = [
    {
        "id": 1,
        "question": "Como obtenho o meu cartão de aluno?",
        "answer": "Podes solicitar o teu cartão de aluno através do balcão de atendimento na Caixa Geral de Depósitos ou via online no portal académico após a matrícula.",
        "category": "Geral"
    },
    {
        "id": 2,
        "question": "Onde ficam as cantinas da UBI?",
        "answer": "Existem cantinas em todos os polos principais: Polo I (Faculdade de Letras), Polo II (Engenharias) e Polo IV (Ciências Sociais).",
        "category": "Alimentação"
    },
    {
        "id": 3,
        "question": "Como acedo à rede Wi-Fi Eduroam?",
        "answer": "Utiliza o teu e-mail institucional (ex: aluno123@ubi.pt) e a password do portal académico. Configurações automáticas disponíveis no site do CI-UBI.",
        "category": "Tecnologia"
    },
    {
        "id": 4,
        "question": "Quais são os horários da Biblioteca Central?",
        "answer": "A Biblioteca Central (Polo I) funciona 24h, todos os dias, excepto alguns feriados.",
        "category": "Estudo"
    },
    {
        "id": 5,
        "question": "Como posso candidatar-me a uma bolsa de estudo?",
        "answer": "As candidaturas são feitas através do portal da DGES. Podes obter apoio nos Serviços de Ação Social da UBI (SASUBI).",
        "category": "Apoio"
    },
    {
        "id": 6,
        "question": "Onde posso imprimir documentos no campus?",
        "answer": "Existem centros de cópias no Polo I, Polo II e na sede da AAUBI. Também podes imprimir em regime de self-service nalgumas bibliotecas.",
        "category": "Serviços"
    },
    {
        "id": 7,
        "question": "Como funcionam os transportes públicos na Covilhã?",
        "answer": "A rede de autocarros (Covilhã Mobilidade) liga todos os polos da universidade. Alunos da UBI têm descontos no passe mensal.",
        "category": "Transportes"
    },
    {
        "id": 8,
        "question": "O que é o Portal Académico?",
        "answer": "É a plataforma onde geres a tua vida académica: notas, inscrições em exames, pagamentos de propinas e horários.",
        "category": "Tecnologia"
    }
]

@app.get("/faqs", response_model=List[FAQItem])
async def get_faqs():
    return faqs

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
