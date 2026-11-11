import mongoengine as me

class Usuario(me.Document):
    meta = {
        'collection': 'usuarios'
    }

    nome = me.StringField(required=True, max_length=120)
    email = me.EmailField(required=True, unique=True)
    usuario = me.StringField(required=True, unique=True, max_length=50)
    senha = me.StringField(required=True)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "nome": self.nome,
            "email": self.email,
            "usuario": self.usuario
        }

    def __repr__(self) -> str:
        return f"<Usuario {self.usuario}>"
