# API — Bartarin Imóveis

API Flask responsável por autenticação, usuários, vendedores, imóveis persistidos, vendas, comissões e relatórios. Os dados são armazenados no MongoDB com MongoEngine.

## Requisitos

- Python 3.11 ou superior;
- MongoDB Community Server ou MongoDB Atlas.

## Preparar o ambiente

No PowerShell, dentro da pasta `api`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Configure o `.env`:

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=portal_imobiliario
SECRET_KEY=gere-uma-chave-longa-aleatoria-e-exclusiva
TOKEN_EXPIRATION_SECONDS=86400
REMEMBER_TOKEN_EXPIRATION_SECONDS=2592000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
COOKIE_SECURE=false
MAX_CONTENT_LENGTH=8388608
```

Para produção, use MongoDB autenticado e restrito por rede, HTTPS, `COOKIE_SECURE=true`, uma chave secreta forte e somente o domínio definitivo em `CORS_ORIGINS`.

## MongoDB Atlas

1. Crie um cluster.
2. Em **Database Access**, crie um usuário exclusivo para a aplicação.
3. Em **Network Access**, autorize somente os IPs necessários.
4. Copie a URI em **Connect > Drivers**.
5. Defina a URI em `MONGO_URI`.

Caracteres reservados da senha, como `@`, `:`, `/` e `#`, devem ser codificados na URI.

## Executar

```powershell
python run.py
```

A API ficará em `http://127.0.0.1:5000`. Verifique:

```text
GET http://127.0.0.1:5000/api/health
```

Resposta esperada:

```json
{"status":"ok","mongodb":"conectado"}
```

## Autenticação

O login usa `POST /login`. A sessão é mantida por cookie Flask e a autenticação é verificada no servidor. Há limitação de oito tentativas malsucedidas em quinze minutos por combinação de IP e identificador.

Endpoints públicos principais:

- `POST /login`;
- `POST /logout`;
- `GET /me`;
- `GET /api/health`;
- `GET /imoveis`;
- `GET /imoveis/<id>`.

Usuários, vendedores, relatórios, pagamentos e alterações de imóveis exigem autenticação.

## Primeiro usuário

Em uma instalação vazia, o primeiro administrador deve ser criado por um procedimento controlado no servidor ou diretamente por um administrador do banco. `POST /usuarios` é protegido e não deve ser aberto publicamente apenas para criar o primeiro acesso.

Depois disso, novos usuários são cadastrados em `/usuarios.html`.

## Coleções

- `usuarios`: contas administrativas com senha em hash;
- `vendedores`: equipe e percentual de comissão;
- `imoveis`: imóveis, captador e venda incorporada ao documento.

A venda mantém um retrato dos nomes, percentuais e valores no fechamento, evitando que mudanças futuras alterem o histórico financeiro.

## Relatórios

- `GET /relatorios/vendas`;
- `GET /relatorios/comissoes`;
- `POST /relatorios/comissoes/pagar`.

Os relatórios aceitam período e vendedor. O pagamento registra situação, data e lote separadamente para venda e captação.

## Segurança aplicada

- autenticação obrigatória nos endpoints administrativos;
- renovação da sessão no login;
- limitação de tentativas;
- cookies `HttpOnly`, `SameSite=Lax` e `Secure` configurável;
- CORS por lista de origens;
- limite de requisição;
- CSP, `nosniff`, proteção contra enquadramento, política de referência e de permissões;
- respostas de autenticação sem cache.

## Limitações

- o servidor Flask de desenvolvimento não deve ser usado em produção;
- o limitador em memória deve ser substituído por Redis em múltiplas instâncias;
- parte do catálogo demonstrativo ainda usa `localStorage`;
- recomenda-se implementar revogação persistente de sessões, auditoria financeira e proteção CSRF dedicada antes do uso comercial.
