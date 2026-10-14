# Sistfy

Projeto interdisciplinar de gestão financeira, com backend em Go e interface web responsiva.

O histórico das decisões, funcionalidades e estado atual está em [HISTORICO_DO_PROJETO.md](HISTORICO_DO_PROJETO.md).

## Rodar localmente

Na raiz do projeto, inicie o servidor Go:

```sh
go run ./main
```

Em outro terminal, instale as dependências da interface e mantenha o Tailwind compilando os estilos:

```sh
npm install
npm run css:watch
```

Acesse `http://localhost:8080`.

## Cadastro e login local

O cadastro de demonstração fica somente na memória do servidor e desaparece quando ele é encerrado. Para testar, use **Criar cadastro** e depois entre com essa conta. Também existe a conta de demonstração `demo@sistfy.com` com a senha `sistfy123`.

O esqueleto de conexão MongoDB do projeto permanece em `database/database.go`, mas o fluxo atual de login e cadastro não usa o banco.
