# Projeto: plataforma de leitura

## Direção atual

O projeto será um sistema voltado a livros e leitores. As referências visuais são os prints compartilhados anteriormente; eles continuam valendo como inspiração de layout e navegação. As definições antigas relacionadas ao sistema financeiro deixam de fazer parte do escopo.

A ideia é combinar uma biblioteca pessoal para acompanhar leituras com uma comunidade para conversar sobre livros. A plataforma também poderá recomendar leituras e direcionar usuários para comprar livros em lojas parceiras.

## Funcionalidades previstas

- **Minha Biblioteca:** espaço pessoal para organizar e acompanhar a jornada de leitura.
- **Livros:** catálogo de livros para consultar e explorar.
- **Ágora do Livro:** área social com grupos, debates e tópicos relacionados a temas e livros.
- **Recomendações:** sugestões personalizadas, com possibilidade de usar inteligência artificial.
- **Loja:** acesso a ofertas de livros e links de compra, inicialmente com Amazon e Mercado Livre como possíveis parceiros.

## Biblioteca pessoal

O leitor poderá separar os livros por estado de leitura, por exemplo:

- Livros já lidos.
- Livros que quer ler.
- Livros que está lendo ou quer terminar.

A biblioteca deve funcionar como um acompanhamento da jornada e das metas de leitura, permitindo visualizar quantos livros há em cada grupo e o progresso pessoal.

## Comunidade

A Ágora do Livro será uma rede social temática para leitores. A proposta inclui grupos e discussões sobre assuntos, gêneros e livros em comum, com tópicos de debate ligados às leituras.

## Recomendações e monetização

A plataforma poderá usar inteligência artificial para sugerir livros com base nos interesses e no histórico de leitura do usuário. Também poderá apresentar links de compra da Amazon e do Mercado Livre como caminho de monetização. A forma de integração e as regras comerciais ainda serão definidas.

## O que falta detalhar

O nome definido é **Mybook**, com identidade visual em azul claro e branco. O foco imediato será o front-end; o backend continua em Go e as escolhas de linguagem e ferramentas do projeto permanecem. O primeiro fluxo visual tem uma página inicial pública, com apresentação e formulário de entrada, seguida por um feed responsivo de leitores após o login. O feed apresenta atalhos para Minha Biblioteca, Livros, Ágora do Livro, Recomendações e Loja.

O usuário poderá enviar mais detalhes para orientar as próximas telas e o comportamento de cada funcionalidade.

## Estado atual do código

O front em `web/` tem páginas separadas para a apresentação (`/`), login (`/entrar`), cadastro (`/cadastro`) e espaço após entrar (`/dashboard`). O menu permite navegar entre Feed, Minha Biblioteca, Livros, Ágora do Livro, Recomendações, Loja e Meu Perfil. Todas essas áreas começam vazias para serem construídas por etapas; não há perfis, publicações, livros na estante ou recomendações fictícias. O botão `+` abre o cadastro inicial de livro e mostra o título adicionado na Minha Biblioteca durante a sessão atual do navegador. As contas registradas ficam somente na memória do servidor e desaparecem quando ele é encerrado. Não foi feita integração com MongoDB.
