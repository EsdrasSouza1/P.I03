# Bartarin Imóveis — Protótipo de frontend

> Protótipo acadêmico de interface para um portal imobiliário e CRM de leads no contexto da Bartarin Imóveis, em Araras, SP. **O escopo atual é somente frontend**: não há API de negócio, autenticação real ou banco de dados.

## O que dá para demonstrar

- portal imobiliário responsivo, com imóveis fictícios;
- busca por tipo, bairro/cidade, finalidade, faixa de preço e algumas características;
- detalhes de imóvel e favoritos salvos no `localStorage` do navegador;
- tela de gestão de imóveis com cadastro, edição e arquivamento simulados no `localStorage`;
- telas visuais de login, cadastro de cliente e recuperação de senha;
- painel CRM com leads fictícios, filtros, etapas e histórico demonstrativos;
- identidade visual em verde sálvia, off-white e tons neutros.

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript.
- **Armazenamento demonstrativo:** `localStorage` do navegador, sem servidor de dados.
- **Pré-visualização local opcional:** Node.js com módulos nativos somente para servir arquivos estáticos. Não implementa backend nem API.

Não há dependências npm de aplicação e não é necessário MongoDB.

## Abrir o projeto

### Opção 1: servidor estático incluído

Requer Node.js 20 ou posterior. No terminal, dentro da pasta `portal-imobiliario`:

```bash
npm start
```

Depois, abra <http://localhost:3000>.

### Opção 2: VS Code Live Server

Abra `public/index.html` com a extensão Live Server. Para testar as outras telas, navegue pelas URLs abaixo:

- Portal: `/`
- Gestão demonstrativa: `/admin.html`
- Login: `/login.html`
- Cadastro: `/cadastro.html`
- Recuperação de senha: `/recuperar-senha.html`
- CRM: `/crm.html`

## Como os dados de demonstração funcionam

Os imóveis e leads de exemplo são definidos em `public/data.js`. A tela de gestão e o CRM permitem interações demonstrativas; alterações ficam no armazenamento local daquele navegador e não são enviadas para nenhum servidor. O portal lê os imóveis demonstrativos e os que foram criados localmente na tela de gestão. Favoritos também ficam no navegador.

Login, criação de conta e recuperação de senha são somente telas. Não digite senhas reais: esses formulários não autenticam ninguém e não devem armazenar credenciais. O formulário público de contato também não envia nem guarda os dados informados.

Os nomes, contatos, endereços, valores e disponibilidade dos imóveis de exemplo são fictícios. Não representam anúncios confirmados da imobiliária.

## Estrutura

```text
portal-imobiliario/
├── public/
│   ├── admin.html / admin.js       # gestão local demonstrativa de imóveis
│   ├── auth.js                     # interações das telas de acesso
│   ├── cadastro.html               # cadastro visual
│   ├── crm.html / crm.js            # painel CRM de demonstração
│   ├── data.js                     # imóveis e leads fictícios
│   ├── index.html / app.js          # portal, filtros, detalhes e favoritos
│   ├── login.html                  # tela de login visual
│   ├── recuperar-senha.html         # tela de recuperação visual
│   └── styles.css                  # estilos compartilhados
├── package.json                    # comando opcional para pré-visualizar
├── server.js                       # servidor estático local, sem API
└── PLANO_DO_PROJETO.md             # escopo e checklist do protótipo
```

## Limites do protótipo

- os dados no `localStorage` existem apenas naquele navegador e podem ser apagados;
- não há usuários, autenticação, autorização ou envio de e-mail;
- não há persistência compartilhada nem sincronização entre dispositivos;
- o CRM usa contatos fictícios e não recebe os formulários do portal;
- imagens remotas são apenas ilustrativas;
- este protótipo não cumpre requisitos que exijam backend ou MongoDB.

Como a proposta acadêmica original mencionava MongoDB obrigatório, confirme com o professor que a entrega pode ser avaliada somente como frontend. O protótipo atual serve para demonstrar fluxos e telas.

## Próximos passos de frontend

O checklist está em [PLANO_DO_PROJETO.md](./PLANO_DO_PROJETO.md). As melhorias visuais podem incluir revisão responsiva, acessibilidade, mais estados de interface e páginas de perfil/cliente. Backend, autenticação e banco ficam fora do escopo atual.
