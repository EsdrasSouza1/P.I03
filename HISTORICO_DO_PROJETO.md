# Histórico do projeto Sistfy

Este arquivo reúne o que foi definido e implementado no Sistfy até agora. Ele descreve o estado atual do repositório e distingue funcionalidades prontas de ideias e tentativas que foram desfeitas.

## Objetivo do projeto

O Sistfy é um sistema financeiro para organizar receitas, despesas, contas, orçamentos e metas. O trabalho faz parte de um projeto interdisciplinar.

As funcionalidades planejadas para o sistema incluem:

- **Dashboard financeiro:** saldo total das contas, receitas e despesas do mês, evolução patrimonial, comparação com o mês anterior, contas a pagar e receber e economia mensal.
- **Gestão de transações:** cadastro de receitas e despesas, categorias e subcategorias personalizadas, transferências, parcelamento, recorrências e filtros.
- **Planejamento financeiro:** orçamento mensal por categoria, metas de economia, alertas de limite, previsão de saldo, dívidas e parcelas pendentes.
- **Relatórios e análises:** despesas por categoria, evolução de receitas e despesas, fluxo de caixa, comparação de períodos, exportação CSV/PDF e indicadores calculados.
- **Usuários e segurança:** cadastro, login, recuperação de senha, isolamento de dados por usuário, permissões, histórico de alterações, validação no servidor e hash seguro de senhas.

## Tecnologias e decisões

- A linguagem inicialmente mencionada foi Delphi; depois o projeto foi definido em **Go**.
- **MongoDB** continua sendo o banco previsto para o sistema.
- A tela web usa HTML, JavaScript e Tailwind CSS. O Bootstrap foi removido.
- O servidor HTTP do protótipo é escrito em Go.

## Estrutura que já existia no repositório

Antes da implementação da interface, o projeto já continha uma estrutura Go criada pelo Leo:

- `main/main.go` e `main/application.go` para a aplicação.
- `internal/router/router.go` para as rotas com Chi.
- `config/env.go` para leitura de variáveis de ambiente.
- `database/database.go` com uma função inicial de conexão MongoDB local.
- `authentication/token/token.go` com funções para criar e validar JWT.
- `go.mod` e `go.sum` com as dependências Go.

Essa estrutura inicial foi preservada. A função de conexão em `database/database.go` aponta para `mongodb://localhost:27017`, mas **o fluxo atual de login e cadastro não chama essa função**.

## Interface e arquivos criados

Foi montada uma primeira identidade visual com azul-marinho, verde, fundo claro e cartões brancos. A interface usa tipografia DM Sans e Manrope.

- `web/index.html`: tela de login, campos de e-mail e senha e link para cadastro.
- `web/register.html`: cadastro com nome, e-mail, senha e confirmação.
- `web/dashboard.html`: painel inicial com saldos, receitas, despesas, economia, movimentações e meta de exemplo.
- `web/input.css`: estilos visuais e ponto de entrada do Tailwind.
- `web/styles.css`: CSS gerado pelo Tailwind CLI.
- `web/login.js`: validação visual do login, envio ao servidor Go e mensagens de erro.
- `web/register.js`: validação do cadastro, confirmação das senhas e envio ao servidor Go.
- `web/dashboard.js`: ação de sair.
- `package.json` e `package-lock.json`: dependências e comandos do Tailwind CLI.
- `.gitignore`: ignora `node_modules/`.

O Bootstrap foi removido. O Tailwind está instalado e compila o CSS, mas a aparência ainda é definida principalmente por regras CSS tradicionais em `web/input.css`; a tela não foi convertida integralmente para classes utilitárias do Tailwind.

## Fluxo local atual

O `main/main.go` atual serve os arquivos da pasta `web` e implementa rotas para login, cadastro, dashboard e saída.

- A validação do formulário acontece no navegador e também no servidor Go.
- A senha de contas cadastradas é transformada em hash Argon2.
- As contas criadas ficam somente na memória do processo Go e desaparecem quando o servidor é encerrado.
- Para demonstração, ainda existe a conta `demo@sistfy.com` com senha `sistfy123`.
- O dashboard usa valores fictícios; ele não carrega dados financeiros do usuário.
- O cookie atual é uma sessão simples de demonstração, não um sistema de autenticação pronto para produção.

## O que foi tentado com Atlas e desfeito

Foi iniciada uma integração que faria cadastro e login consultarem a coleção `users` no MongoDB Atlas, com URI em variável de ambiente e índice único por e-mail. Depois, a pedido do usuário, essa integração foi removida.

Portanto, o estado atual **não usa Atlas**. A conexão MongoDB inicial do Leo permanece no arquivo de banco, sem ser chamada pelo fluxo web. Os arquivos e instruções criados especificamente para Atlas foram retirados. Não há credenciais do banco registradas neste documento.

Durante a configuração do Atlas, uma captura de tela mostrou a senha de um usuário de banco. Foi recomendado remover esse usuário ou trocar a senha no painel do Atlas. A alteração do código não revoga credenciais no Atlas.

## Como rodar o protótipo

Na raiz do projeto, rode o servidor Go:

```sh
go run ./main
```

Em outro terminal, instale as dependências da interface e mantenha a compilação do Tailwind ativa:

```sh
npm install
npm run css:watch
```

Abra `http://localhost:8080`. O servidor Go precisa continuar rodando; as contas criadas para teste somem quando ele é encerrado.

## Verificações feitas

- `npm run css:build` compilou o CSS do Tailwind sem avisos.
- `git diff --check` passou nas alterações documentadas.
- Não foi possível compilar ou executar o Go neste ambiente de trabalho, porque o comando `go` não estava disponível nele. O fluxo deve ser confirmado novamente no computador de desenvolvimento.

## Próximas etapas possíveis

1. Confirmar o funcionamento atual de login, cadastro e saída no navegador.
2. Decidir com a equipe quando conectar o fluxo de usuários ao MongoDB.
3. Se a autenticação real entrar no escopo, trocar a sessão de demonstração por uma sessão adequada e ligar o dashboard aos dados do usuário.
4. Continuar o dashboard com dados e funcionalidades reais, em vez dos valores fictícios.
5. Revisar as alterações e abrir o Pull Request previsto no checklist inicial.
