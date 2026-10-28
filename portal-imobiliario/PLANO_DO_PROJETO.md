# Plano e checklist — Bartarin Imóveis

Documento de acompanhamento do Projeto Integrador. Atualizar os itens conforme forem implementados e verificados.

## Objetivo

Construir um portal imobiliário com CRM de leads para o contexto da Bartarin Imóveis, em Araras. O sistema deve permitir consultar imóveis, cadastrar propriedades com detalhes variáveis por categoria e acompanhar os interessados e seus contatos.

## Decisões e limites atuais

- [x] Protótipo isolado em `portal-imobiliario/`.
- [x] Stack atual: Node.js + Express + driver oficial `mongodb`.
- [ ] Confirmar com o professor que Node/Express atende à stack permitida; a proposta inicial citava Laravel ou Spring Boot.
- [x] MongoDB como persistência alvo, com documentos de imóveis flexíveis.
- [x] Interface em verde sálvia, off-white e tons leves.
- [x] Dados de fallback identificados como demonstração, não anúncios oficiais.
- [ ] Definir ambiente MongoDB de desenvolvimento (local ou Atlas) e manter credenciais apenas em `.env`.
- [ ] Confirmar dados institucionais autorizados para publicação (logo, telefone, CRECI, textos e anúncios reais).

## Fase 0 — Preparação do projeto

- [x] Criar estrutura inicial e instruções de execução.
- [x] Criar `.env.example` sem segredos.
- [x] Servir frontend e API pelo Express.
- [x] Revisar README para refletir modo de demonstração sem MongoDB.
- [ ] Definir padrão de formatação, validação e tratamento de erros da API.
- [ ] Criar estratégia de dados de exemplo para desenvolvimento e apresentação.

## Fase 1 — Banco de dados e modelagem MongoDB

- [x] Definir coleções iniciais `imoveis` e `leads`.
- [x] Definir atributos comuns dos imóveis: título, tipo, finalidade, preço, localização, descrição e status.
- [x] Definir `detalhes` variável para casa, apartamento, galpão e terreno.
- [x] Definir histórico de contatos embutido no documento de lead.
- [x] Criar índices iniciais para busca de imóveis e e-mail do lead.
- [ ] Ligar o ambiente de desenvolvimento a um MongoDB real e confirmar persistência após reinício.
- [ ] Definir documentos de usuários e relações/referências entre usuário, lead e imóvel.
- [ ] Avaliar índice de unicidade de e-mail e índices guiados pelas consultas finais.
- [ ] Documentar campos e exemplos finais do modelo.

## Fase 2 — Catálogo público e busca

- [x] Criar página inicial responsiva e identidade visual Bartarin Imóveis.
- [x] Exibir cartões com imóveis de demonstração quando a coleção não retorna dados.
- [x] Implementar filtro inicial por tipo, cidade/bairro e preço.
- [x] Implementar rota `GET /api/imoveis` com filtros principais.
- [ ] Garantir que o fallback só apareça em modo de demonstração e não mascare falhas da API em produção.
- [ ] Criar página de detalhes do imóvel.
- [ ] Incluir filtros por atributos específicos (ex.: aceita pet, docas, topografia).
- [ ] Adicionar paginação e ordenação.
- [ ] Persistir favoritos por cliente autenticado.
- [ ] Tratar imagens com upload/armazenamento apropriado, não apenas URLs de demonstração.

## Fase 3 — Autenticação e permissões

- [ ] Escolher estratégia de autenticação adequada à stack (sessão segura ou token).
- [ ] Criar login e logout.
- [ ] Criar cadastro de usuário conforme escopo aprovado.
- [ ] Definir perfis: administrador, corretor e cliente.
- [ ] Proteger rotas da API.
- [ ] Implementar autorização por papel e propriedade dos registros.
- [ ] Criar usuário administrador inicial de desenvolvimento sem credenciais fixas no repositório.

## Fase 4 — Gestão de imóveis

- [x] Criar endpoint inicial `POST /api/imoveis` com validação básica dos campos comuns.
- [x] Filtrar `detalhes` conforme o tipo de imóvel no backend.
- [x] Construir formulário administrativo dinâmico por categoria.
- [x] Implementar listar, criar, editar e arquivar (remoção lógica) de imóveis.
- [ ] Restringir gerenciamento a administrador/corretor autorizado.
- [ ] Validar faixas, tipos e campos obrigatórios por categoria.
- [ ] Registrar corretor responsável e datas de criação/alteração.

## Fase 5 — CRM de leads

- [x] Criar endpoint `POST /api/leads` com cadastro básico.
- [x] Criar histórico inicial embutido no lead.
- [x] Criar endpoint `GET /api/leads`.
- [x] Criar endpoint `PATCH /api/leads/:id` para etapa e anotação.
- [ ] Criar painel CRM protegido por autenticação.
- [ ] Associar lead a corretor responsável.
- [ ] Vincular leads a imóveis de interesse com referências válidas.
- [ ] Criar interface para consultar lead, alterar etapa e registrar contato.
- [ ] Definir etapas e tipos de contato com a equipe/professor.
- [ ] Impedir acesso público a dados pessoais dos leads.

## Fase 6 — Interface e experiência

- [x] Construir landing page e catálogo adaptáveis a telas menores.
- [x] Adicionar formulário público para contato.
- [x] Criar página local de gestão de imóveis (ainda sem autenticação).
- [ ] Criar páginas próprias para login, painel do corretor e administração.
- [ ] Exibir estados de carregamento, erro, vazio e sucesso de forma consistente.
- [ ] Verificar acessibilidade de formulários, contraste, teclado e leitores de tela.
- [ ] Substituir conteúdo fictício por conteúdo explicitamente acadêmico ou autorizado.
- [ ] Conferir responsividade em desktop, tablet e celular.

## Fase 7 — Qualidade, segurança e entrega

- [ ] Criar testes de validação e rotas (imóveis, filtros, leads, permissões).
- [ ] Validar entradas e limitar consultas para evitar abuso e filtros inválidos.
- [ ] Adicionar rate limiting e proteção contra spam no formulário público.
- [ ] Configurar logs sem expor credenciais ou dados pessoais.
- [ ] Revisar tratamento de erros e códigos HTTP.
- [ ] Confirmar que `.env`, uploads privados e dados pessoais não entram no Git.
- [ ] Preparar dados demonstrativos e roteiro de demonstração.
- [ ] Preparar explicação da modelagem MongoDB e suas limitações.
- [ ] Atualizar README, este checklist e documentação da API.
- [ ] Fazer uma revisão final com o professor dos requisitos e da stack.

## Estado geral

**Em andamento — protótipo inicial.** A interface e alguns endpoints já existem. O sistema ainda não tem autenticação, painel CRM, gestão completa de imóveis, favoritos persistentes, nem integração MongoDB confirmada neste ambiente. Não considerar pronto para produção.

## Próxima sequência recomendada

1. Confirmar stack permitida e conectar MongoDB de desenvolvimento.
2. Estabelecer modelos/validações de usuários, imóveis e leads.
3. Implementar autenticação e permissões.
4. Fazer o painel administrativo de imóveis.
5. Fazer o painel CRM e integrar o formulário público aos leads.
6. Completar filtros, favoritos e imagens.
7. Testar os fluxos e preparar apresentação.
