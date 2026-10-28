import 'dotenv/config';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
let db;
let mongoAvailable = false;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (_req, res) => res.json({ mongo: mongoAvailable }));

const propertyTypes = {
  apartamento: ['andar', 'valor_condominio', 'aceita_pet', 'area_lazer'],
  casa: ['quintal', 'andares', 'churrasqueira'],
  galpao: ['pe_direito_metros', 'docas', 'zoneamento'],
  terreno: ['topografia', 'declive']
};

function parsePropertyId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

function cleanProperty(body) {
  const tipo = String(body.tipo || '').toLowerCase();
  if (!propertyTypes[tipo]) throw new Error('Tipo de imóvel inválido.');
  const preco = Number(body.preco);
  if (!Number.isFinite(preco) || preco <= 0) throw new Error('Informe um preço válido.');
  const allowed = propertyTypes[tipo];
  const detailsInput = body.detalhes && typeof body.detalhes === 'object' && !Array.isArray(body.detalhes) ? body.detalhes : {};
  const detalhes = Object.fromEntries(Object.entries(detailsInput)
    .filter(([key, value]) => allowed.includes(key) && value !== '' && value !== null));
  for (const key of ['andar', 'valor_condominio', 'andares', 'pe_direito_metros', 'docas', 'declive']) {
    if (key in detalhes) {
      const parsed = Number(detalhes[key]);
      if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`O campo ${key} precisa ser um número igual ou maior que zero.`);
      detalhes[key] = parsed;
    }
  }
  for (const key of ['aceita_pet', 'quintal', 'churrasqueira']) {
    if (key in detalhes && typeof detalhes[key] !== 'boolean') throw new Error(`O campo ${key} precisa ser verdadeiro ou falso.`);
  }
  if ('area_lazer' in detalhes && !Array.isArray(detalhes.area_lazer)) {
    detalhes.area_lazer = String(detalhes.area_lazer).split(',').map(value => value.trim()).filter(Boolean).slice(0, 12);
  }
  return {
    titulo: String(body.titulo || '').trim().slice(0, 120),
    tipo,
    finalidade: ['venda', 'locacao'].includes(body.finalidade) ? body.finalidade : 'venda',
    preco,
    localizacao: {
      cidade: String(body.cidade || '').trim().slice(0, 80),
      bairro: String(body.bairro || '').trim().slice(0, 80),
      uf: String(body.uf || '').trim().toUpperCase().slice(0, 2)
    },
    descricao: String(body.descricao || '').trim().slice(0, 1800),
    detalhes,
    status: 'ativo',
    updated_at: new Date()
  };
}

app.get('/api/imoveis', async (req, res) => {
  if (!mongoAvailable) return res.json([]);
  try {
    const filter = { status: 'ativo' };
    if (req.query.tipo && propertyTypes[req.query.tipo]) filter.tipo = req.query.tipo;
    if (req.query.finalidade && ['venda', 'locacao'].includes(req.query.finalidade)) filter.finalidade = req.query.finalidade;
    if (req.query.cidade) {
      const term = String(req.query.cidade).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { 'localizacao.cidade': new RegExp(term, 'i') },
        { 'localizacao.bairro': new RegExp(term, 'i') }
      ];
    }
    const min = Number(req.query.preco_min);
    const max = Number(req.query.preco_max);
    if (Number.isFinite(min) || Number.isFinite(max)) {
      filter.preco = {};
      if (Number.isFinite(min)) filter.preco.$gte = min;
      if (Number.isFinite(max)) filter.preco.$lte = max;
    }
    if (req.query.aceita_pet === 'true') filter['detalhes.aceita_pet'] = true;
    if (req.query.docas) filter['detalhes.docas'] = { $gte: Number(req.query.docas) };
    const items = await db.collection('imoveis').find(filter).sort({ created_at: -1 }).limit(60).toArray();
    res.json(items);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/imoveis', async (req, res) => {
  if (!mongoAvailable) return res.status(503).json({ error: 'MongoDB não está conectado. O modo de demonstração não salva anúncios.' });
  try {
    const property = cleanProperty(req.body);
    if (!property.titulo || !property.localizacao.cidade || !property.localizacao.bairro) {
      return res.status(422).json({ error: 'Preencha título, cidade e bairro.' });
    }
    property.created_at = new Date();
    const result = await db.collection('imoveis').insertOne(property);
    res.status(201).json({ ...property, _id: result.insertedId });
  } catch (error) { res.status(422).json({ error: error.message }); }
});

app.patch('/api/imoveis/:id', async (req, res) => {
  if (!mongoAvailable) return res.status(503).json({ error: 'MongoDB não está conectado.' });
  const _id = parsePropertyId(req.params.id);
  if (!_id) return res.status(400).json({ error: 'ID inválido.' });
  try {
    const current = await db.collection('imoveis').findOne({ _id });
    if (!current) return res.status(404).json({ error: 'Imóvel não encontrado.' });
    const property = cleanProperty({ ...current, ...req.body, detalhes: req.body.detalhes ?? current.detalhes,
      cidade: req.body.cidade ?? current.localizacao?.cidade,
      bairro: req.body.bairro ?? current.localizacao?.bairro,
      uf: req.body.uf ?? current.localizacao?.uf });
    if (!property.titulo || !property.localizacao.cidade || !property.localizacao.bairro) {
      return res.status(422).json({ error: 'Preencha título, cidade e bairro.' });
    }
    property.status = current.status || 'ativo';
    property.created_at = current.created_at || new Date();
    await db.collection('imoveis').updateOne({ _id }, { $set: property });
    res.json({ ...property, _id });
  } catch (error) { res.status(422).json({ error: error.message }); }
});

app.delete('/api/imoveis/:id', async (req, res) => {
  if (!mongoAvailable) return res.status(503).json({ error: 'MongoDB não está conectado.' });
  const _id = parsePropertyId(req.params.id);
  if (!_id) return res.status(400).json({ error: 'ID inválido.' });
  try {
    const result = await db.collection('imoveis').updateOne({ _id }, { $set: { status: 'arquivado', updated_at: new Date() } });
    if (!result.matchedCount) return res.status(404).json({ error: 'Imóvel não encontrado.' });
    res.json({ message: 'Imóvel arquivado.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/leads', async (_req, res) => {
  if (!mongoAvailable) return res.status(503).json({ error: 'MongoDB não está conectado.' });
  try { res.json(await db.collection('leads').find({}).sort({ updated_at: -1 }).limit(60).toArray()); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/leads', async (req, res) => {
  if (!mongoAvailable) return res.status(503).json({ error: 'MongoDB não está conectado. Inicie o banco para salvar seu contato no CRM.' });
  try {
    const nome = String(req.body.nome || '').trim().slice(0, 100);
    const email = String(req.body.email || '').trim().toLowerCase().slice(0, 160);
    const telefone = String(req.body.telefone || '').trim().slice(0, 30);
    if (!nome || !/^\S+@\S+\.\S+$/.test(email)) return res.status(422).json({ error: 'Informe nome e e-mail válido.' });
    const lead = {
      nome, email, telefone,
      etapa: 'novo',
      imoveis_favoritos: ObjectId.isValid(req.body.imovel_id) ? [new ObjectId(req.body.imovel_id)] : [],
      historico: [{ data: new Date(), tipo: 'cadastro', observacao: 'Lead cadastrado pelo portal.' }],
      updated_at: new Date(), created_at: new Date()
    };
    const result = await db.collection('leads').insertOne(lead);
    res.status(201).json({ ...lead, _id: result.insertedId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/leads/:id', async (req, res) => {
  if (!mongoAvailable) return res.status(503).json({ error: 'MongoDB não está conectado.' });
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'ID inválido.' });
    const etapas = ['novo', 'em_atendimento', 'visita_agendada', 'convertido', 'perdido'];
    const etapa = etapas.includes(req.body.etapa) ? req.body.etapa : null;
    const contato = String(req.body.observacao || '').trim().slice(0, 500);
    if (!etapa && !contato) return res.status(422).json({ error: 'Informe uma etapa ou observação.' });
    const update = { $set: { updated_at: new Date() } };
    if (etapa) update.$set.etapa = etapa;
    if (contato) update.$push = { historico: { data: new Date(), tipo: 'nota', observacao: contato } };
    const result = await db.collection('leads').findOneAndUpdate({ _id: new ObjectId(req.params.id) }, update, { returnDocument: 'after' });
    if (!result) return res.status(404).json({ error: 'Lead não encontrado.' });
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

async function start() {
  try {
    await client.connect();
    db = client.db(process.env.MONGODB_DATABASE || 'portal_imobiliario');
    await db.collection('imoveis').createIndex({ status: 1, tipo: 1, finalidade: 1, preco: 1 });
    await db.collection('imoveis').createIndex({ 'localizacao.cidade': 1, 'localizacao.bairro': 1 });
    await db.collection('leads').createIndex({ email: 1 });
    mongoAvailable = true;
  } catch (error) {
    console.warn('MongoDB indisponível; iniciando em modo de demonstração:', error.message);
  }
  app.listen(port, () => console.log(`Portal imobiliário em http://localhost:${port}`));
}
start();
