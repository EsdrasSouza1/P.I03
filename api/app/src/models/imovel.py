import mongoengine as me

class Imovel(me.Document):
    meta = {
        'collection': 'imoveis'
    }

    titulo_anuncio = me.StringField(required=True, max_length=120)
    proprietario_nome = me.StringField(required=True, max_length=120)
    proprietario_contato = me.StringField(required=True, max_length=50)
    descricao_imovel = me.StringField(required=True)
    cep = me.StringField(required=True, max_length=9)
    logradouro = me.StringField(required=True, max_length=150)
    bairro = me.StringField(required=True, max_length=100)
    cidade = me.StringField(required=True, max_length=100)
    estado = me.StringField(required=True, max_length=2)
    numero_endereco = me.StringField(required=True, max_length=20)
    status = me.StringField(
        choices=['disponivel', 'nao_disponivel'],
        default='disponivel'
    )
    e_aluguel = me.BooleanField(default=False)
    tipo = me.StringField(
        required=True,
        choices=[
            'apartamento',
            'casa',
            'casa_condominio',
            'chacara',
            'comercial',
            'galpao',
            'terreno',
        ]
    )
    valor = me.FloatField(required=True)
    metros_quadrados = me.FloatField(required=True)
    qtd_vaga_veiculo = me.IntField(default=0)
    qtd_quartos = me.IntField(default=0)
    qtd_banheiros = me.IntField(default=0)
    imagem = me.StringField()

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "titulo_anuncio": self.titulo_anuncio,
            "proprietario_nome": self.proprietario_nome,
            "proprietario_contato": self.proprietario_contato,
            "descricao_imovel": self.descricao_imovel,
            "cep": self.cep,
            "logradouro": self.logradouro,
            "bairro": self.bairro,
            "cidade": self.cidade,
            "estado": self.estado,
            "numero_endereco": self.numero_endereco,
            "status": self.status,
            "e_aluguel": self.e_aluguel,
            "tipo": self.tipo,
            "valor": self.valor,
            "metros_quadrados": self.metros_quadrados,
            "qtd_vaga_veiculo": self.qtd_vaga_veiculo,
            "qtd_quartos": self.qtd_quartos,
            "qtd_banheiros": self.qtd_banheiros,
            "imagem": self.imagem
        }

    def __repr__(self) -> str:
        return f"<Imovel {self.id} - {self.cidade}/{self.estado}>"
