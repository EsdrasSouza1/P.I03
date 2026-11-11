from email_validator import EmailNotValidError, validate_email
from flask import Blueprint, current_app, jsonify, request, session
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from mongoengine.errors import DoesNotExist, ValidationError
from werkzeug.security import check_password_hash

from app.src.models import Usuario

login_bp = Blueprint("login", __name__)


def _token_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="auth-token")


def _gerar_token(usuario_id: str, lembrar: bool = False) -> str:
    return _token_serializer().dumps({"usuario_id": usuario_id, "lembrar": lembrar})


def _validar_token(token: str):
    max_age = current_app.config.get("REMEMBER_TOKEN_EXPIRATION_SECONDS", 2592000)
    try:
        dados = _token_serializer().loads(token, max_age=max_age)
        if not dados.get("lembrar"):
            curto = current_app.config.get("TOKEN_EXPIRATION_SECONDS", 86400)
            _token_serializer().loads(token, max_age=curto)
        return dados.get("usuario_id")
    except (BadSignature, SignatureExpired):
        return None


def _extrair_usuario_id_da_requisicao():
    usuario_id = session.get("usuario_id")
    if usuario_id:
        return usuario_id

    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip()
        if token:
            return _validar_token(token)

    return None


@login_bp.route("/login", methods=["POST"], strict_slashes=False)
def login():
    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        return jsonify({"erro": "Corpo da requisição deve ser um JSON válido."}), 400

    email = dados.get("email")
    usuario_nome = dados.get("usuario")
    identificador = (email if email is not None else usuario_nome) or ""

    if not isinstance(identificador, str):
        return jsonify({"erro": "E-mail ou usuário inválido."}), 400

    identificador = identificador.strip()
    senha = dados.get("senha")
    lembrar = bool(dados.get("lembrar", False))

    if not identificador or not isinstance(senha, str) or not senha:
        return jsonify({"erro": "E-mail/usuário e senha são obrigatórios."}), 400

    if email is not None or "@" in identificador:
        try:
            email_normalizado = validate_email(identificador, check_deliverability=False).normalized
            identificador = email_normalizado
        except EmailNotValidError:
            return jsonify({"erro": "Informe um e-mail válido."}), 400

    usuario = (
        Usuario.objects(email__iexact=identificador).first()
        or Usuario.objects(usuario=identificador).first()
    )

    if not usuario or not check_password_hash(usuario.senha, senha):
        return jsonify({"erro": "E-mail ou senha inválidos."}), 401

    usuario_id = str(usuario.id)
    session["usuario_id"] = usuario_id
    session.permanent = lembrar

    return jsonify({
        "mensagem": "Login realizado com sucesso.",
        "autenticado": True,
        "token": _gerar_token(usuario_id, lembrar=lembrar),
        "usuario": usuario.to_dict(),
    }), 200


@login_bp.route("/logout", methods=["POST"], strict_slashes=False)
def logout():
    session.pop("usuario_id", None)
    return jsonify({
        "mensagem": "Logout realizado com sucesso.",
        "autenticado": False,
    }), 200


@login_bp.route("/me", methods=["GET"], strict_slashes=False)
def usuario_autenticado():
    usuario_id = _extrair_usuario_id_da_requisicao()
    if not usuario_id:
        return jsonify({"erro": "Usuário não autenticado.", "autenticado": False}), 401

    try:
        usuario = Usuario.objects.get(id=usuario_id)
        return jsonify({
            "autenticado": True,
            "usuario": usuario.to_dict(),
        }), 200
    except (DoesNotExist, ValidationError):
        session.pop("usuario_id", None)
        return jsonify({"erro": "Sessão inválida ou usuário não encontrado.", "autenticado": False}), 401
