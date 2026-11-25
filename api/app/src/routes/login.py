from email_validator import EmailNotValidError, validate_email
from collections import defaultdict, deque
from functools import wraps
from time import time

from flask import Blueprint, current_app, g, jsonify, request, session
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from mongoengine.errors import DoesNotExist, ValidationError
from werkzeug.security import check_password_hash

from app.src.models import Usuario

login_bp = Blueprint("login", __name__)
_tentativas_login = defaultdict(deque)


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


def autenticacao_obrigatoria(funcao):
    @wraps(funcao)
    def protegida(*args, **kwargs):
        usuario_id = _extrair_usuario_id_da_requisicao()
        if not usuario_id:
            return jsonify({"erro": "Autenticação obrigatória."}), 401
        try:
            g.usuario_atual = Usuario.objects.get(id=usuario_id)
        except (DoesNotExist, ValidationError):
            session.clear()
            return jsonify({"erro": "Sessão inválida ou expirada."}), 401
        return funcao(*args, **kwargs)
    return protegida


def _limite_login_excedido(identificador: str) -> bool:
    chave = f"{request.remote_addr}:{identificador.lower()}"
    agora = time()
    tentativas = _tentativas_login[chave]
    while tentativas and tentativas[0] < agora - 900:
        tentativas.popleft()
    if len(tentativas) >= 8:
        return True
    return False


def _registrar_falha_login(identificador: str) -> None:
    _tentativas_login[f"{request.remote_addr}:{identificador.lower()}"].append(time())


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

    if _limite_login_excedido(identificador):
        return jsonify({"erro": "Muitas tentativas de acesso. Aguarde alguns minutos."}), 429

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
        _registrar_falha_login(identificador)
        return jsonify({"erro": "E-mail ou senha inválidos."}), 401

    usuario_id = str(usuario.id)
    session.clear()
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
