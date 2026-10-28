# Bartarin Imóveis — Portal Imobiliário e CRM

Projeto Integrador acadêmico para desenvolver um portal imobiliário com cadastro flexível de imóveis e um CRM básico de leads, tendo como contexto a Bartarin Imóveis, em Araras, SP.

> **Estado atual:** protótipo em desenvolvimento. O catálogo público e o painel local de gestão estão implementados. A persistência depende de uma conexão MongoDB configurada. Autenticação e permissões ainda não foram implementadas; use o painel somente localmente.

## Sumário

- [Objetivo](#objetivo)
- [Problema e justificativa do MongoDB](#problema-e-justificativa-do-mongodb)
- [Tecnologias](#tecnologias)
- [Funcionalidades](#funcionalidades)
- [Requisitos e instalação](#requisitos-e-instalação)
- [Configuração do MongoDB](#configuração-do-mongodb)
- [Estrutura](#estrutura)
- [Modelagem](#modelagem)
- [API](#api)
- [Dados de demonstração](#dados-de-demonstração)
- [Limitações e segurança](#limitações-e-segurança)
- [Próximas etapas](#próximas-etapas)

## Objetivo

Construir uma aplicação web para apresentar e buscar imóveis, cadastrar propriedades com informações adequadas a cada categoria e organizar pessoas interessadas e o histórico de atendimento. CRM significa *Customer Relationship Management*: uma ferramenta para acompanhar o relacionamento com clientes.

## Problema e justificativa do MongoDB

As categorias de imóveis têm atributos diferentes. Uma casa pode ter quintal e churrasqueira; um apartamento pode informar andar, condomínio e aceitação de pets; um galpão pode ter pé-direito, docas e zoneamento; um terreno pode registrar topografia e declive.

O projeto mantém os campos comuns no documento principal e guarda os atributos da categoria em `detalhes`. Assim, documentos diferentes podem ficar na mesma coleção `imoveis` sem precisar apresentar os mesmos campos. Essa flexibilidade é a justificativa acadêmica para MongoDB neste domínio. Não significa que bancos relacionais não consigam representar os dados nem que MongoDB seja sempre a melhor escolha. A aplicação ainda precisa validar cada documento.

## Tecnologias

- Frontend: HTML, CSS e JavaScript.
- Backend: Node.js e Express.
- Banco: MongoDB, usando o driver oficial `mongodb` para Node.js.
- Configuração local: `dotenv`.

A proposta inicial mencionava Laravel ou Spring Boot. Este protótipo foi iniciado em Node/Express porque PHP e Composer não estavam disponíveis no ambiente. É preciso confirmar com o professor se essa stack é aceita.

## Funcionalidades

### Portal público

- página inicial responsiva em verde sálvia, off-white e tons neutros;
- catálogo e filtros por tipo, cidade/bairro e faixa de preço;
- formulário público para cadastrar um lead quando o MongoDB estiver conectado;
- conteúdo fictício local para visualizar o catálogo sem banco.

### Painel de imóveis

Abra `/admin.html` para cadastrar, editar e arquivar imóveis. Os campos específicos mudam conforme a categoria:

- apartamento: andar, valor do condomínio, aceita pets, área de lazer;
- casa: quintal, andares, churrasqueira;
- galpão: pé-direito, docas, zoneamento;
- terreno: topografia e declive.

Arquivar é uma remoção lógica: o documento continua no banco com status `arquivado` e sai do catálogo público.

## Requisitos e instalação

Requer Node.js 20 ou posterior, npm e MongoDB local ou Atlas para persistência. Na pasta deste projeto:

```bash
npm install
cp .env.example .env
npm run dev
```

Se o modo watch falhar por limite de arquivos observados, use `npm start`. Acesse:

- Portal: <http://localhost:3000>
- Painel de imóveis: <http://localhost:3000/admin.html>
- Estado do banco: <http://localhost:3000/api/status>

## Configuração do MongoDB

`.env.example`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DATABASE=portal_imobiliario
```

Inicie o serviço MongoDB local antes do servidor ou coloque a URI do Atlas em `.env`. Nunca commite uma URI que contenha credenciais. Na inicialização, o servidor tenta conectar e cria índices iniciais. Se não conseguir, inicia em modo de demonstração; os dados fictícios aparecem no portal, mas gravações ficam indisponíveis.

## Estrutura

```text
portal-imobiliario/
├── public/
│   ├── admin.html       # gestão local de imóveis
│   ├── admin.js         # formulário dinâmico e operações do painel
│   ├── app.js           # catálogo, filtros e formulário público
│   ├── index.html       # portal público
│   └── styles.css       # estilos
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js            # Express e API MongoDB
├── README.md
└── PLANO_DO_PROJETO.md  # checklist de requisitos e progresso
```

## Modelagem

### Coleção `imoveis`

```json
{
  "titulo": "Apartamento com varanda",
  "tipo": "apartamento",
  "finalidade": "venda",
  "preco": 680000,
  "localizacao": { "cidade": "Araras", "bairro": "Centro", "uf": "SP" },
  "detalhes": {
    "andar": 7,
    "valor_condominio": 780,
    "aceita_pet": true,
    "area_lazer": ["piscina", "academia"]
  },
  "status": "ativo"
}
```

MongoDB cria um `_id` para identificar cada documento. Para casa, galpão e terreno, `detalhes` contém outras propriedades específicas.

### Coleção `leads`

```json
{
  "nome": "Marina Oliveira",
  "email": "marina@example.com",
  "etapa": "novo",
  "imoveis_favoritos": [],
  "historico": [
    { "data": "2026-10-28T12:00:00.000Z", "tipo": "cadastro", "observacao": "Lead cadastrado pelo portal." }
  ]
}
```

O histórico é embutido no lead porque neste protótipo costuma ser consultado junto com o cadastro. A coleção `users`, para administradores, corretores e clientes, está planejada, mas ainda não implementada.

## API

As rotas de gravação e leitura do CRM requerem conexão MongoDB.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/status` | Informa se o MongoDB está conectado. |
| `GET` | `/api/imoveis` | Lista imóveis ativos; aceita `tipo`, `cidade`, `preco_min`, `preco_max`. |
| `POST` | `/api/imoveis` | Cadastra imóvel e valida campos comuns e específicos. |
| `PATCH` | `/api/imoveis/:id` | Atualiza imóvel. |
| `DELETE` | `/api/imoveis/:id` | Arquiva imóvel. |
| `GET` | `/api/leads` | Lista leads; ainda sem proteção de acesso. |
| `POST` | `/api/leads` | Cadastra lead com histórico inicial. |
| `PATCH` | `/api/leads/:id` | Atualiza etapa e/ou acrescenta observação. |

Exemplo: `GET /api/imoveis?tipo=apartamento&cidade=Araras&preco_min=150000&preco_max=700000`.

## Dados de demonstração

Os imóveis locais são fictícios. Bairros de Araras são usados como referência de interface, mas preço, disponibilidade e características não são anúncios confirmados da Bartarin Imóveis. Confirme autorização antes de usar logo, telefones, CRECI ou anúncios reais.

## Limitações e segurança

- O painel de gestão não tem login nem permissões. Não publique o servidor na internet.
- Rotas de leads expõem dados pessoais e também não têm autenticação.
- O MongoDB ainda precisa ser configurado em cada ambiente.
- Não há upload de imagens; as fotos atuais são remotas e demonstrativas.
- Favoritos alteram apenas a interface e não são persistidos.
- Faltam página de detalhes, paginação e filtros para todos os campos específicos.
- Não há testes automatizados.
- A stack Node/Express precisa ser aprovada pelo professor, pois a proposta citava Laravel ou Spring Boot.

## Próximas etapas

Consulte o [PLANO_DO_PROJETO.md](./PLANO_DO_PROJETO.md) para o checklist completo. Prioridades:

1. confirmar stack e conectar MongoDB de desenvolvimento;
2. modelar usuários e referências entre usuários, leads e imóveis;
3. implementar login, papéis e proteção de rotas/dados pessoais;
4. construir o painel CRM;
5. completar catálogo, filtros, favoritos e imagens;
6. revisar segurança, testar fluxos e preparar a apresentação.
