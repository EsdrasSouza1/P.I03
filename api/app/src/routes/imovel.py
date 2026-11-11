from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from mongoengine.errors import DoesNotExist, ValidationError

from app.src.models import Imovel

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

    imoveis = Imovel.objects(**filtros)
    return jsonify([imovel.to_dict() for imovel in imoveis]), 200


@imovel_bp.route("/<imovel_id>", methods=["GET"], strict_slashes=False)
def obter_imovel(imovel_id: str):
    imovel, erro = _buscar_imovel_por_id(imovel_id)
    if erro:
        return erro

    return jsonify(imovel.to_dict()), 200


@imovel_bp.route("", methods=["POST"], strict_slashes=False)
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
            metros_quadrados=dados["metros_quadrados"],
            qtd_vaga_veiculo=dados.get("qtd_vaga_veiculo", 0),
            qtd_quartos=dados.get("qtd_quartos", 0),
            qtd_banheiros=dados.get("qtd_banheiros", 0),
            imagem=dados.get("imagem"),
        )
        novo_imovel.save()
        return jsonify(novo_imovel.to_dict()), 201
    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos.", "detalhes": str(e)}), 400


@imovel_bp.route("/<imovel_id>", methods=["PUT", "PATCH"], strict_slashes=False)
def atualizar_imovel(imovel_id: str):
    imovel, erro = _buscar_imovel_por_id(imovel_id)
    if erro:
        return erro

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
        "metros_quadrados",
        "qtd_vaga_veiculo",
        "qtd_quartos",
        "qtd_banheiros",
        "imagem",
    ]

    for campo in campos_permitidos:
        if campo in dados:
            setattr(imovel, campo, dados[campo])

    try:
        imovel.save()
        return jsonify(imovel.to_dict()), 200
    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos.", "detalhes": str(e)}), 400


@imovel_bp.route("/<imovel_id>", methods=["DELETE"], strict_slashes=False)
def deletar_imovel(imovel_id: str):
    imovel, erro = _buscar_imovel_por_id(imovel_id)
    if erro:
        return erro

    imovel.delete()
    return jsonify({"mensagem": "Imóvel removido com sucesso."}), 200
