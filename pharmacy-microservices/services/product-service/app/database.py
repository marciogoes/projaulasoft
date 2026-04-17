"""
database.py — Configuração do banco de dados (SQLite via SQLAlchemy).

Este módulo centraliza a criação do engine, da sessão e da Base ORM.
É o mesmo padrão replicado em todos os microserviços — cada um com
seu próprio arquivo SQLite (padrão "database per service").
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

# URL do banco — pode ser sobrescrita por variável de ambiente.
# Padrão: arquivo SQLite local em ./data/products.db
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/products.db")

# Garante que o diretório data/ exista
os.makedirs("./data", exist_ok=True)

# O argumento check_same_thread=False é específico do SQLite e
# necessário porque o FastAPI pode processar requisições em threads
# diferentes da que criou a conexão.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

# SessionLocal é uma "fábrica" de sessões.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Classe base para todos os modelos ORM."""
    pass


def get_db():
    """
    Dependência do FastAPI que fornece uma sessão de banco.

    Uso: `def rota(db: Session = Depends(get_db))`
    Garante que a sessão seja fechada ao final da requisição.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
