from datetime import datetime

import mongoengine as me


class Vendedor(me.Document):
    meta = {"collection": "vendedores"}

    nome = me.StringField(required=True, max_length=120)
    email = me.EmailField(required=True, unique=True)
    telefone = me.StringField(max_length=30)
    creci = me.StringField(max_length=40)
    percentual_comissao = me.FloatField(required=True, min_value=0, max_value=100)
    ativo = me.BooleanField(default=True)
    criado_em = me.DateTimeField(default=datetime.utcnow)
    atualizado_em = me.DateTimeField(default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id), "nome": self.nome, "email": self.email,
            "telefone": self.telefone, "creci": self.creci,
            "percentual_comissao": self.percentual_comissao, "ativo": self.ativo,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
            "atualizado_em": self.atualizado_em.isoformat() if self.atualizado_em else None,
        }
