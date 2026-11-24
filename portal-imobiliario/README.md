# Bartarin Imóveis — Protótipo de frontend

> Projeto acadêmico para um portal imobiliário e CRM de leads no contexto da Bartarin Imóveis, em Araras, SP. O frontend fica nesta pasta; a API Flask e o suporte a MongoDB estão em `../api`.

## O que dá para demonstrar

- portal imobiliário responsivo com 79 anúncios de venda, consultados em 23/11/2026;
- busca por tipo, bairro de Araras, quantidade mínima de dormitórios e faixa de preço;
- detalhes de imóvel com fotos locais da galeria correspondente, descrição do anúncio e mapa aproximado do bairro;
- favoritos salvos no `localStorage` do navegador;
- tela de gestão de imóveis com cadastro, edição e arquivamento simulados no `localStorage`;
- cadastro com até 8 fotos compactadas no navegador e criador de carrossel para Instagram (artes 4:5 em PNG);
- telas visuais de login, cadastro de cliente e recuperação de senha;
- painel CRM com leads fictícios, filtros, etapas e histórico demonstrativos;
- identidade visual em verde sálvia, off-white e tons neutros.

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript.
- **Armazenamento demonstrativo:** `localStorage` do navegador para favoritos, catálogo de demonstração e CRM.
- **API opcional:** Flask e MongoDB, documentados em [`../api/README.md`](../api/README.md).
- **Pré-visualização:** Node.js com módulos nativos para servir o frontend; imagens fotográficas ficam em `public/images`.

O frontend não tem dependências npm de aplicação. Para usar login, usuários e imóveis pela API, configure Python, MongoDB e o arquivo `.env` conforme a documentação da API.

## Abrir o projeto

### Opção 1: servidor estático incluído

Requer Node.js 20 ou posterior. No terminal, dentro da pasta `portal-imobiliario`:

```bash
npm start
```

Depois, abra <http://localhost:3000>.

### Opção 2: VS Code Live Server

Abra `public/index.html` com a extensão Live Server. As imagens demonstrativas já estão no projeto e funcionam com o Live Server. Para testar as outras telas, navegue pelas URLs abaixo:

- Portal: `/`
- Gestão demonstrativa: `/admin.html`
- Login: `/login.html`
- Cadastro: `/cadastro.html`
- Recuperação de senha: `/recuperar-senha.html`
- CRM: `/crm.html`

## Como os dados de demonstração funcionam

Os anúncios do catálogo e os leads de demonstração são definidos em `public/data.js`. As galerias dos imóveis foram baixadas para `public/images/imoveis/`, com um manifesto que relaciona cada foto ao anúncio de origem. O logo local está em `public/images/logo.png`. Fotos enviadas no painel continuam no armazenamento local do navegador; a ficha inclui descrição, galeria e link para o anúncio original.

Login, criação de conta e recuperação de senha são somente telas. Não digite senhas reais: esses formulários não autenticam ninguém e não devem armazenar credenciais. O formulário público de contato também não envia nem guarda os dados informados.

O catálogo contém 79 anúncios públicos consultados em 23/11/2026, com descrição, preço, ficha e fotos locais associadas. A pasta `public/images/imoveis/` tem 1.348 fotos sem duplicatas exatas (cerca de 65 MB); o catálogo carrega as imagens sob demanda. Preços e disponibilidade podem mudar; confirme os dados no anúncio original. Os contatos do CRM continuam fictícios.

## Estrutura

```text
portal-imobiliario/
├── public/
│   ├── admin.html / admin.js       # gestão local demonstrativa de imóveis
│   ├── auth.js                     # interações das telas de acesso
│   ├── cadastro.html               # cadastro visual
│   ├── crm.html / crm.js            # painel CRM de demonstração
│   ├── data.js                     # anúncios da imobiliária e dados de demonstração
│   ├── index.html / app.js          # portal, filtros, detalhes e favoritos
│   ├── login.html                  # login conectado à API
│   ├── recuperar-senha.html         # tela de recuperação visual
│   ├── styles.css                   # estilos compartilhados
│   └── images/                      # fotos locais dos imoveis e logo
├── package.json                    # comando opcional para pré-visualizar
├── server.js                       # servidor estático local
└── PLANO_DO_PROJETO.md             # escopo e checklist do protótipo
```

## Limites do protótipo

- os dados no `localStorage` existem apenas naquele navegador e podem ser apagados;
- não há usuários, autenticação, autorização ou envio de e-mail;
- não há persistência compartilhada nem sincronização entre dispositivos;
- o CRM usa contatos fictícios e não recebe os formulários do portal;
- as galerias dos imoveis e o logo sao arquivos locais do projeto;
- as fotos e alterações criadas no painel ficam no `localStorage` daquele navegador e estão sujeitas ao limite de armazenamento do navegador;
- a API requer configuração própria de Python, MongoDB e variáveis de ambiente antes do uso.

O backend opcional está em `../api`; siga [`../api/README.md`](../api/README.md) para configurar MongoDB e iniciar a API.

## Próximos passos de frontend

O checklist está em [PLANO_DO_PROJETO.md](./PLANO_DO_PROJETO.md). Para executar o backend, consulte [`../api/README.md`](../api/README.md).
