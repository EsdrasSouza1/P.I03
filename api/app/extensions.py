from flask import Flask
from flask_mongoengine import MongoEngine

mongo_db = MongoEngine()

def register_extensions(app: flask) -> None:

    mongo_db.init_app(app)

