from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from mongoengine.errors import DoesNotExist, NotUniqueError, ValidationError
from werkzeug.security import generate_password_hash

from app.src.models import Usuario

usuario_bp = Blueprint("usuario", __name__, url_prefix="/usuarios")


def _buscar_usuario_por_id(usuario_id: str):
    try:
        ObjectId(usuario_id)
    except (InvalidId, TypeError):
        return None, (jsonify({"erro": "ID de usuário inválido."}), 400)

    try:
        usuario = Usuario.objects.get(id=usuario_id)
        return usuario, None
    except DoesNotExist:
        return None, (jsonify({"erro": "Usuário não encontrado."}), 404)


@usuario_bp.route("", methods=["GET"], strict_slashes=False)
def listar_usuarios():
    usuarios = Usuario.objects.all()
    return jsonify([u.to_dict() for u in usuarios]), 200


@usuario_bp.route("/<usuario_id>", methods=["GET"], strict_slashes=False)
def obter_usuario(usuario_id: str):
    usuario, erro = _buscar_usuario_por_id(usuario_id)
    if erro:
        return erro

    return jsonify(usuario.to_dict()), 200


@usuario_bp.route("", methods=["POST"], strict_slashes=False)
def criar_usuario():
    dados = request.get_json(silent=True) or {}

    campos_obrigatorios = ["nome", "email", "usuario", "senha"]
    faltantes = [campo for campo in campos_obrigatorios if not dados.get(campo)]
    if faltantes:
        return jsonify({
            "erro": f"Campos obrigatórios ausentes: {', '.join(faltantes)}."
        }), 400

    try:
        novo_usuario = Usuario(
            nome=dados["nome"],
            email=dados["email"],
            usuario=dados["usuario"],
            senha=generate_password_hash(dados["senha"]),
        )
        novo_usuario.save()
        return jsonify(novo_usuario.to_dict()), 201
    except NotUniqueError:
        return jsonify({"erro": "Email ou nome de usuário já cadastrado."}), 409
    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos.", "detalhes": str(e)}), 400


@usuario_bp.route("/<usuario_id>", methods=["PUT", "PATCH"], strict_slashes=False)
def atualizar_usuario(usuario_id: str):
    usuario, erro = _buscar_usuario_por_id(usuario_id)
    if erro:
        return erro

    dados = request.get_json(silent=True) or {}
    if not dados:
        return jsonify({"erro": "Nenhum dado enviado para atualização."}), 400

    if "nome" in dados:
        usuario.nome = dados["nome"]
    if "email" in dados:
        usuario.email = dados["email"]
    if "usuario" in dados:
        usuario.usuario = dados["usuario"]
    if "senha" in dados and dados["senha"]:
        usuario.senha = generate_password_hash(dados["senha"])

    try:
        usuario.save()
        return jsonify(usuario.to_dict()), 200
    except NotUniqueError:
        return jsonify({"erro": "Email ou nome de usuário já cadastrado."}), 409
    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos.", "detalhes": str(e)}), 400


@usuario_bp.route("/<usuario_id>", methods=["DELETE"], strict_slashes=False)
def deletar_usuario(usuario_id: str):
    usuario, erro = _buscar_usuario_por_id(usuario_id)
    if erro:
        return erro

    usuario.delete()
    return jsonify({"mensagem": "Usuário removido com sucesso."}), 200
