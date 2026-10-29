const fallbackProperties = window.BartarinDemoProperties || [];

const grid = document.querySelector('#property-grid');
const searchForm = document.querySelector('#search-form');
const typeSelect = searchForm.elements.namedItem('tipo');
const specificFilters = document.querySelector('#specific-filters');
const detailsDialog = document.querySelector('#property-dialog');
const leadDialog = document.querySelector('#lead-dialog');
let properties = [];
let selectedProperty = null;
let favoritesOnly = false;
let favorites = new Set();
try { favorites = new Set(JSON.parse(localStorage.getItem('bartarin-favorites') || '[]')); } catch { localStorage.removeItem('bartarin-favorites'); }

const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
const typeLabel = type => ({ casa: 'Casa', apartamento: 'Apartamento', terreno: 'Terreno', galpao: 'Comercial' }[type] || 'Imóvel');
const imageUrl = (id, width = 760) => `https://images.unsplash.com/${encodeURIComponent(id)}?auto=format&fit=crop&w=${width}&q=82`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function renderSpecificFilters() {
  const type = typeSelect.value;
  if (type === 'apartamento') {
    specificFilters.innerHTML = '<label class="specific-check"><input type="checkbox" name="aceita_pet" value="true"> Aceita pets</label>';
  } else if (type === 'galpao') {
    specificFilters.innerHTML = '<label>Quantidade mínima de docas<input type="number" name="docas" min="0" placeholder="Qualquer quantidade"></label>';
  } else if (type === 'terreno') {
    specificFilters.innerHTML = '<label>Topografia<select name="topografia"><option value="">Qualquer topografia</option><option value="plano">Plano</option><option value="aclive">Aclive</option><option value="declive">Declive</option></select></label><label>Declive máximo (%)<input type="number" name="declive_max" min="0" step="0.1" placeholder="Sem limite"></label>';
  } else {
    specificFilters.innerHTML = '';
  }
}

function getValues() {
  const values = Object.fromEntries([...new FormData(searchForm).entries()].filter(([, value]) => value !== ''));
  const pet = searchForm.elements.namedItem('aceita_pet');
  if (pet?.checked) values.aceita_pet = 'true';
  return values;
}

function filterDemo(items, params) {
  return items.filter(item => {
    if (params.tipo && item.tipo !== params.tipo) return false;
    if (params.finalidade && item.finalidade !== params.finalidade) return false;
    const location = normalize(`${item.localizacao?.cidade || ''} ${item.localizacao?.bairro || ''}`);
    if (params.cidade && !location.includes(normalize(params.cidade))) return false;
    if (params.preco_min && item.preco < Number(params.preco_min)) return false;
    if (params.preco_max && item.preco > Number(params.preco_max)) return false;
    if (params.aceita_pet === 'true' && item.detalhes?.aceita_pet !== true) return false;
    if (params.docas && (item.detalhes?.docas || 0) < Number(params.docas)) return false;
    if (params.topografia && normalize(item.detalhes?.topografia) !== normalize(params.topografia)) return false;
    if (params.declive_max && (item.detalhes?.declive ?? Infinity) > Number(params.declive_max)) return false;
    return true;
  });
}

function propertyCard(item) {
  const details = item.detalhes || {};
  const features = [
    details.area ? `${details.area} m²` : null,
    details.quartos ? `${details.quartos} quartos` : null,
    details.vagas ? `${details.vagas} vagas` : null,
    details.docas ? `${details.docas} docas` : null
  ].filter(Boolean).slice(0, 3);
  const image = item.image || 'photo-1600585154340-be6161a56a0c';
  return `<article class="property-card" data-id="${escapeHtml(item._id)}" tabindex="0" role="button" aria-label="Ver detalhes de ${escapeHtml(item.titulo)}">
    <div class="property-image"><img src="${imageUrl(image)}" alt="${escapeHtml(item.titulo)}" loading="lazy"><span class="badge">${escapeHtml(typeLabel(item.tipo))} · ${item.finalidade === 'locacao' ? 'Locação' : 'À venda'}</span><button class="favorite ${favorites.has(String(item._id)) ? 'favorited' : ''}" data-favorite="${escapeHtml(item._id)}" aria-label="${favorites.has(String(item._id)) ? 'Remover dos' : 'Adicionar aos'} favoritos" aria-pressed="${favorites.has(String(item._id))}">${favorites.has(String(item._id)) ? '♥' : '♡'}</button></div>
    <div class="property-content"><div class="property-topline"><span>ANÚNCIO DE EXEMPLO</span><span>DEMONSTRAÇÃO</span></div><h3>${escapeHtml(item.titulo)}</h3><div class="property-location">⌖ &nbsp;${escapeHtml(item.localizacao?.bairro)}, ${escapeHtml(item.localizacao?.cidade)}</div><div class="property-features">${features.map(value => `<span>⌂ ${escapeHtml(value)}</span>`).join('')}</div><div class="property-footer"><div class="property-price">${money(item.preco)}<small>${item.finalidade === 'locacao' ? 'valor mensal ilustrativo' : 'valor ilustrativo'}</small></div><span class="card-arrow">↗</span></div></div>
  </article>`;
}

function detailRows(item) {
  const values = { ...(item.detalhes || {}) };
  const labels = { andar: 'Andar', valor_condominio: 'Condomínio', aceita_pet: 'Aceita pets', area_lazer: 'Área de lazer', quintal: 'Quintal', andares: 'Andares', churrasqueira: 'Churrasqueira', pe_direito_metros: 'Pé-direito', docas: 'Docas', zoneamento: 'Zoneamento', topografia: 'Topografia', declive: 'Declive', area: 'Área', quartos: 'Quartos', vagas: 'Vagas' };
  return Object.entries(values).map(([key, value]) => {
    const label = labels[key] || key;
    let display = Array.isArray(value) ? value.join(', ') : value;
    if (typeof value === 'boolean') display = value ? 'Sim' : 'Não';
    if (key === 'valor_condominio') display = money(value);
    if (key === 'pe_direito_metros') display = `${value} m`;
    if (key === 'declive') display = `${value}%`;
    if (key === 'area') display = `${value} m²`;
    return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(display)}</dd></div>`;
  }).join('');
}

function openDetails(id) {
  selectedProperty = properties.find(item => String(item._id) === String(id));
  if (!selectedProperty) return;
  const item = selectedProperty;
  document.querySelector('#property-detail').innerHTML = `<img class="detail-image" src="${imageUrl(item.image || 'photo-1600585154340-be6161a56a9c', 1000)}" alt="${escapeHtml(item.titulo)}"><div class="eyebrow"><span class="eyebrow-line"></span> ${escapeHtml(typeLabel(item.tipo))} · ${item.finalidade === 'locacao' ? 'LOCAÇÃO' : 'VENDA'} · ARARAS</div><h2>${escapeHtml(item.titulo)}</h2><p class="detail-location">⌖ ${escapeHtml(item.localizacao?.bairro)}, ${escapeHtml(item.localizacao?.cidade)} - ${escapeHtml(item.localizacao?.uf || 'SP')}</p><strong class="detail-price">${money(item.preco)} ${item.finalidade === 'locacao' ? '<small>/ mês</small>' : ''}</strong><p class="detail-description">${escapeHtml(item.descricao || 'Consulte a equipe para mais informações sobre este imóvel.')}</p><dl class="detail-specs">${detailRows(item)}</dl><p class="demo-disclaimer">Anúncio fictício de demonstração acadêmica; valores e disponibilidade não são oficiais.</p>`;
  detailsDialog.showModal();
}

function loadProperties(params = {}) {
  grid.innerHTML = '<div class="loading-card">Encontrando espaços para você...</div>';
  let stored = fallbackProperties;
  try {
    const saved = JSON.parse(localStorage.getItem('bartarin-properties') || 'null');
    if (Array.isArray(saved)) stored = saved;
  } catch { localStorage.removeItem('bartarin-properties'); }
  properties = filterDemo(stored.filter(item => item.status !== 'arquivado'), params);
  const indicator = document.querySelector('#catalogue-note');
  if (indicator) indicator.hidden = false;
  if (favoritesOnly) properties = properties.filter(item => favorites.has(String(item._id)));
  grid.innerHTML = properties.length ? properties.map(propertyCard).join('') : `<div class="empty-state">${favoritesOnly && favorites.size ? 'Nenhum dos seus favoritos corresponde a esses filtros.' : favoritesOnly ? 'Você ainda não favoritou nenhum imóvel.' : 'Não encontramos imóveis com esses filtros. Tente mudar os critérios de busca.'}</div>`;
}

document.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => {
  typeSelect.value = button.dataset.type;
  renderSpecificFilters();
  document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.toggle('selected', chip === button));
  loadProperties(getValues());
}));
document.querySelector('#favorites-toggle').addEventListener('click', event => {
  favoritesOnly = !favoritesOnly;
  event.currentTarget.classList.toggle('active', favoritesOnly);
  event.currentTarget.textContent = favoritesOnly ? 'Ver todos os imóveis ↗' : 'Ver favoritos ♡';
  loadProperties(getValues());
});
typeSelect.addEventListener('change', renderSpecificFilters);
searchForm.addEventListener('submit', event => {
  event.preventDefault();
  const values = getValues();
  if (values.preco_min && values.preco_max && Number(values.preco_min) > Number(values.preco_max)) {
    grid.innerHTML = '<div class="empty-state">O preço mínimo precisa ser menor ou igual ao preço máximo.</div>';
    return;
  }
  document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.toggle('selected', chip.dataset.type === (values.tipo || '')));
  loadProperties(values);
});

grid.addEventListener('click', event => {
  const favoriteButton = event.target.closest('[data-favorite]');
  if (favoriteButton) {
    event.stopPropagation();
    const id = String(favoriteButton.dataset.favorite);
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    localStorage.setItem('bartarin-favorites', JSON.stringify([...favorites]));
    favoriteButton.classList.toggle('favorited', favorites.has(id));
    favoriteButton.textContent = favorites.has(id) ? '♥' : '♡';
    favoriteButton.setAttribute('aria-pressed', String(favorites.has(id)));
    favoriteButton.setAttribute('aria-label', `${favorites.has(id) ? 'Remover dos' : 'Adicionar aos'} favoritos`);
    return;
  }
  const card = event.target.closest('.property-card');
  if (card) openDetails(card.dataset.id);
});
grid.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.property-card')) {
    event.preventDefault();
    openDetails(event.target.dataset.id);
  }
});

detailsDialog.addEventListener('click', event => { if (event.target === detailsDialog) detailsDialog.close(); });
document.querySelector('#interest-from-detail').addEventListener('click', () => {
  detailsDialog.close();
  leadDialog.showModal();
});
document.querySelectorAll('#open-lead, #open-lead-2').forEach(button => button.addEventListener('click', () => {
  selectedProperty = null;
  leadDialog.showModal();
}));
leadDialog.querySelector('.dialog-close button').addEventListener('click', () => leadDialog.close());
leadDialog.addEventListener('click', event => { if (event.target === leadDialog) leadDialog.close(); });
document.querySelector('#lead-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector('#lead-message');
  message.textContent = 'Fluxo demonstrado. Seus dados não foram enviados nem armazenados.';
  message.classList.remove('error');
  message.classList.add('success');
});

renderSpecificFilters();
loadProperties();
