# Bartarin Imóveis — Portal imobiliário e CRM

Aplicação acadêmica inicial para a Bartarin Imóveis, com catálogo público, filtros, cadastro flexível de imóveis e um primeiro fluxo de leads em MongoDB. A interface usa uma paleta de verde sálvia, off-white e areia, com foco em uma apresentação acolhedora e responsiva. A identidade e a referência a Araras foram adaptadas a partir das informações públicas encontradas; os imóveis que aparecem sem banco conectado são dados fictícios de demonstração e não anúncios oficiais.

## Requisitos

- Node.js 20 ou posterior
- MongoDB local ou MongoDB Atlas

## Executar

```bash
npm install
cp .env.example .env
npm run dev
```

Abra `http://localhost:3000`. A aplicação conecta ao banco definido em `MONGODB_URI`; sem MongoDB ela não inicia, embora o HTML possa ser pré-visualizado com servidor estático. A configuração `.env` não deve ser commitada.

## API inicial

- `GET /api/imoveis?tipo=apartamento&cidade=São Paulo&preco_min=300000&preco_max=900000`
- `POST /api/imoveis` — grava campos comuns e um objeto `detalhes` validado de acordo com o tipo.
- `GET /api/leads`
- `POST /api/leads` — cadastra lead e cria entrada inicial em `historico`.
- `PATCH /api/leads/:id` — muda etapa e/ou acrescenta observação ao histórico.

## Modelo do imóvel

```json
{
  "titulo": "Apartamento com varanda",
  "tipo": "apartamento",
  "finalidade": "venda",
  "preco": 680000,
  "localizacao": { "cidade": "São Paulo", "bairro": "Pinheiros", "uf": "SP" },
  "detalhes": { "andar": 7, "valor_condominio": 780, "aceita_pet": true },
  "status": "ativo"
}
```

Os campos específicos permitidos variam entre `casa`, `apartamento`, `galpao` e `terreno`. Os índices de busca são criados na inicialização do servidor.

## Próximas etapas

1. Adicionar autenticação real e autorização por perfil (administrador, corretor e cliente).
2. Associar leads e imóveis a usuários, com favoritos persistidos por cliente.
3. Completar o CRUD administrativo e o formulário de anúncio com campos por categoria.
4. Adicionar upload de fotos, paginação, validação mais estrita e testes.
5. Se a entrega exigir Laravel, migrar a API para Laravel usando a integração oficial `mongodb/laravel-mongodb`; PHP e Composer não estavam disponíveis no ambiente durante a criação deste starter.

Esta versão ainda não implementa autenticação nem painel CRM protegido. Leads e anúncios de demonstração não devem ser tratados como um sistema pronto para produção.
