const fallbackProperties = window.BartarinDemoProperties || [];

const grid = document.querySelector('#property-grid');
const pagination = document.querySelector('#catalogue-pagination');
const sortOrder = document.querySelector('#sort-order');
const searchForm = document.querySelector('#search-form');
const typeSelect = searchForm.elements.namedItem('tipo');
const neighborhoodSelect = document.querySelector('#neighborhood-select');
const resultsCount = document.querySelector('#results-count');
const detailsDialog = document.querySelector('#property-dialog');
const imageViewer = document.querySelector('#image-viewer');
const leadDialog = document.querySelector('#lead-dialog');
let properties = [];
let selectedProperty = null;
let activeGallery = [];
let activeGalleryIndex = 0;
let favoritesOnly = false;
let currentPage = 1;
const pageSize = 12;
let favorites = new Set();
try { favorites = new Set(JSON.parse(localStorage.getItem('bartarin-favorites') || '[]')); } catch { localStorage.removeItem('bartarin-favorites'); }

const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
const measure = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value || 0);
const typeLabel = type => ({ casa: 'Casa', apartamento: 'Apartamento', terreno: 'Terreno', galpao: 'Galpão', chacara: 'Chácara', comercial: 'Sala comercial', casa_condominio: 'Casa em condomínio' }[type] || 'Imóvel');
const imageUrl = image => image?.startsWith('data:image/') || image?.startsWith('/images/') || image?.startsWith('./images/') ? image : '/images/imoveis/imovel-16e34c371fd4-marca.jpg';
const localImageByType = { apartamento: '/images/imoveis/imovel-50fa959b6065-marca.jpg', casa: '/images/imoveis/imovel-16e34c371fd4-marca.jpg', casa_condominio: '/images/imoveis/imovel-11240da37542-marca.jpg', chacara: '/images/imoveis/imovel-d9407043e6ce-marca.jpg', comercial: '/images/imoveis/imovel-4d4a604e21fd-marca.jpg', galpao: '/images/imoveis/imovel-4d4a604e21fd-marca.jpg', terreno: '/images/imoveis/imovel-e60279237c21-marca.jpg' };
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function getValues() {
  return Object.fromEntries([...new FormData(searchForm).entries()].filter(([, value]) => value !== ''));
}

function catalogProperties() {
  try {
    const saved = JSON.parse(localStorage.getItem('bartarin-properties-v6') || 'null');
    if (Array.isArray(saved)) {
      const result = migrateRemotePhotos(saved);
      if (result.changed) localStorage.setItem('bartarin-properties-v6', JSON.stringify(result.items));
      return result.items;
    }
  } catch { localStorage.removeItem('bartarin-properties-v6'); }
  return migrateRemotePhotos(fallbackProperties).items;
}

function migrateRemotePhotos(items) {
  let changed = false;
  const migrated = items.map(item => {
    const photos = [...(Array.isArray(item.images) ? item.images : []), ...(item.image ? [{ src: item.image, thumb: item.image }] : [])];
    if (!photos.some(photo => /^https?:\/\//i.test(photo?.src || photo?.thumb || ''))) return item;
    changed = true;
    const localPhotos = photos.filter(photo => [photo?.src, photo?.thumb].some(value => value?.startsWith('data:image/') || value?.startsWith('/images/')));
    const image = localPhotos[0]?.src || localImageByType[item.tipo] || '/images/imoveis/imovel-16e34c371fd4-marca.jpg';
    return { ...item, image, images: localPhotos.length ? localPhotos : [{ src: image, thumb: image }] };
  });
  return { items: migrated, changed };
}

function populateNeighborhoods() {
  const neighborhoods = [...new Set(catalogProperties()
    .filter(item => normalize(item.localizacao?.cidade) === 'araras' && item.status !== 'arquivado' && !item.vendido)
    .map(item => item.localizacao?.bairro)
    .filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'pt-BR'));
  neighborhoodSelect.innerHTML = '<option value="">Todos os bairros</option>' + neighborhoods
    .map(neighborhood => `<option value="${escapeHtml(neighborhood)}">${escapeHtml(neighborhood)}</option>`)
    .join('');
}

function filterDemo(items, params) {
  return items.filter(item => {
    if (params.tipo && item.tipo !== params.tipo) return false;
    if (normalize(item.localizacao?.cidade) !== 'araras') return false;
    if (params.bairro && normalize(item.localizacao?.bairro) !== normalize(params.bairro)) return false;
    if (params.quartos_min && (item.detalhes?.quartos || 0) < Number(params.quartos_min)) return false;
    if (params.preco_min && item.preco < Number(params.preco_min)) return false;
    if (params.preco_max && item.preco > Number(params.preco_max)) return false;
    return true;
  });
}

function propertyCard(item) {
  const details = item.detalhes || {};
  const features = [
    details.area ? `${measure(details.area)} m²` : null,
    details.quartos ? `${details.quartos} quartos` : null,
    details.vagas ? `${details.vagas} vagas` : null,
    details.docas ? `${details.docas} docas` : null
  ].filter(Boolean).slice(0, 3);
  const cardImage = item.images?.[0]?.thumb || item.image;
  return `<article class="property-card" data-id="${escapeHtml(item._id)}" tabindex="0" aria-label="Ver detalhes de ${escapeHtml(item.titulo)}">
    <div class="property-image"><img src="${imageUrl(cardImage)}" alt="Foto de ${escapeHtml(item.titulo)}" loading="lazy" decoding="async" fetchpriority="low"><span class="badge">${escapeHtml(typeLabel(item.tipo))} · À venda</span><button class="favorite ${favorites.has(String(item._id)) ? 'favorited' : ''}" data-favorite="${escapeHtml(item._id)}" aria-label="${favorites.has(String(item._id)) ? 'Remover dos' : 'Adicionar aos'} favoritos" aria-pressed="${favorites.has(String(item._id))}">${favorites.has(String(item._id)) ? '♥' : '♡'}</button></div>
    <div class="property-content"><div class="property-topline"><span>ANÚNCIO DA IMOBILIÁRIA</span><span>REF. ${escapeHtml(item.reference || '')}</span></div><h3>${escapeHtml(item.titulo)}</h3><div class="property-location">⌖ &nbsp;${escapeHtml(item.localizacao?.bairro)}, Araras</div><div class="property-features">${features.map(value => `<span>⌂ ${escapeHtml(value)}</span>`).join('')}</div><div class="property-footer"><div class="property-price">${money(item.preco)}<small>valor publicado · sujeito a alteração</small></div><span class="card-arrow">↗</span></div></div>
  </article>`;
}

function detailRows(item) {
  const values = { ...(item.detalhes || {}) };
  const labels = { andar: 'Andar', valor_condominio: 'Condomínio', aceita_pet: 'Aceita pets', area_lazer: 'Área de lazer', quintal: 'Quintal', andares: 'Andares', churrasqueira: 'Churrasqueira', pe_direito_metros: 'Pé-direito', docas: 'Docas', zoneamento: 'Zoneamento', topografia: 'Topografia', declive: 'Declive', area: 'Área', terreno: 'Terreno', quartos: 'Quartos', suites: 'Suítes', banheiros: 'Banheiros', vagas: 'Vagas', financiamento: 'Aceita financiamento', piscina: 'Piscina', permuta: 'Estuda permuta', area_gourmet: 'Área gourmet', planejados: 'Móveis planejados' };
  return Object.entries(values).map(([key, value]) => {
    const label = labels[key] || key;
    let display = Array.isArray(value) ? value.join(', ') : value;
    if (typeof value === 'boolean') display = value ? 'Sim' : 'Não';
    if (key === 'valor_condominio') display = money(value);
    if (key === 'pe_direito_metros') display = `${value} m`;
    if (key === 'declive') display = `${value}%`;
    if (key === 'area' || key === 'terreno') display = `${measure(value)} m²`;
    return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(display)}</dd></div>`;
  }).join('');
}

function openDetails(id) {
  selectedProperty = properties.find(item => String(item._id) === String(id));
  if (!selectedProperty) return;
  const item = selectedProperty;
  activeGallery = Array.isArray(item.images) && item.images.length ? item.images : [{ src: item.image || localImageByType[item.tipo], thumb: item.image || localImageByType[item.tipo] }];
  activeGalleryIndex = 0;
  const bairro = item.localizacao?.bairro || 'Araras';
  const placeQuery = `${bairro}, Araras, SP`;
  const encodedPlace = encodeURIComponent(placeQuery);
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodedPlace}`;
  const mapEmbed = `https://maps.google.com/maps?q=${encodedPlace}&output=embed`;
  document.querySelector('#property-detail').innerHTML = `<div class="property-gallery"><div class="gallery-stage"><img class="detail-image" id="gallery-main-image" src="${imageUrl(activeGallery[0].src)}" alt="${escapeHtml(item.titulo)} — foto 1 de ${activeGallery.length}" decoding="async" fetchpriority="high"><button type="button" class="gallery-zoom-button" data-image-zoom aria-label="Abrir foto em tamanho grande">⌕ <span>Ampliar foto</span></button>${activeGallery.length > 1 ? `<button type="button" class="gallery-nav gallery-previous" data-gallery-step="-1" aria-label="Ver foto anterior">‹</button><button type="button" class="gallery-nav gallery-next" data-gallery-step="1" aria-label="Ver próxima foto">›</button><span class="gallery-counter" id="gallery-counter">1 / ${activeGallery.length}</span>` : ''}</div><div class="gallery-thumbnails" aria-label="Fotos do imóvel">${activeGallery.map((photo, index) => `<button type="button" class="gallery-thumb ${index === 0 ? 'active' : ''}" data-gallery-index="${index}" aria-label="Mostrar foto ${index + 1}" aria-pressed="${index === 0}"><img src="${imageUrl(photo.thumb || photo.src)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div></div><div class="eyebrow"><span class="eyebrow-line"></span> ${escapeHtml(typeLabel(item.tipo))} · VENDA · ARARAS</div><h2>${escapeHtml(item.titulo)}</h2><p class="detail-location">⌖ ${escapeHtml(bairro)}, Araras - SP</p><strong class="detail-price">${money(item.preco)}</strong><p class="detail-description">${escapeHtml(item.descricao || 'Consulte a equipe para mais informações sobre este imóvel.')}</p><dl class="detail-specs">${detailRows(item)}</dl><section class="property-map"><div class="map-heading"><div><strong>Localização aproximada</strong><span>${escapeHtml(bairro)} · Araras, SP</span></div><a href="${mapLink}" target="_blank" rel="noopener">Abrir no Google Maps ↗</a></div><iframe src="${mapEmbed}" title="Mapa aproximado de ${escapeHtml(bairro)}, Araras" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><small>O mapa indica o bairro. Para preservar a privacidade, o endereço exato é informado pelo corretor.</small></section>${item.sourceUrl ? `<p class="demo-disclaimer">An\u00fancio e fotos consultados em 23/11/2026. Confirme pre\u00e7o e disponibilidade no site original. <a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">Ver anúncio original ↗</a></p>` : '<p class="demo-disclaimer">Exemplo acadêmico: este imóvel e seus dados são fictícios.</p>'}`;
  configureGalleryZoom();
  detailsDialog.showModal();
}

function configureGalleryZoom() {
  const stage = document.querySelector('.gallery-stage');
  const image = document.querySelector('#gallery-main-image');
  if (!stage || !image) return;
  stage.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const bounds = stage.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
    image.style.transformOrigin = `${x}% ${y}%`;
    stage.classList.add('is-zoomed');
  });
  stage.addEventListener('pointerleave', () => {
    stage.classList.remove('is-zoomed');
    image.style.transformOrigin = 'center';
  });
}

function openImageViewer() {
  const photo = activeGallery[activeGalleryIndex];
  if (!photo) return;
  const image = document.querySelector('#image-viewer-photo');
  image.src = imageUrl(photo.src);
  image.alt = `${selectedProperty.titulo} — foto ${activeGalleryIndex + 1} de ${activeGallery.length}`;
  document.querySelector('#image-viewer-caption').textContent = `${selectedProperty.titulo} · Foto ${activeGalleryIndex + 1} de ${activeGallery.length}`;
  imageViewer.querySelectorAll('[data-image-step]').forEach(button => { button.hidden = activeGallery.length < 2; });
  imageViewer.showModal();
}

function updateGallery(index) {
  if (!activeGallery.length) return;
  activeGalleryIndex = (index + activeGallery.length) % activeGallery.length;
  const photo = activeGallery[activeGalleryIndex];
  const mainImage = document.querySelector('#gallery-main-image');
  if (mainImage) {
    mainImage.src = imageUrl(photo.src);
    mainImage.alt = `${selectedProperty.titulo} — foto ${activeGalleryIndex + 1} de ${activeGallery.length}`;
  }
  const counter = document.querySelector('#gallery-counter');
  if (counter) counter.textContent = `${activeGalleryIndex + 1} / ${activeGallery.length}`;
  const imageViewerPhoto = document.querySelector('#image-viewer-photo');
  if (imageViewer.open && imageViewerPhoto) {
    imageViewerPhoto.src = imageUrl(photo.src);
    imageViewerPhoto.alt = `${selectedProperty.titulo} — foto ${activeGalleryIndex + 1} de ${activeGallery.length}`;
    document.querySelector('#image-viewer-caption').textContent = `${selectedProperty.titulo} · Foto ${activeGalleryIndex + 1} de ${activeGallery.length}`;
  }
  document.querySelectorAll('.gallery-thumb').forEach((button, buttonIndex) => {
    const selected = buttonIndex === activeGalleryIndex;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function renderPropertyPage() {
  const totalPages = Math.max(1, Math.ceil(properties.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = properties.slice(start, start + pageSize);
  grid.innerHTML = pageItems.length ? pageItems.map(propertyCard).join('') : `<div class="empty-state">${favoritesOnly && favorites.size ? 'Nenhum dos seus favoritos corresponde a esses filtros.' : favoritesOnly ? 'Você ainda não favoritou nenhum imóvel.' : 'Não encontramos imóveis com esses filtros. Tente mudar os critérios de busca.'}</div>`;
  pagination.innerHTML = totalPages > 1 ? `<button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior">Anterior</button><span>Página ${currentPage} de ${totalPages}</span><button type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Próxima página">Próxima</button>` : '';
}

function loadProperties(params = {}) {
  properties = filterDemo(catalogProperties().filter(item => item.status !== 'arquivado' && !item.vendido), params);
  const indicator = document.querySelector('#catalogue-note');
  if (indicator) indicator.hidden = false;
  if (favoritesOnly) properties = properties.filter(item => favorites.has(String(item._id)));
  const order = sortOrder.value;
  properties.sort((left, right) => {
    if (order === 'preco-menor') return left.preco - right.preco;
    if (order === 'preco-maior') return right.preco - left.preco;
    return String(right._id).localeCompare(String(left._id), 'pt-BR', { numeric: true });
  });
  currentPage = 1;
  resultsCount.textContent = `${properties.length} ${properties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'} em Araras`;
  renderPropertyPage();
}

document.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => {
  typeSelect.value = button.dataset.type;
  document.querySelectorAll('.filter-chip').forEach(chip => {
    const selected = chip === button;
    chip.classList.toggle('selected', selected);
    chip.setAttribute('aria-pressed', String(selected));
  });
  loadProperties(getValues());
}));
document.querySelector('#favorites-toggle').addEventListener('click', event => {
  favoritesOnly = !favoritesOnly;
  event.currentTarget.classList.toggle('active', favoritesOnly);
  event.currentTarget.setAttribute('aria-pressed', String(favoritesOnly));
  event.currentTarget.textContent = favoritesOnly ? 'Ver todos os imóveis ↗' : 'Ver favoritos ♡';
  loadProperties(getValues());
});
sortOrder.addEventListener('change', () => loadProperties(getValues()));
pagination.addEventListener('click', event => {
  const button = event.target.closest('[data-page]');
  if (!button || button.disabled) return;
  currentPage = Number(button.dataset.page);
  renderPropertyPage();
  document.querySelector('#imoveis').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
searchForm.addEventListener('submit', event => {
  event.preventDefault();
  const values = getValues();
  if (values.preco_min && values.preco_max && Number(values.preco_min) > Number(values.preco_max)) {
    resultsCount.textContent = 'Revise a faixa de preço';
    grid.innerHTML = '<div class="empty-state">O preço mínimo precisa ser menor ou igual ao preço máximo.</div>';
    pagination.innerHTML = '';
    return;
  }
  document.querySelectorAll('.filter-chip').forEach(chip => {
    const selected = chip.dataset.type === (values.tipo || '');
    chip.classList.toggle('selected', selected);
    chip.setAttribute('aria-pressed', String(selected));
  });
  loadProperties(values);
  document.querySelector('#imoveis').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.querySelector('#clear-search').addEventListener('click', () => {
  searchForm.reset();
  document.querySelectorAll('.filter-chip').forEach(chip => {
    const selected = chip.dataset.type === '';
    chip.classList.toggle('selected', selected);
    chip.setAttribute('aria-pressed', String(selected));
  });
  favoritesOnly = false;
  const favoritesButton = document.querySelector('#favorites-toggle');
  favoritesButton.classList.remove('active');
  favoritesButton.setAttribute('aria-pressed', 'false');
  favoritesButton.textContent = 'Ver favoritos ♡';
  loadProperties();
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
    if (favoritesOnly) loadProperties(getValues());
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

detailsDialog.addEventListener('click', event => {
  if (event.target.closest('[data-image-zoom]') || event.target.matches('#gallery-main-image')) openImageViewer();
  const thumbnail = event.target.closest('[data-gallery-index]');
  if (thumbnail) updateGallery(Number(thumbnail.dataset.galleryIndex));
  const step = event.target.closest('[data-gallery-step]');
  if (step) updateGallery(activeGalleryIndex + Number(step.dataset.galleryStep));
});
imageViewer.addEventListener('click', event => {
  if (event.target.closest('[data-image-close]')) imageViewer.close();
  const step = event.target.closest('[data-image-step]');
  if (step) updateGallery(activeGalleryIndex + Number(step.dataset.imageStep));
});
imageViewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') updateGallery(activeGalleryIndex - 1);
  if (event.key === 'ArrowRight') updateGallery(activeGalleryIndex + 1);
});
document.querySelector('#interest-from-detail').addEventListener('click', () => {
  detailsDialog.close();
  leadDialog.showModal();
});
document.querySelectorAll('#open-lead, #open-lead-2').forEach(button => button.addEventListener('click', () => {
  selectedProperty = null;
  leadDialog.showModal();
}));
leadDialog.querySelector('.dialog-close button').addEventListener('click', () => leadDialog.close());
document.querySelector('#lead-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector('#lead-message');
  message.textContent = 'Fluxo demonstrado. Seus dados não foram enviados nem armazenados.';
  message.classList.remove('error');
  message.classList.add('success');
});

populateNeighborhoods();
loadProperties();
