"""
seed_data.py — Popula o sistema com dados de exemplo.

Uso:
    python scripts/seed_data.py

Pré-requisitos:
    Todos os serviços devem estar rodando (docker-compose up ou make run-local).

Didático: este script mostra o fluxo completo do sistema funcionando:
 1. Cadastra medicamentos no product-service
 2. Dá entrada de estoque no inventory-service
 3. Registra algumas vendas no sales-service
"""
import sys
import time
import httpx

GATEWAY = "http://localhost:8000"


MEDICAMENTOS = [
    {"nome": "Dipirona Sódica 500mg 20cpr",
     "codigo_barras": "7891058000011", "fabricante": "EMS",
     "preco": 12.50, "requer_receita": False},
    {"nome": "Paracetamol 750mg 20cpr",
     "codigo_barras": "7891058000028", "fabricante": "Medley",
     "preco": 8.90, "requer_receita": False},
    {"nome": "Amoxicilina 500mg 21cps",
     "codigo_barras": "7891058000035", "fabricante": "Eurofarma",
     "preco": 35.90, "requer_receita": True},
    {"nome": "Ibuprofeno 600mg 20cpr",
     "codigo_barras": "7891058000042", "fabricante": "Advil",
     "preco": 22.40, "requer_receita": False},
    {"nome": "Omeprazol 20mg 28cps",
     "codigo_barras": "7891058000059", "fabricante": "Neo Química",
     "preco": 18.70, "requer_receita": False},
    {"nome": "Losartana Potássica 50mg 30cpr",
     "codigo_barras": "7891058000066", "fabricante": "Biosintética",
     "preco": 15.30, "requer_receita": True},
    {"nome": "Sinvastatina 20mg 30cpr",
     "codigo_barras": "7891058000073", "fabricante": "Sandoz",
     "preco": 19.90, "requer_receita": True},
    {"nome": "Soro Fisiológico 0,9% 500ml",
     "codigo_barras": "7891058000080", "fabricante": "JP",
     "preco": 7.20, "requer_receita": False},
]


def aguardar_servicos(timeout: int = 30) -> None:
    """Aguarda o gateway ficar pronto antes de começar."""
    print("⏳ Aguardando serviços ficarem prontos...")
    inicio = time.time()
    while time.time() - inicio < timeout:
        try:
            r = httpx.get(f"{GATEWAY}/health", timeout=2.0)
            if r.status_code == 200:
                status = r.json()
                if all(s == "ok" for s in status.get("services", {}).values()):
                    print("✅ Todos os serviços prontos!\n")
                    return
        except httpx.RequestError:
            pass
        time.sleep(1)
    print("⚠️  Timeout aguardando serviços. Continuando mesmo assim...\n")


def cadastrar_medicamentos() -> list[int]:
    """Cadastra os medicamentos e retorna os IDs criados."""
    print("📦 Cadastrando medicamentos...")
    ids = []
    for med in MEDICAMENTOS:
        r = httpx.post(f"{GATEWAY}/api/products", json=med, timeout=5.0)
        if r.status_code == 201:
            data = r.json()
            ids.append(data["id"])
            print(f"   ✓ #{data['id']:<3} {data['nome']}")
        elif r.status_code == 409:
            # já existe — busca pelo código
            r2 = httpx.get(f"{GATEWAY}/api/products", timeout=5.0)
            for p in r2.json():
                if p["codigo_barras"] == med["codigo_barras"]:
                    ids.append(p["id"])
                    print(f"   = #{p['id']:<3} {p['nome']} (já existia)")
                    break
        else:
            print(f"   ✗ Erro ao cadastrar {med['nome']}: {r.status_code} {r.text}")
    print()
    return ids


def dar_entrada_estoque(ids: list[int]) -> None:
    """Dá entrada de estoque para os produtos cadastrados."""
    print("🏪 Dando entrada de estoque inicial...")
    # Quantidades variadas para testar "estoque baixo"
    quantidades = [150, 80, 45, 100, 200, 5, 3, 120]
    for i, (produto_id, qtd) in enumerate(zip(ids, quantidades)):
        r = httpx.post(
            f"{GATEWAY}/api/inventory/movements",
            json={
                "produto_id": produto_id,
                "tipo": "ENTRADA",
                "quantidade": qtd,
                "observacao": "Estoque inicial (seed)",
            },
            timeout=5.0,
        )
        if r.status_code == 201:
            print(f"   ✓ Produto #{produto_id}: +{qtd} unidades")
        else:
            print(f"   ✗ Falha no produto #{produto_id}: {r.status_code}")
    print()


def registrar_vendas_exemplo(ids: list[int]) -> None:
    """Registra algumas vendas para demonstrar o fluxo completo."""
    if len(ids) < 3:
        return
    print("💰 Registrando vendas de exemplo...")
    vendas = [
        {"cliente": "Maria Oliveira", "itens": [
            {"produto_id": ids[0], "quantidade": 2},
            {"produto_id": ids[1], "quantidade": 1},
        ]},
        {"cliente": "João Pereira", "itens": [
            {"produto_id": ids[3], "quantidade": 1},
        ]},
        {"cliente": "Ana Souza", "itens": [
            {"produto_id": ids[0], "quantidade": 1},
            {"produto_id": ids[4], "quantidade": 1},
            {"produto_id": ids[7], "quantidade": 2},
        ]},
    ]
    for v in vendas:
        r = httpx.post(f"{GATEWAY}/api/sales", json=v, timeout=5.0)
        if r.status_code == 201:
            data = r.json()
            print(f"   ✓ Venda #{data['id']} — {v['cliente']} — R$ {data['total']:.2f}")
        else:
            print(f"   ✗ Falha: {r.status_code} {r.text}")
    print()


def imprimir_resumo() -> None:
    print("📊 Resumo final:")
    produtos = httpx.get(f"{GATEWAY}/api/products").json()
    estoques = httpx.get(f"{GATEWAY}/api/inventory/stock").json()
    vendas = httpx.get(f"{GATEWAY}/api/sales").json()
    baixos = [s for s in estoques if s["quantidade"] <= s["estoque_minimo"]]

    print(f"   • Medicamentos cadastrados: {len(produtos)}")
    print(f"   • Itens em estoque:         {len(estoques)}")
    print(f"   • Vendas registradas:       {len(vendas)}")
    print(f"   • Itens com estoque baixo:  {len(baixos)}")
    if baixos:
        print("\n   ⚠️  Produtos com estoque abaixo do mínimo:")
        for s in baixos:
            p = next((p for p in produtos if p["id"] == s["produto_id"]), None)
            nome = p["nome"] if p else f"produto {s['produto_id']}"
            print(f"      - {nome}: {s['quantidade']}/{s['estoque_minimo']}")


def main() -> int:
    print("=" * 60)
    print("  Pharmacy Microservices — Seed de dados")
    print("=" * 60)
    print()
    aguardar_servicos()
    ids = cadastrar_medicamentos()
    if not ids:
        print("❌ Nenhum produto foi cadastrado. Abortando.")
        return 1
    dar_entrada_estoque(ids)
    registrar_vendas_exemplo(ids)
    imprimir_resumo()
    print()
    print("✅ Seed concluído! Acesse http://localhost:8000/docs para explorar.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
