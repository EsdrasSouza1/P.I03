# Escopo e checklist — Bartarin Imóveis

## Objetivo do protótipo

Demonstrar apenas a interface de um portal imobiliário e CRM de leads para o contexto acadêmico da Bartarin Imóveis, em Araras. Não há backend, autenticação nem banco de dados no escopo atual. As informações são fictícias e as alterações ficam localmente no navegador.

> A proposta inicial da disciplina mencionava MongoDB obrigatório. Confirmar com o professor que a entrega pode ser somente frontend.

## Tecnologias definidas

- [x] HTML, CSS e JavaScript no navegador.
- [x] `localStorage` para simular favoritos, alterações de imóveis e alterações de leads.
- [x] Node.js nativo opcional apenas para servir arquivos durante a pré-visualização.
- [x] Sem dependências npm de aplicação, API ou conexão MongoDB.

## 1. Portal e busca de imóveis

- [x] Página inicial responsiva e identidade visual leve.
- [x] Catálogo com imóveis fictícios em quatro categorias.
- [x] Filtros por tipo, cidade/bairro, finalidade, preço e atributos selecionados.
- [x] Detalhes do imóvel.
- [x] Favoritos locais no navegador.
- [x] Formulário de interesse demonstrativo sem envio de dados.
- [ ] Revisar experiência em tamanhos variados de tela.
- [ ] Revisar acessibilidade e navegação por teclado.

## 2. Gestão demonstrativa de imóveis

- [x] Formulário que adapta campos pela categoria.
- [x] Criar, editar e arquivar imóveis no `localStorage`.
- [x] Compartilhar os exemplos e alterações locais entre o painel e o catálogo no mesmo navegador.
- [ ] Incluir imagens locais demonstrativas e uma galeria visual.
- [ ] Adicionar ordenação e paginação visuais.

## 3. Conta e acesso (somente telas)

- [x] Tela visual de login.
- [x] Tela visual de cadastro de cliente.
- [x] Tela visual de recuperação de senha.
- [x] Mensagens informam que não há autenticação e que os dados não são enviados.
- [ ] Revisar aparência dos estados de validação e erro.

## 4. CRM demonstrativo

- [x] Painel com métricas fictícias.
- [x] Lista de leads fictícios com busca e filtros por etapa.
- [x] Alterar etapa e acrescentar anotações localmente.
- [x] Persistir alterações demonstrativas no `localStorage`.
- [ ] Refinar conteúdo e layout para apresentação acadêmica.

## 5. Apresentação e entrega

- [x] Documentar escopo frontend no README.
- [x] Identificar dados de imóveis e contatos como fictícios.
- [ ] Confirmar com o professor que o escopo sem MongoDB atende à avaliação.
- [ ] Preparar roteiro curto para demonstrar busca, favoritos, gestão e CRM.
- [ ] Fazer revisão final em desktop e celular.

## Fora do escopo atual

- API e regras de negócio no servidor.
- Banco de dados MongoDB ou outro banco.
- Login, senhas, perfis e permissões reais.
- Envio de e-mail, formulários ou notificações.
- Sincronização entre navegadores/dispositivos.

## Como executar a pré-visualização

Dentro da pasta `portal-imobiliario`, rode `npm start` e acesse `http://localhost:3000`. Esse processo serve arquivos estáticos e não é um backend do produto. Também é possível abrir com a extensão Live Server do VS Code.
