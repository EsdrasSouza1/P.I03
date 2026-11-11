from flask import Flask

from .imovel import imovel_bp
from .login import login_bp
from .usuario import usuario_bp


def register_routes(app: Flask) -> None:
    app.register_blueprint(usuario_bp)
    app.register_blueprint(imovel_bp)
    app.register_blueprint(login_bp)


__all__ = ["register_routes", "usuario_bp", "imovel_bp", "login_bp"]
