# Escopo e checklist — Bartarin Imóveis

## Objetivo do protótipo

Demonstrar um portal imobiliário e CRM de leads para o contexto acadêmico da Bartarin Imóveis, em Araras. O repositório agora inclui a API em `../api`, com integração MongoDB, login e gestão de usuários/imóveis. O CRM de exemplo continua usando contatos fictícios.

> Configure Python, MongoDB e variáveis de ambiente conforme `../api/README.md` para usar os fluxos conectados.

## Tecnologias definidas

- [x] HTML, CSS e JavaScript no navegador.
- [x] `localStorage` para simular favoritos, alterações de imóveis e alterações de leads.
- [x] Node.js nativo para servir a pré-visualização local.
- [x] API Flask com MongoDB documentada em `../api/README.md`.

## 1. Portal e busca de imóveis

- [x] Página inicial responsiva e identidade visual leve.
- [x] Catálogo com 79 anúncios públicos de venda consultados em 23/11/2026, em seis categorias.
- [x] Filtros por tipo, bairro de Araras, dormitórios e faixa de preço.
- [x] Detalhes do imóvel.
- [x] Fotos locais das galerias dos anuncios, associadas ao imovel correspondente; logo local nas telas.
- [x] Mapa aproximado pelo bairro, sem publicar endereço exato.
- [x] Favoritos locais no navegador.
- [x] Formulário de interesse demonstrativo sem envio de dados.
- [ ] Revisar experiência em tamanhos variados de tela.
- [ ] Revisar acessibilidade e navegação por teclado.

## 2. Gestão demonstrativa de imóveis

- [x] Formulário que adapta campos pela categoria.
- [x] Criar, editar e arquivar imóveis no `localStorage`.
- [x] Adicionar até 8 fotos por imóvel; redimensionar e converter para WebP no navegador antes de salvar.
- [x] Criar carrossel para Instagram em proporção 4:5, com prévia e download individual dos slides em PNG.
- [x] Compartilhar os anúncios e alterações locais entre o painel e o catálogo no mesmo navegador.
- [x] Adicionar ordenação por preço e paginação visual ao catálogo.

## 3. Conta e acesso (somente telas)

- [x] Tela de login conectada à API quando o backend estiver configurado.
- [x] Tela visual de cadastro de cliente.
- [x] Tela visual de recuperação de senha.
- [x] A interface informa quando a API não está disponível; cadastro e login são demonstráveis com backend.
- [ ] Revisar aparência dos estados de validação e erro.

## 4. CRM demonstrativo

- [x] Painel com métricas fictícias.
- [x] Lista de leads fictícios com busca e filtros por etapa.
- [x] Alterar etapa e acrescentar anotações localmente.
- [x] Persistir alterações demonstrativas no `localStorage`.
- [ ] Refinar conteúdo e layout para apresentação acadêmica.

## 5. Apresentação e entrega

- [x] Documentar escopo frontend no README.
- [x] Identificar os anúncios com referência e link de origem; identificar os contatos do CRM como fictícios.
- [x] Incluir instruções de configuração do MongoDB e da API no repositório.
- [ ] Preparar roteiro curto para demonstrar busca, favoritos, gestão e CRM.
- [ ] Fazer revisão final em desktop e celular.

## Fora do escopo atual

- Envio real de formulários públicos e notificações por e-mail.
- Envio de e-mail, formulários ou notificações.
- Sincronização entre navegadores/dispositivos.

## Como executar a pré-visualização

Dentro da pasta `portal-imobiliario`, rode `npm start` e acesse `http://localhost:3000`. Esse comando serve o frontend e as imagens locais. Para usar cadastro, login e operações conectadas, configure o MongoDB e inicie a API seguindo `../api/README.md`.
