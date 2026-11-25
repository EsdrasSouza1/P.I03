from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from mongoengine.errors import DoesNotExist, NotUniqueError, ValidationError

from app.src.models.vendedor import Vendedor
from app.src.routes.login import autenticacao_obrigatoria

vendedor_bp = Blueprint("vendedor", __name__, url_prefix="/vendedores")


def _buscar_vendedor(vendedor_id):
    try:
        ObjectId(vendedor_id)
        return Vendedor.objects.get(id=vendedor_id), None
    except (InvalidId, TypeError):
        return None, (jsonify({"erro": "ID de vendedor inválido."}), 400)
    except DoesNotExist:
        return None, (jsonify({"erro": "Vendedor não encontrado."}), 404)


@vendedor_bp.get("")
@autenticacao_obrigatoria
def listar_vendedores():
    query = Vendedor.objects
    ativo = request.args.get("ativo")
    if ativo is not None:
        query = query(ativo=ativo.lower() in ("true", "1", "sim"))
    return jsonify([vendedor.to_dict() for vendedor in query.order_by("nome")]), 200


@vendedor_bp.post("")
@autenticacao_obrigatoria
def criar_vendedor():
    dados = request.get_json(silent=True) or {}
    obrigatorios = ["nome", "email", "percentual_comissao"]
    faltantes = [campo for campo in obrigatorios if dados.get(campo) in (None, "")]
    if faltantes:
        return jsonify({"erro": f"Campos obrigatórios ausentes: {', '.join(faltantes)}."}), 400
    try:
        vendedor = Vendedor(nome=dados["nome"], email=dados["email"], telefone=dados.get("telefone"), creci=dados.get("creci"), percentual_comissao=float(dados["percentual_comissao"]), ativo=bool(dados.get("ativo", True))).save()
        return jsonify(vendedor.to_dict()), 201
    except NotUniqueError:
        return jsonify({"erro": "Já existe um vendedor com este e-mail."}), 409
    except (TypeError, ValueError, ValidationError) as error:
        return jsonify({"erro": "Dados do vendedor inválidos.", "detalhes": str(error)}), 400


@vendedor_bp.route("/<vendedor_id>", methods=["PUT", "PATCH"])
@autenticacao_obrigatoria
def atualizar_vendedor(vendedor_id):
    vendedor, erro = _buscar_vendedor(vendedor_id)
    if erro:
        return erro
    dados = request.get_json(silent=True) or {}
    for campo in ("nome", "email", "telefone", "creci", "ativo"):
        if campo in dados:
            setattr(vendedor, campo, dados[campo])
    if "percentual_comissao" in dados:
        vendedor.percentual_comissao = float(dados["percentual_comissao"])
    vendedor.atualizado_em = datetime.utcnow()
    try:
        vendedor.save()
        return jsonify(vendedor.to_dict()), 200
    except NotUniqueError:
        return jsonify({"erro": "Já existe um vendedor com este e-mail."}), 409
    except (TypeError, ValueError, ValidationError) as error:
        return jsonify({"erro": "Dados do vendedor inválidos.", "detalhes": str(error)}), 400


@vendedor_bp.delete("/<vendedor_id>")
@autenticacao_obrigatoria
def desativar_vendedor(vendedor_id):
    vendedor, erro = _buscar_vendedor(vendedor_id)
    if erro:
        return erro
    vendedor.ativo = False
    vendedor.atualizado_em = datetime.utcnow()
    vendedor.save()
    return jsonify({"mensagem": "Vendedor desativado com sucesso."}), 200
