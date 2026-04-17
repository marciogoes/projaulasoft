"""
crud.py — Lógica de acesso a dados do sales-service.

A criação de venda é uma SAGA simplificada:
 1. Valida produtos e busca preços (product-service)
 2. Verifica estoque disponível (inventory-service)
 3. Grava a venda localmente
 4. Publica evento `sale.created` para baixar estoque

Didático: este é um exemplo de "orquestração" — um serviço
coordena ação de outros. A alternativa é "coreografia", onde
cada serviço reage a eventos sem coordenador central.
"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from . import models, schemas, external_services


def criar_venda(db: Session, payload: schemas.SaleCreate) -> models.Sale:
    """
    Cria uma venda coordenando product-service e inventory-service.

    Raises:
        ProductNotFoundError, EstoqueInsuficienteError, ServicoIndisponivelError
    """
    # --- Passo 1: validar produtos e obter preços ------------------
    itens_enriquecidos = []
    total = 0.0
    for item in payload.itens:
        produto = external_services.obter_produto(item.produto_id)
        preco = float(produto["preco"])
        subtotal = preco * item.quantidade
        total += subtotal
        itens_enriquecidos.append({
            "produto_id": item.produto_id,
            "quantidade": item.quantidade,
            "preco_unitario": preco,
            "subtotal": subtotal,
        })

    # --- Passo 2: verificar estoque de cada item -------------------
    for item in payload.itens:
        external_services.verificar_estoque(item.produto_id, item.quantidade)

    # --- Passo 3: gravar venda (transação local) -------------------
    venda = models.Sale(cliente=payload.cliente, total=round(total, 2))
    db.add(venda)
    db.flush()  # garante venda.id antes de criar os itens

    for ie in itens_enriquecidos:
        db.add(models.SaleItem(
            sale_id=venda.id,
            produto_id=ie["produto_id"],
            quantidade=ie["quantidade"],
            preco_unitario=ie["preco_unitario"],
            subtotal=ie["subtotal"],
        ))

    db.commit()
    db.refresh(venda)

    # --- Passo 4: publicar evento (após commit local) --------------
    # Se a publicação falhar, a venda fica gravada mas o estoque
    # não baixa automaticamente. Em produção, use outbox pattern.
    external_services.publicar_venda_criada(
        venda_id=venda.id,
        itens=[{"produto_id": ie["produto_id"], "quantidade": ie["quantidade"]}
               for ie in itens_enriquecidos],
    )

    return venda


def get_venda(db: Session, venda_id: int) -> models.Sale | None:
    return db.get(models.Sale, venda_id)


def listar_vendas(db: Session, skip: int = 0, limit: int = 100) -> list[models.Sale]:
    stmt = (
        select(models.Sale)
        .order_by(models.Sale.criado_em.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())
