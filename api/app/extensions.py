from urllib.parse import urlparse
from flask import Flask, Response, request
from mongoengine import connect

class MongoDB:
    def __init__(self, app=None):
        self.connection = None
        if app:
            self.init_app(app)

    def init_app(self, app: Flask):
        mongo_uri = app.config.get('MONGO_URI')
        mongo_db = app.config.get('MONGO_DB', 'imobiliaria_db')

        if not mongo_uri:
            raise ValueError("A variável MONGO_URI não foi definida no ambiente ou no arquivo .env.")

        # Conecta ao MongoDB Atlas / Local via MongoEngine
        self.connection = connect(
            db=mongo_db,
            host=mongo_uri
        )
        return self.connection

db = MongoDB()


def _origin_permitida(origin: str, app: Flask) -> bool:
    if not origin:
        return False

    origens_configuradas = app.config.get('CORS_ORIGINS') or []
    if origin in origens_configuradas:
        return True

    parsed = urlparse(origin)
    return parsed.scheme in ('http', 'https') and parsed.hostname in ('localhost', '127.0.0.1')


def register_cors(app: Flask) -> None:
    @app.before_request
    def responder_preflight():
        if request.method == 'OPTIONS':
            return Response(status=204)

    @app.after_request
    def adicionar_headers_cors(response: Response) -> Response:
        origin = request.headers.get('Origin')
        if _origin_permitida(origin, app):
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response.headers.add('Vary', 'Origin')
        return response


def register_extensions(app: Flask) -> None:
    db.init_app(app)
    register_cors(app)
