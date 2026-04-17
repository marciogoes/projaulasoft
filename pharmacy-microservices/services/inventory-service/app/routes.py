"""
routes.py — Endpoints REST do inventory-service.

Organizado em dois grupos:
 - /inventory — consultas e operações diretas do estoque
 - /events    — endpoint de entrada do event bus (eventos de outros serviços)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from . import crud, schemas, models, product_client
from .database import get_db

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get(
    "/stock",
    response_model=list[schemas.StockItemRead],
    summary="Listar estoques",
)
def listar_estoques(
    apenas_baixo: bool = Query(False, description="Apenas itens abaixo do mínimo"),
    db: Session = Depends(get_db),
):
    """Lista todos os itens em estoque."""
    return crud.list_stock(db, apenas_baixo=apenas_baixo)


@router.get(
    "/stock/{produto_id}",
    response_model=schemas.StockItemRead,
    summary="Consultar estoque de um produto",
)
def consultar_estoque(produto_id: int, db: Session = Depends(get_db)):
    """Retorna a quantidade atual em estoque para um produto."""
    item = crud.get_stock_by_produto(db, produto_id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"Nenhum estoque registrado para o produto {produto_id}",
        )
    return item


@router.post(
    "/movements",
    response_model=schemas.MovementRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar movimento de estoque",
)
def registrar_movimento(
    payload: schemas.MovementCreate,
    db: Session = Depends(get_db),
):
    """
    Registra uma entrada ou saída de estoque.

    Para ENTRADA, valida que o produto existe no product-service.
    Para SAIDA, valida que há saldo suficiente.
    """
    # Chamada síncrona ao outro microserviço
    try:
        product_client.validar_produto(payload.produto_id)
    except product_client.ProductNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except product_client.ProductServiceUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))

    try:
        return crud.aplicar_movimento(db, payload)
    except crud.EstoqueInsuficienteError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get(
    "/movements",
    response_model=list[schemas.MovementRead],
    summary="Listar movimentos",
)
def listar_movimentos(
    produto_id: int | None = Query(default=None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Lista movimentos ordenados por mais recente."""
    return crud.listar_movimentos(db, produto_id=produto_id, limit=limit)


@router.patch(
    "/stock/{produto_id}/minimo",
    response_model=schemas.StockItemRead,
    summary="Ajustar estoque mínimo",
)
def atualizar_minimo(
    produto_id: int,
    payload: schemas.EstoqueMinimoUpdate,
    db: Session = Depends(get_db),
):
    """Atualiza o limiar de estoque mínimo (base para alertas)."""
    item = crud.update_estoque_minimo(db, produto_id, payload.estoque_minimo)
    if not item:
        raise HTTPException(status_code=404, detail="Produto sem estoque registrado")
    return item


# --- EVENTOS --------------------------------------------------------
# Endpoint que consome eventos publicados por outros serviços.
# Didático: simula um "event bus" usando apenas HTTP POST.
eventos_router = APIRouter(prefix="/events", tags=["events"])


@eventos_router.post(
    "/sale-created",
    status_code=status.HTTP_200_OK,
    summary="[Evento] Venda criada — dá baixa no estoque",
)
def on_sale_created(
    evento: schemas.VendaCriadaEvento,
    db: Session = Depends(get_db),
):
    """
    Handler do evento `sale.created` emitido pelo sales-service.

    Para cada item da venda, registra uma SAIDA de estoque.
    A referencia_externa recebe o id da venda (rastreabilidade).
    """
    movimentos_aplicados = []
    for item in evento.itens:
        mov = schemas.MovementCreate(
            produto_id=item["produto_id"],
            tipo=models.TipoMovimento.SAIDA,
            quantidade=item["quantidade"],
            observacao=f"Venda #{evento.venda_id}",
            referencia_externa=f"venda:{evento.venda_id}",
        )
        try:
            m = crud.aplicar_movimento(db, mov)
            movimentos_aplicados.append(m.id)
        except crud.EstoqueInsuficienteError as e:
            # Em produção: publicar um evento de compensação ou DLQ.
            # Didático: apenas log e seguir.
            print(f"[WARN] {e}")
    return {"movimentos_aplicados": movimentos_aplicados}
