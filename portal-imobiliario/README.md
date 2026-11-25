# Bartarin Imóveis

Portal imobiliário com área administrativa para gestão de imóveis, vendedores, usuários, vendas, comissões e relatórios. O frontend está nesta pasta e a API Flask com MongoDB fica em [`../api`](../api).

## Funcionalidades

### Portal público

- catálogo responsivo, filtros e apresentação completa dos imóveis;
- galeria de fotos e favoritos no navegador;
- política de privacidade e política de cookies;
- aceite, recusa e personalização de cookies opcionais.

### Área administrativa

- autenticação conectada à API e Dashboard como página inicial;
- cadastro, edição, pré-visualização, filtros e paginação de imóveis;
- cadastro de vendedores, usuários e percentuais de comissão;
- vínculo do vendedor captador ao imóvel;
- registro de venda com comprador, valor, data e vendedor;
- cálculo das comissões da imobiliária, vendedor e captador;
- bloqueio da edição de imóveis vendidos;
- relatórios de vendas e comissões por período e vendedor;
- pagamento individual ou agrupado de comissões;
- comprovante de pagamento para impressão.

## Tecnologias

- HTML, CSS e JavaScript sem framework;
- Node.js como servidor estático de desenvolvimento;
- Python e Flask;
- MongoEngine e MongoDB;
- sessões Flask e hash de senhas do Werkzeug.

## Estrutura

```text
P.I03/
├── api/                              # API Flask e MongoDB
└── portal-imobiliario/
    ├── public/
    │   ├── index.html                # portal público
    │   ├── login.html                # autenticação
    │   ├── dashboard.html            # início administrativo
    │   ├── admin.html                # imóveis
    │   ├── vendedores.html           # vendedores
    │   ├── usuarios.html             # usuários
    │   ├── relatorio-vendas.html
    │   ├── relatorio-comissoes.html
    │   ├── politica-privacidade.html
    │   ├── politica-cookies.html
    │   └── images/
    ├── server.js
    └── package.json
```

## Requisitos

- Node.js 20 ou superior;
- Python 3.11 ou superior;
- MongoDB local ou MongoDB Atlas.

## Executar

### API

Consulte [`../api/README.md`](../api/README.md). Resumo para PowerShell:

```powershell
cd ..\api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python run.py
```

A API ficará em `http://127.0.0.1:5000`.

### Frontend

Em outro terminal:

```powershell
cd portal-imobiliario
npm start
```

Abra `http://localhost:3000`. O acesso administrativo começa em `/login.html` e direciona para `/dashboard.html` após o login.

## Segurança

- endpoints administrativos protegidos na API;
- limitação de tentativas de login;
- senhas armazenadas somente como hash;
- cookies de sessão com `HttpOnly` e `SameSite=Lax`;
- CORS limitado às origens configuradas;
- CSP, proteção contra enquadramento e MIME sniffing;
- limite do tamanho das requisições;
- cookies opcionais desativados antes da autorização.

Em produção, use HTTPS, configure `COOKIE_SECURE=true`, substitua a chave secreta de exemplo e nunca envie o `.env` ao Git.

## Persistência atual

Usuários, vendedores e registros disponibilizados pela API ficam no MongoDB. O catálogo demonstrativo e as fotos adicionadas pelo painel ainda utilizam `localStorage`. Os relatórios consolidam as vendas locais com as disponíveis na API.

Antes do uso real, imóveis, fotos, vendas e pagamentos devem ser integralmente migrados para o backend. O navegador não deve ser a fonte oficial de informações financeiras.

## Privacidade

Antes da publicação, complete as políticas com:

- identificação do controlador;
- canal de atendimento aos titulares;
- fornecedores externos;
- prazos reais de retenção;
- bases legais de cada tratamento.

## Documentação adicional

- [README da API](../api/README.md)
- [Documentação da API e banco](DOCUMENTACAO_API_BANCO.md)
- [Plano do projeto](PLANO_DO_PROJETO.md)
