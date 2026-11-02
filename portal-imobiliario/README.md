# Bartarin Imóveis — Protótipo de frontend

> Protótipo acadêmico de interface para um portal imobiliário e CRM de leads no contexto da Bartarin Imóveis, em Araras, SP. **O escopo atual é somente frontend**: não há API de negócio, autenticação real ou banco de dados.

## O que dá para demonstrar

- portal imobiliário responsivo com os 77 anúncios de venda listados no site quando o catálogo foi consultado;
- busca por tipo, bairro de Araras, quantidade mínima de dormitórios e faixa de preço;
- detalhes de imóvel com galeria navegável, descrição original e mapa aproximado do bairro;
- favoritos salvos no `localStorage` do navegador;
- tela de gestão de imóveis com cadastro, edição e arquivamento simulados no `localStorage`;
- cadastro com até 8 fotos compactadas no navegador e criador de carrossel para Instagram (artes 4:5 em PNG);
- telas visuais de login, cadastro de cliente e recuperação de senha;
- painel CRM com leads fictícios, filtros, etapas e histórico demonstrativos;
- identidade visual em verde sálvia, off-white e tons neutros.

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript.
- **Armazenamento demonstrativo:** `localStorage` do navegador, sem servidor de dados.
- **Pré-visualização local opcional:** Node.js com módulos nativos para servir os arquivos e encaminhar imagens dos anúncios públicos ao criador de artes. Não implementa API de negócio nem persistência no servidor.

Não há dependências npm de aplicação e não é necessário MongoDB.

## Abrir o projeto

### Opção 1: servidor estático incluído

Requer Node.js 20 ou posterior. No terminal, dentro da pasta `portal-imobiliario`:

```bash
npm start
```

Depois, abra <http://localhost:3000>.

### Opção 2: VS Code Live Server

Abra `public/index.html` com a extensão Live Server. As fotos enviadas no cadastro funcionam no carrossel; as imagens dos anúncios existentes precisam do servidor `npm start`. Para testar as outras telas, navegue pelas URLs abaixo:

- Portal: `/`
- Gestão demonstrativa: `/admin.html`
- Login: `/login.html`
- Cadastro: `/cadastro.html`
- Recuperação de senha: `/recuperar-senha.html`
- CRM: `/crm.html`

## Como os dados de demonstração funcionam

Os anúncios do catálogo e os leads de demonstração são definidos em `public/data.js`. A tela de gestão e o CRM permitem interações demonstrativas; alterações ficam no armazenamento local daquele navegador e não são enviadas para nenhum servidor. As fotos do painel são redimensionadas sem ampliação para até 2048 px e convertidas para WebP em qualidade alta; miniaturas menores atendem aos cartões do catálogo. Na galeria, passar o mouse sobre a foto ativa uma lupa; clicar ou tocar abre a foto em um visualizador maior com navegação. O criador prepara capa, slides fotográficos e encerramento em 1080 × 1350 px; cada slide é baixado individualmente em PNG. Para preparar as artes dos anúncios existentes, o servidor local encaminha somente fotos do domínio público da imobiliária. O detalhe de cada imóvel mostra a descrição publicada e um link para a ficha original. Favoritos também ficam no navegador.

Login, criação de conta e recuperação de senha são somente telas. Não digite senhas reais: esses formulários não autenticam ninguém e não devem armazenar credenciais. O formulário público de contato também não envia nem guarda os dados informados.

O catálogo contém os 77 anúncios públicos de venda encontrados em 01/11/2026: 43 casas, 26 apartamentos, 4 casas em condomínio, 2 chácaras, 1 sala comercial e 1 terreno, distribuídos em 45 bairros. Cada imóvel tem referência, galeria com as fotos publicadas, dados resumidos e a descrição da ficha; o cartão também leva ao anúncio original. As imagens são servidas pelo site da imobiliária com marca d'água. O mapa aponta para uma localização aproximada no bairro, sem mostrar endereço exato. Preços, fotos e disponibilidade podem mudar; confirme os dados na ficha original. Os contatos do CRM continuam sendo fictícios.

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
│   ├── login.html                  # tela de login visual
│   ├── recuperar-senha.html         # tela de recuperação visual
│   └── styles.css                  # estilos compartilhados
├── package.json                    # comando opcional para pré-visualizar
├── server.js                       # pré-visualização e encaminhamento limitado de imagens
└── PLANO_DO_PROJETO.md             # escopo e checklist do protótipo
```

## Limites do protótipo

- os dados no `localStorage` existem apenas naquele navegador e podem ser apagados;
- não há usuários, autenticação, autorização ou envio de e-mail;
- não há persistência compartilhada nem sincronização entre dispositivos;
- o CRM usa contatos fictícios e não recebe os formulários do portal;
- as fotos dos anúncios são carregadas do site público da imobiliária e podem mudar junto com os anúncios;
- as fotos e alterações criadas no painel ficam no `localStorage` daquele navegador e estão sujeitas ao limite de armazenamento do navegador;
- este protótipo não cumpre requisitos que exijam backend ou MongoDB.

Como a proposta acadêmica original mencionava MongoDB obrigatório, confirme com o professor que a entrega pode ser avaliada somente como frontend. O protótipo atual serve para demonstrar fluxos e telas.

## Próximos passos de frontend

O checklist está em [PLANO_DO_PROJETO.md](./PLANO_DO_PROJETO.md). As melhorias visuais podem incluir revisão responsiva, acessibilidade, mais estados de interface e páginas de perfil/cliente. Backend, autenticação e banco ficam fora do escopo atual.
