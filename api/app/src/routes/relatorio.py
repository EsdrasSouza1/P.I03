from datetime import datetime, time
from uuid import uuid4

from flask import Blueprint, jsonify, request

from app.src.models import Imovel
from app.src.routes.login import autenticacao_obrigatoria


relatorio_bp = Blueprint("relatorio", __name__, url_prefix="/relatorios")


def _periodo_query():
    query = Imovel.objects(vendido=True, venda__ne=None)
    inicio = request.args.get("inicio")
    fim = request.args.get("fim")
    if inicio:
        query = query(venda__data_venda__gte=datetime.combine(datetime.fromisoformat(inicio).date(), time.min))
    if fim:
        query = query(venda__data_venda__lte=datetime.combine(datetime.fromisoformat(fim).date(), time.max))
    return query


@relatorio_bp.get("/comissoes")
@autenticacao_obrigatoria
def relatorio_comissoes():
    try:
        vendedor_id = request.args.get("vendedor_id")
        situacao = request.args.get("situacao", "todas")
        itens = []
        for imovel in _periodo_query().order_by("venda__data_venda"):
            venda = imovel.venda
            participacoes = [
                ("venda", venda.vendedor_id, venda.vendedor_nome, venda.comissao_vendedor, venda.percentual_comissao_vendedor, venda.comissao_vendedor_paga, venda.comissao_vendedor_paga_em, venda.comissao_vendedor_lote),
                ("captacao", venda.captador_id, venda.captador_nome, venda.comissao_captador, venda.percentual_comissao_captador, venda.comissao_captador_paga, venda.comissao_captador_paga_em, venda.comissao_captador_lote),
            ]
            for tipo, responsavel_id, nome, valor, percentual, paga, paga_em, lote in participacoes:
                if not responsavel_id or not valor:
                    continue
                if vendedor_id and responsavel_id != vendedor_id:
                    continue
                if situacao == "pendentes" and paga:
                    continue
                if situacao == "pagas" and not paga:
                    continue
                itens.append({
                    "chave": f"{imovel.id}:{tipo}", "imovel_id": str(imovel.id), "imovel": imovel.titulo_anuncio,
                    "data_venda": venda.data_venda.date().isoformat(), "valor_venda": venda.valor_venda,
                    "tipo": tipo, "vendedor_id": responsavel_id, "vendedor_nome": nome,
                    "percentual": percentual, "valor_comissao": valor, "paga": paga,
                    "paga_em": paga_em.isoformat() if paga_em else None, "lote": lote,
                })
        return jsonify(itens), 200
    except ValueError:
        return jsonify({"erro": "Período inválido."}), 400


@relatorio_bp.post("/comissoes/pagar")
@autenticacao_obrigatoria
def pagar_comissoes():
    dados = request.get_json(silent=True) or {}
    itens = dados.get("itens") or []
    if not itens:
        return jsonify({"erro": "Selecione ao menos uma comissão para pagamento."}), 400
    lote = f"PG-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid4().hex[:6].upper()}"
    agora = datetime.utcnow()
    pagas = 0
    valor_total = 0
    for item in itens:
        imovel = Imovel.objects(id=item.get("imovel_id"), vendido=True).first()
        if not imovel or not imovel.venda:
            continue
        if item.get("tipo") == "venda" and not imovel.venda.comissao_vendedor_paga:
            imovel.venda.comissao_vendedor_paga = True
            imovel.venda.comissao_vendedor_paga_em = agora
            imovel.venda.comissao_vendedor_lote = lote
            valor_total += imovel.venda.comissao_vendedor or 0
        elif item.get("tipo") == "captacao" and not imovel.venda.comissao_captador_paga:
            imovel.venda.comissao_captador_paga = True
            imovel.venda.comissao_captador_paga_em = agora
            imovel.venda.comissao_captador_lote = lote
            valor_total += imovel.venda.comissao_captador or 0
        else:
            continue
        imovel.save()
        pagas += 1
    return jsonify({"mensagem": "Comissões registradas como pagas.", "lote": lote, "quantidade": pagas, "valor_total": valor_total}), 200


@relatorio_bp.get("/vendas")
@autenticacao_obrigatoria
def relatorio_vendas():
    try:
        vendedor_id = request.args.get("vendedor_id")
        resultado = []
        for imovel in _periodo_query().order_by("-venda__data_venda"):
            venda = imovel.venda
            if vendedor_id and vendedor_id not in (venda.vendedor_id, venda.captador_id):
                continue
            resultado.append({
                "imovel_id": str(imovel.id), "imovel": imovel.titulo_anuncio,
                "data_venda": venda.data_venda.date().isoformat(), "cliente": venda.nome_do_cliente,
                "valor_venda": venda.valor_venda, "vendedor_nome": venda.vendedor_nome,
                "captador_nome": venda.captador_nome, "comissao_imobiliaria": venda.comissao_imobiliaria,
                "comissao_liquida_imobiliaria": venda.comissao_liquida_imobiliaria,
            })
        return jsonify(resultado), 200
    except ValueError:
        return jsonify({"erro": "Período inválido."}), 400
