from flask import Flask
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

    return app
