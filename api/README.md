# API do portal imobiliário

## 1. Escolher o MongoDB

### Opção A — MongoDB local

Instale o MongoDB Community Server e mantenha no `.env`:

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=portal_imobiliario
```

### Opção B — MongoDB Atlas

1. Crie um cluster no MongoDB Atlas.
2. Em **Database Access**, crie um usuário do banco.
3. Em **Network Access**, adicione o IP da máquina que executará a API.
4. Em **Connect > Drivers**, copie a URI para Python.
5. Coloque essa URI no `.env` e mantenha `MONGO_DB=portal_imobiliario`.

Se a senha tiver `@`, `:`, `/`, `#` ou outro caractere reservado, ela deve ser codificada para uso em URL.

## 2. Preparar o ambiente

No PowerShell, a partir da pasta `api`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edite o `.env` e gere uma `SECRET_KEY` longa. O arquivo `.env` não deve ser enviado ao Git.

## 3. Executar

```powershell
python run.py
```

A API ficará disponível em `http://127.0.0.1:5000`.

Verifique a conexão abrindo `http://127.0.0.1:5000/api/health`. O resultado esperado é:

```json
{"status":"ok","mongodb":"conectado"}
```

## 4. Criar o primeiro usuário

Envie `POST http://127.0.0.1:5000/usuarios` com JSON:

```json
{
  "nome": "Administrador",
  "email": "admin@exemplo.com",
  "usuario": "admin",
  "senha": "uma-senha-segura"
}
```

Depois use o e-mail e a senha na tela de login. As senhas são salvas no MongoDB somente como hash.
