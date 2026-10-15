# Mybook

Projeto interdisciplinar para leitores, com backend em Go e interface web responsiva. O Mybook reúne biblioteca pessoal, acompanhamento de leitura, comunidade, recomendações e uma futura loja de livros.

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

Acesse `http://localhost:8080` para ver a página inicial. O login fica em `http://localhost:8080/entrar`, o cadastro em `/cadastro` e, depois de entrar, a área de leitura abre em `/dashboard`.

## Cadastro e login local

As contas cadastradas ficam somente na memória do servidor e desaparecem quando ele é encerrado. Para testar, crie sua própria conta e entre com ela. O feed, a biblioteca e as outras áreas começam vazios, sem perfis ou publicações fictícias. O botão **+** permite adicionar um livro à biblioteca durante a sessão atual do navegador; ainda não há persistência no banco.

O esqueleto de conexão MongoDB do projeto permanece em `database/database.go`, mas o fluxo atual de login e cadastro não usa o banco.
