from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from flask import Blueprint, jsonify, request
from mongoengine.errors import DoesNotExist, ValidationError

from app.src.models import Imovel
from app.src.models.imovel import Venda
from app.src.models.vendedor import Vendedor
from app.src.routes.login import autenticacao_obrigatoria

imovel_bp = Blueprint("imovel", __name__, url_prefix="/imoveis")


def _buscar_imovel_por_id(imovel_id: str):
    try:
        ObjectId(imovel_id)
    except (InvalidId, TypeError):
        return None, (jsonify({"erro": "ID de imóvel inválido."}), 400)

    try:
        imovel = Imovel.objects.get(id=imovel_id)
        return imovel, None
    except DoesNotExist:
        return None, (jsonify({"erro": "Imóvel não encontrado."}), 404)


def _parse_bool(valor: str):
    return valor.strip().lower() in ("true", "1", "sim", "yes")


@imovel_bp.route("", methods=["GET"], strict_slashes=False)
def listar_imoveis():
    filtros = {}

    for campo in ("status", "tipo", "cidade", "estado", "bairro"):
        valor = request.args.get(campo)
        if valor:
            filtros[campo] = valor

    valor_aluguel = request.args.get("e_aluguel")
    if valor_aluguel is not None:
        filtros["e_aluguel"] = _parse_bool(valor_aluguel)

    valor_vendido = request.args.get("vendido")
    if valor_vendido is not None:
        filtros["vendido"] = _parse_bool(valor_vendido)

    imoveis = Imovel.objects(**filtros)
    return jsonify([imovel.to_dict() for imovel in imoveis]), 200


@imovel_bp.route("/<imovel_id>", methods=["GET"], strict_slashes=False)
def obter_imovel(imovel_id: str):
    imovel, erro = _buscar_imovel_por_id(imovel_id)
    if erro:
        return erro

    return jsonify(imovel.to_dict()), 200


@imovel_bp.route("", methods=["POST"], strict_slashes=False)
@autenticacao_obrigatoria
def criar_imovel():
    dados = request.get_json(silent=True) or {}

    campos_obrigatorios = [
        "titulo_anuncio",
        "proprietario_nome",
        "proprietario_contato",
        "descricao_imovel",
        "cep",
        "logradouro",
        "bairro",
        "cidade",
        "estado",
        "numero_endereco",
        "tipo",
        "valor",
        "metros_quadrados",
    ]
    faltantes = [
        campo
        for campo in campos_obrigatorios
        if dados.get(campo) is None or dados.get(campo) == ""
    ]
    if faltantes:
        return jsonify({
            "erro": f"Campos obrigatórios ausentes: {', '.join(faltantes)}."
        }), 400

    try:
        captador = None
        if dados.get("captador_id"):
            captador = Vendedor.objects.get(id=dados["captador_id"], ativo=True)
        novo_imovel = Imovel(
            titulo_anuncio=dados["titulo_anuncio"],
            proprietario_nome=dados["proprietario_nome"],
            proprietario_contato=dados["proprietario_contato"],
            descricao_imovel=dados["descricao_imovel"],
            cep=dados["cep"],
            logradouro=dados["logradouro"],
            bairro=dados["bairro"],
            cidade=dados["cidade"],
            estado=dados["estado"],
            numero_endereco=dados["numero_endereco"],
            status=dados.get("status", "disponivel"),
            e_aluguel=dados.get("e_aluguel", False),
            tipo=dados["tipo"],
            valor=dados["valor"],
            percentual_comissao=dados.get("percentual_comissao", 6),
            captador_id=str(captador.id) if captador else None,
            captador_nome=captador.nome if captador else None,
            percentual_comissao_captador=dados.get("percentual_comissao_captador", 0),
            metros_quadrados=dados["metros_quadrados"],
            qtd_vaga_veiculo=dados.get("qtd_vaga_veiculo", 0),
            qtd_quartos=dados.get("qtd_quartos", 0),
            qtd_banheiros=dados.get("qtd_banheiros", 0),
            imagem=dados.get("imagem"),
        )
        novo_imovel.save()
        return jsonify(novo_imovel.to_dict()), 201
    except DoesNotExist:
        return jsonify({"erro": "Vendedor captador ativo não encontrado."}), 404
    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos.", "detalhes": str(e)}), 400


@imovel_bp.route("/<imovel_id>", methods=["PUT", "PATCH"], strict_slashes=False)
@autenticacao_obrigatoria
def atualizar_imovel(imovel_id: str):
    imovel, erro = _buscar_imovel_por_id(imovel_id)
    if erro:
        return erro

    if imovel.vendido:
        return jsonify({"erro": "Imóveis vendidos não podem ser alterados."}), 409

    dados = request.get_json(silent=True) or {}
    if not dados:
        return jsonify({"erro": "Nenhum dado enviado para atualização."}), 400

    campos_permitidos = [
        "titulo_anuncio",
        "proprietario_nome",
        "proprietario_contato",
        "descricao_imovel",
        "cep",
        "logradouro",
        "bairro",
        "cidade",
        "estado",
        "numero_endereco",
        "status",
        "e_aluguel",
        "tipo",
        "valor",
        "percentual_comissao",
        "captador_id",
        "percentual_comissao_captador",
        "metros_quadrados",
        "qtd_vaga_veiculo",
        "qtd_quartos",
        "qtd_banheiros",
        "imagem",
        "vendido",
    ]

    if "captador_id" in dados:
        try:
            captador = Vendedor.objects.get(id=dados["captador_id"], ativo=True)
            dados["captador_id"] = str(captador.id)
            imovel.captador_nome = captador.nome
        except DoesNotExist:
            return jsonify({"erro": "Vendedor captador ativo não encontrado."}), 404

    for campo in campos_permitidos:
        if campo in dados:
            setattr(imovel, campo, dados[campo])
    imovel.atualizado_em = datetime.utcnow()

    try:
        imovel.save()
        return jsonify(imovel.to_dict()), 200
    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos.", "detalhes": str(e)}), 400


@imovel_bp.route("/<imovel_id>/venda", methods=["POST"], strict_slashes=False)
@autenticacao_obrigatoria
def registrar_venda(imovel_id: str):
    imovel, erro = _buscar_imovel_por_id(imovel_id)
    if erro:
        return erro

    if imovel.vendido:
        return jsonify({"erro": "Este imóvel já foi vendido e não pode ser alterado."}), 409

    dados = request.get_json(silent=True) or {}
    obrigatorios = ["vendedor_id", "valor_venda", "data_venda", "nome_do_cliente"]
    faltantes = [campo for campo in obrigatorios if dados.get(campo) in (None, "")]
    if faltantes:
        return jsonify({"erro": f"Campos obrigatórios ausentes: {', '.join(faltantes)}."}), 400

    try:
        vendedor = Vendedor.objects.get(id=dados["vendedor_id"], ativo=True)
        data_venda = datetime.fromisoformat(str(dados["data_venda"]))
        valor_venda = float(dados["valor_venda"])
        percentual_imobiliaria = float(imovel.percentual_comissao or 0)
        percentual_vendedor = float(vendedor.percentual_comissao or 0)
        comissao_imobiliaria = valor_venda * percentual_imobiliaria / 100
        comissao_vendedor = comissao_imobiliaria * percentual_vendedor / 100
        percentual_captador = float(imovel.percentual_comissao_captador or 0)
        comissao_captador = comissao_imobiliaria * percentual_captador / 100
        comissao_liquida = comissao_imobiliaria - comissao_vendedor - comissao_captador
        if comissao_liquida < 0:
            return jsonify({"erro": "As comissões do vendedor e do captador ultrapassam a comissão da imobiliária."}), 400
        imovel.venda = Venda(
            vendedor_id=str(vendedor.id), vendedor_nome=vendedor.nome,
            valor_venda=valor_venda,
            data_venda=data_venda,
            nome_do_cliente=dados["nome_do_cliente"],
            percentual_comissao_imobiliaria=percentual_imobiliaria,
            percentual_comissao_vendedor=percentual_vendedor,
            comissao_imobiliaria=comissao_imobiliaria,
            comissao_vendedor=comissao_vendedor,
            captador_id=imovel.captador_id,
            captador_nome=imovel.captador_nome,
            percentual_comissao_captador=percentual_captador,
            comissao_captador=comissao_captador,
            comissao_liquida_imobiliaria=comissao_liquida,
        )
        imovel.vendido = True
        imovel.status = "nao_disponivel"
        imovel.atualizado_em = datetime.utcnow()
        imovel.save()
        return jsonify(imovel.to_dict()), 200
    except DoesNotExist:
        return jsonify({"erro": "Vendedor ativo não encontrado."}), 404
    except (TypeError, ValueError, ValidationError) as error:
        return jsonify({"erro": "Dados da venda inválidos.", "detalhes": str(error)}), 400


@imovel_bp.route("/<imovel_id>", methods=["DELETE"], strict_slashes=False)
@autenticacao_obrigatoria
def deletar_imovel(imovel_id: str):
    imovel, erro = _buscar_imovel_por_id(imovel_id)
    if erro:
        return erro

    imovel.delete()
    return jsonify({"mensagem": "Imóvel removido com sucesso."}), 200
