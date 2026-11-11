from flask import Flask, jsonify
from mongoengine.connection import get_db
from config import Config
from app.extensions import register_extensions, db
from app.src.routes import register_routes

def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Inicializa as extensões (estabelece a conexão com o MongoDB)
    register_extensions(app)

    # Registra os blueprints de rotas da aplicação
    register_routes(app)

    @app.get('/api/health')
    def health_check():
        try:
            get_db().command('ping')
            return jsonify({"status": "ok", "mongodb": "conectado"}), 200
        except Exception as error:
            app.logger.error("Falha na conexão com o MongoDB: %s", error)
            return jsonify({"status": "erro", "mongodb": "indisponível"}), 503

    return app
