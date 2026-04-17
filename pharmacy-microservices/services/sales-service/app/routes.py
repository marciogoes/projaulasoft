"""routes.py — Endpoints REST do sales-service."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from . import crud, schemas, external_services
from .database import get_db

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post(
    "",
    response_model=schemas.SaleRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar venda",
)
def registrar_venda(payload: schemas.SaleCreate, db: Session = Depends(get_db)):
    """
    Registra uma venda.

    Fluxo (orquestração):
     1. Busca preço de cada produto no product-service
     2. Verifica estoque no inventory-service
     3. Grava venda
     4. Publica evento `sale.created` → inventory dá baixa
    """
    try:
        return crud.criar_venda(db, payload)
    except external_services.ProductNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except external_services.EstoqueInsuficienteError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except external_services.ServicoIndisponivelError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get(
    "",
    response_model=list[schemas.SaleRead],
    summary="Listar vendas",
)
def listar_vendas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Lista vendas mais recentes primeiro."""
    return crud.listar_vendas(db, skip=skip, limit=limit)


@router.get(
    "/{venda_id}",
    response_model=schemas.SaleRead,
    summary="Detalhar venda",
)
def detalhar_venda(venda_id: int, db: Session = Depends(get_db)):
    """Retorna uma venda e seus itens."""
    venda = crud.get_venda(db, venda_id)
    if not venda:
        raise HTTPException(status_code=404, detail=f"Venda {venda_id} não encontrada")
    return venda
