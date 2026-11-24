import mongoengine as me
from datetime import datetime


class Venda(me.EmbeddedDocument):
    vendedor_id = me.StringField(required=True)
    vendedor_nome = me.StringField(required=True, max_length=120)
    valor_venda = me.FloatField(required=True, min_value=0)
    data_venda = me.DateTimeField(required=True)
    nome_do_cliente = me.StringField(required=True, max_length=120)
    percentual_comissao_imobiliaria = me.FloatField(required=True, min_value=0, max_value=100)
    percentual_comissao_vendedor = me.FloatField(required=True, min_value=0, max_value=100)
    comissao_imobiliaria = me.FloatField(required=True, min_value=0)
    comissao_vendedor = me.FloatField(required=True, min_value=0)
    captador_id = me.StringField()
    captador_nome = me.StringField(max_length=120)
    percentual_comissao_captador = me.FloatField(default=0, min_value=0, max_value=100)
    comissao_captador = me.FloatField(default=0, min_value=0)
    comissao_liquida_imobiliaria = me.FloatField(default=0, min_value=0)
    comissao_vendedor_paga = me.BooleanField(default=False)
    comissao_vendedor_paga_em = me.DateTimeField(null=True)
    comissao_vendedor_lote = me.StringField()
    comissao_captador_paga = me.BooleanField(default=False)
    comissao_captador_paga_em = me.DateTimeField(null=True)
    comissao_captador_lote = me.StringField()

    def to_dict(self) -> dict:
        return {
            "vendedor_id": self.vendedor_id,
            "vendedor_nome": self.vendedor_nome,
            "valor_venda": self.valor_venda,
            "data_venda": self.data_venda.date().isoformat() if isinstance(self.data_venda, datetime) else self.data_venda,
            "nome_do_cliente": self.nome_do_cliente,
            "percentual_comissao_imobiliaria": self.percentual_comissao_imobiliaria,
            "percentual_comissao_vendedor": self.percentual_comissao_vendedor,
            "comissao_imobiliaria": self.comissao_imobiliaria,
            "comissao_vendedor": self.comissao_vendedor,
            "captador_id": self.captador_id,
            "captador_nome": self.captador_nome,
            "percentual_comissao_captador": self.percentual_comissao_captador,
            "comissao_captador": self.comissao_captador,
            "comissao_liquida_imobiliaria": self.comissao_liquida_imobiliaria,
            "comissao_vendedor_paga": self.comissao_vendedor_paga,
            "comissao_vendedor_paga_em": self.comissao_vendedor_paga_em.isoformat() if self.comissao_vendedor_paga_em else None,
            "comissao_vendedor_lote": self.comissao_vendedor_lote,
            "comissao_captador_paga": self.comissao_captador_paga,
            "comissao_captador_paga_em": self.comissao_captador_paga_em.isoformat() if self.comissao_captador_paga_em else None,
            "comissao_captador_lote": self.comissao_captador_lote,
        }

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
    percentual_comissao = me.FloatField(default=6, min_value=0, max_value=100)
    captador_id = me.StringField()
    captador_nome = me.StringField(max_length=120)
    percentual_comissao_captador = me.FloatField(default=0, min_value=0, max_value=100)
    metros_quadrados = me.FloatField(required=True)
    qtd_vaga_veiculo = me.IntField(default=0)
    qtd_quartos = me.IntField(default=0)
    qtd_banheiros = me.IntField(default=0)
    imagem = me.StringField()
    vendido = me.BooleanField(default=False)
    venda = me.EmbeddedDocumentField(Venda, null=True)
    criado_em = me.DateTimeField(default=datetime.utcnow)
    atualizado_em = me.DateTimeField(default=datetime.utcnow)

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
            "percentual_comissao": self.percentual_comissao,
            "captador_id": self.captador_id,
            "captador_nome": self.captador_nome,
            "percentual_comissao_captador": self.percentual_comissao_captador,
            "metros_quadrados": self.metros_quadrados,
            "qtd_vaga_veiculo": self.qtd_vaga_veiculo,
            "qtd_quartos": self.qtd_quartos,
            "qtd_banheiros": self.qtd_banheiros,
            "imagem": self.imagem,
            "vendido": self.vendido,
            "venda": self.venda.to_dict() if self.venda else None,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
            "atualizado_em": self.atualizado_em.isoformat() if self.atualizado_em else None,
        }

    def __repr__(self) -> str:
        return f"<Imovel {self.id} - {self.cidade}/{self.estado}>"
