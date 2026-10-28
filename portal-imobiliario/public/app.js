const fallbackProperties = [
  { _id: 'demo1', titulo: 'Casa pronta para morar no Centro', tipo: 'casa', finalidade: 'venda', preco: 399990, localizacao: { cidade: 'Araras', bairro: 'Centro', uf: 'SP' }, descricao: 'Imóvel demonstrativo inspirado nas categorias e regiões atendidas pela Bartarin Imóveis.', detalhes: { quintal: true, andares: 1, churrasqueira: true }, image: 'photo-1600585154340-be6161a56a0c', area: '125 m²', rooms: '2 quartos', garage: '2 vagas' },
  { _id: 'demo2', titulo: 'Apartamento para viver bem', tipo: 'apartamento', finalidade: 'venda', preco: 210000, localizacao: { cidade: 'Araras', bairro: 'Jardim Celina', uf: 'SP' }, descricao: 'Exemplo acadêmico de anúncio de apartamento em Araras.', detalhes: { andar: 2, valor_condominio: 280, aceita_pet: true }, image: 'photo-1600607687920-4e2a09cf159d', area: '68 m²', rooms: '2 quartos', garage: '1 vaga' },
  { _id: 'demo3', titulo: 'Casa com espaço para a família', tipo: 'casa', finalidade: 'venda', preco: 650000, localizacao: { cidade: 'Araras', bairro: 'Terras de Santa Elisa', uf: 'SP' }, descricao: 'Conteúdo demonstrativo. Consulte a equipe para informações sobre imóveis disponíveis.', detalhes: { quintal: true, andares: 1, churrasqueira: true }, image: 'photo-1600566753086-00f18fb6b3ea', area: '250 m²', rooms: '3 quartos', garage: '3 vagas' },
  { _id: 'demo4', titulo: 'Apartamento no Jardim das Palmeiras', tipo: 'apartamento', finalidade: 'venda', preco: 196000, localizacao: { cidade: 'Araras', bairro: 'Jardim das Palmeiras', uf: 'SP' }, descricao: 'Exemplo acadêmico de anúncio. Valores e disponibilidade não são oficiais.', detalhes: { andar: 1, valor_condominio: 280, aceita_pet: true }, image: 'photo-1600607687939-ce8a6c25118c', area: '62 m²', rooms: '2 quartos', garage: '1 vaga' },
  { _id: 'demo5', titulo: 'Casa com varanda e jardim', tipo: 'casa', finalidade: 'venda', preco: 450000, localizacao: { cidade: 'Araras', bairro: 'Jardim das Araras III', uf: 'SP' }, descricao: 'Imóvel de demonstração para apresentação acadêmica do portal.', detalhes: { quintal: true, andares: 1 }, image: 'photo-1600607687644-c7171b42498f', area: '141 m²', rooms: '3 quartos', garage: '2 vagas' },
  { _id: 'demo6', titulo: 'Casa ampla no Portal do Parque', tipo: 'casa', finalidade: 'venda', preco: 749000, localizacao: { cidade: 'Araras', bairro: 'Jardim Portal do Parque', uf: 'SP' }, descricao: 'Anúncio fictício de demonstração; confirme os dados diretamente com a imobiliária.', detalhes: { quintal: true, andares: 2, churrasqueira: true }, image: 'photo-1600607687920-4e2a09cf159d', area: '354 m²', rooms: '4 quartos', garage: '4 vagas' }
];
const grid = document.querySelector('#property-grid');
let activeType = '';
let properties = [];
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
const titleType = type => ({ casa: 'Casa', apartamento: 'Apartamento', terreno: 'Terreno', galpao: 'Comercial' }[type] || 'Imóvel');
const imageUrl = (id, width = 760) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function card(item, index) {
  const fallback = fallbackProperties[index % fallbackProperties.length];
  const type = item.tipo || fallback.tipo;
  const location = item.localizacao || fallback.localizacao;
  const detail = item.detalhes || {};
  const features = [detail.area ? `${detail.area} m²` : fallback.area, detail.quartos ? `${detail.quartos} quartos` : fallback.rooms, detail.vagas ? `${detail.vagas} vagas` : fallback.garage].filter(Boolean);
  return `<article class="property-card" data-id="${escapeHtml(item._id || '')}">
    <div class="property-image"><img src="${item.image ? imageUrl(encodeURIComponent(item.image)) : imageUrl(fallback.image)}" alt="${escapeHtml(item.titulo || fallback.titulo)}" loading="lazy"><span class="badge">${escapeHtml(titleType(type))} · ${item.finalidade === 'locacao' ? 'Locação' : 'À venda'}</span><button class="favorite" aria-label="Favoritar imóvel">♡</button></div>
    <div class="property-content"><div class="property-topline"><span>ESPAÇO SELECIONADO</span><span>● DISPONÍVEL</span></div><h3>${escapeHtml(item.titulo || fallback.titulo)}</h3><div class="property-location">⌖ &nbsp;${escapeHtml(location.bairro || fallback.localizacao.bairro)}, ${escapeHtml(location.cidade || fallback.localizacao.cidade)}</div><div class="property-features">${features.map(f => `<span>⌂ ${escapeHtml(f)}</span>`).join('')}</div><div class="property-footer"><div class="property-price">${money(item.preco || fallback.preco)}<small>${item.finalidade === 'locacao' ? 'por mês' : 'valor do imóvel'}</small></div><span class="card-arrow">↗</span></div></div>
  </article>`;
}

async function loadProperties(params = {}) {
  grid.innerHTML = '<div class="loading-card">Encontrando espaços para você...</div>';
  try {
    const query = new URLSearchParams(params);
    const response = await fetch(`/api/imoveis?${query}`);
    if (!response.ok) throw new Error('API indisponível');
    const data = await response.json();
    properties = data.length ? data : fallbackProperties;
  } catch { properties = fallbackProperties; }
  if (activeType) properties = properties.filter(item => item.tipo === activeType);
  grid.innerHTML = properties.length ? properties.map(card).join('') : '<div class="empty-state">Ainda não há imóveis deste tipo. Que tal falar com a nossa equipe?</div>';
}

document.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('selected'));
  button.classList.add('selected');
  activeType = button.dataset.type;
  const formData = new FormData(document.querySelector('#search-form'));
  loadProperties(Object.fromEntries([...formData.entries()].filter(([, value]) => value)));
}));
document.querySelector('#search-form').addEventListener('submit', event => {
  event.preventDefault();
  const values = Object.fromEntries([...new FormData(event.currentTarget).entries()].filter(([, value]) => value));
  activeType = values.tipo || '';
  document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.toggle('selected', chip.dataset.type === activeType));
  loadProperties(values);
});
document.addEventListener('click', event => {
  if (event.target.matches('.favorite')) {
    const button = event.target;
    button.textContent = button.textContent === '♡' ? '♥' : '♡';
    button.classList.toggle('favorited');
  }
});

const dialog = document.querySelector('#lead-dialog');
document.querySelectorAll('#open-lead, #open-lead-2').forEach(button => button.addEventListener('click', () => dialog.showModal()));
document.querySelector('.dialog-close button').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
document.querySelector('#lead-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector('#lead-message');
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível enviar.');
    message.textContent = 'Pronto! Nossa equipe vai falar com você em breve.';
    form.reset();
    setTimeout(() => dialog.close(), 1800);
  } catch (error) {
    message.textContent = error.message || 'Não foi possível enviar agora.';
    message.classList.add('error');
  }
});
loadProperties();
