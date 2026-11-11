const typeFields = {
  apartamento: [
    { name: 'andar', label: 'Andar', type: 'number', min: 0 },
    { name: 'valor_condominio', label: 'Condomínio (R$)', type: 'number', min: 0, step: '0.01' },
    { name: 'aceita_pet', label: 'Aceita pets?', type: 'checkbox' },
    { name: 'area_lazer', label: 'Área de lazer', type: 'text', placeholder: 'Piscina, academia…' }
  ],
  casa: [
    { name: 'quintal', label: 'Tem quintal?', type: 'checkbox' },
    { name: 'andares', label: 'Número de andares', type: 'number', min: 1 },
    { name: 'churrasqueira', label: 'Tem churrasqueira?', type: 'checkbox' }
  ],
  casa_condominio: [
    { name: 'quintal', label: 'Tem quintal?', type: 'checkbox' },
    { name: 'andares', label: 'Número de andares', type: 'number', min: 1 },
    { name: 'churrasqueira', label: 'Tem churrasqueira?', type: 'checkbox' }
  ],
  chacara: [
    { name: 'quintal', label: 'Tem área externa?', type: 'checkbox' },
    { name: 'churrasqueira', label: 'Tem churrasqueira?', type: 'checkbox' }
  ],
  comercial: [],
  galpao: [
    { name: 'pe_direito_metros', label: 'Pé-direito (m)', type: 'number', min: 0, step: '0.1' },
    { name: 'docas', label: 'Número de docas', type: 'number', min: 0 },
    { name: 'zoneamento', label: 'Zoneamento', type: 'text', placeholder: 'Industrial' }
  ],
  terreno: [
    { name: 'topografia', label: 'Topografia', type: 'text', placeholder: 'Plano, aclive…' },
    { name: 'declive', label: 'Declive (%)', type: 'number', min: 0, step: '0.1' }
  ]
};
const form = document.querySelector('#property-form');
const typeSelect = document.querySelector('#property-type');
const detailFields = document.querySelector('#detail-fields');
const list = document.querySelector('#admin-property-list');
const message = document.querySelector('#form-message');
const photoInput = document.querySelector('#property-photos');
const photoSelection = document.querySelector('#photo-selection');
const propertyFilter = document.querySelector('#property-filter');
const editPropertyDialog = document.querySelector('#edit-property-dialog');
const livePreview = document.querySelector('#admin-live-preview');
const carouselDialog = document.querySelector('#carousel-dialog');
const carouselCanvas = document.querySelector('#carousel-canvas');
const carouselContext = carouselCanvas.getContext('2d');
let carouselProperty = null;
let carouselPhotos = [];
let carouselSlideIndex = 0;
let editingId = null;
let livePreviewPhotoUrls = [];
let livePreviewGalleryIndex = 0;
const propertiesKey = 'bartarin-properties-v4';
function readProperties() {
  try {
    const saved = JSON.parse(localStorage.getItem(propertiesKey) || 'null');
    if (Array.isArray(saved)) return saved;
  } catch { localStorage.removeItem(propertiesKey); }
  const initial = structuredClone(window.BartarinDemoProperties || []);
  localStorage.setItem(propertiesKey, JSON.stringify(initial));
  return initial;
}
let properties = readProperties();
function saveProperties() { localStorage.setItem(propertiesKey, JSON.stringify(properties)); }
const formatMoney = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
const typeLabel = type => ({ apartamento: 'Apartamento', casa: 'Casa', casa_condominio: 'Casa em condomínio', chacara: 'Chácara', comercial: 'Sala comercial', galpao: 'Galpão', terreno: 'Terreno' }[type] || type);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function renderDetailFields(values = {}) {
  const type = typeSelect.value;
  document.querySelector('#detail-hint').textContent = typeLabel(type);
  detailFields.innerHTML = typeFields[type].map(field => {
    const id = `detail-${field.name}`;
    if (field.type === 'checkbox') return `<label class="check-field" for="${id}"><input id="${id}" name="${field.name}" type="checkbox" ${values[field.name] ? 'checked' : ''}><span>${field.label}</span></label>`;
    return `<label for="${id}">${field.label}<input id="${id}" name="${field.name}" type="${field.type}" ${field.min !== undefined ? `min="${field.min}"` : ''} ${field.step ? `step="${field.step}"` : ''} ${field.placeholder ? `placeholder="${field.placeholder}"` : ''} value="${values[field.name] ?? ''}"></label>`;
  }).join('');
}

function readPayload() {
  const data = new FormData(form);
  const tipo = data.get('tipo');
  const detalhes = {};
  for (const field of typeFields[tipo]) {
    const input = form.elements.namedItem(field.name);
    if (field.type === 'checkbox') detalhes[field.name] = input.checked;
    else if (input.value !== '') detalhes[field.name] = field.name === 'area_lazer' ? input.value.split(',').map(value => value.trim()).filter(Boolean) : input.value;
  }
  return {
    titulo: data.get('titulo'), tipo, finalidade: 'venda', preco: data.get('preco'),
    cidade: data.get('cidade'), bairro: data.get('bairro'), uf: data.get('uf'),
    descricao: data.get('descricao'), detalhes
  };
}

function clearMessage() { if (message) { message.textContent = ''; message.classList.remove('error'); } }
function showMessage(text, isError = false) {
  if (!message) {
    if (isError) window.alert(text);
    return;
  }
  message.textContent = text;
  message.classList.toggle('error', isError);
}

function resetForm() {
  livePreviewPhotoUrls.forEach(url => URL.revokeObjectURL(url));
  livePreviewPhotoUrls = [];
  livePreviewGalleryIndex = 0;
  editingId = null;
  form.reset();
  form.elements.namedItem('cidade').value = 'Araras';
  form.elements.namedItem('uf').value = 'SP';
  typeSelect.value = 'apartamento';
  photoSelection.textContent = 'Nenhuma foto selecionada';
  renderDetailFields();
  document.querySelector('#form-title').textContent = 'Novo imóvel';
  document.querySelector('#submit-label').textContent = 'Cadastrar imóvel';
  document.querySelector('#cancel-edit').classList.add('hidden');
  clearMessage();
  editPropertyDialog?.close();
}

function startEdit(item) {
  livePreviewPhotoUrls.forEach(url => URL.revokeObjectURL(url));
  livePreviewPhotoUrls = [];
  livePreviewGalleryIndex = 0;
  editingId = item._id;
  form.elements.namedItem('titulo').value = item.titulo || '';
  typeSelect.value = item.tipo;
  form.elements.namedItem('preco').value = item.preco || '';
  form.elements.namedItem('cidade').value = item.localizacao?.cidade || '';
  form.elements.namedItem('bairro').value = item.localizacao?.bairro || '';
  form.elements.namedItem('uf').value = item.localizacao?.uf || '';
  form.elements.namedItem('descricao').value = item.descricao || '';
  photoInput.value = '';
  const photoCount = Array.isArray(item.images) ? item.images.length : (item.image ? 1 : 0);
  photoSelection.textContent = photoCount ? `${photoCount} ${photoCount === 1 ? 'foto cadastrada' : 'fotos cadastradas'} · selecione novas para substituir` : 'Nenhuma foto cadastrada';
  renderDetailFields(item.detalhes || {});
  document.querySelector('#form-title').textContent = 'Editar imóvel';
  document.querySelector('#submit-label').textContent = 'Salvar alterações';
  document.querySelector('#cancel-edit').classList.remove('hidden');
  clearMessage();
  renderLivePreview();
  editPropertyDialog?.showModal();
}

function startCreate() {
  resetForm();
  document.querySelector('#form-title').textContent = 'Novo imóvel';
  document.querySelector('#submit-label').textContent = 'Cadastrar imóvel';
  document.querySelector('#cancel-edit').classList.remove('hidden');
  renderLivePreview();
  editPropertyDialog?.showModal();
}

function propertyCard(item) {
  const location = [item.localizacao?.bairro, item.localizacao?.cidade].filter(Boolean).join(', ');
  const firstPhoto = item.images?.[0]?.thumb || item.images?.[0]?.src || item.image || '';
  const thumbnail = firstPhoto
    ? `<img src="${escapeHtml(firstPhoto)}" alt="Miniatura de ${escapeHtml(item.titulo)}" loading="lazy">`
    : '<span>Sem imagem</span>';
  return `<article class="admin-property"><div class="admin-property-thumb">${thumbnail}</div><div class="admin-property-info"><span class="admin-property-type">${escapeHtml(typeLabel(item.tipo))} · Venda</span><h3>${escapeHtml(item.titulo)}</h3><p>${escapeHtml(location)} · ${formatMoney(item.preco)}</p></div><div class="admin-property-actions"><button class="quiet-button carousel-property" data-id="${escapeHtml(item._id)}" type="button" aria-label="Criar carrossel" title="Criar carrossel"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="15" height="15" rx="2"/><path d="m7 15 3-3 4 4 2-2 2 2"/><path d="M7 9h.01"/><path d="M8 2h11a3 3 0 0 1 3 3v11"/></svg></button><button class="quiet-button edit-property" data-id="${escapeHtml(item._id)}" type="button" aria-label="Editar imóvel" title="Editar imóvel"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg></button><button class="quiet-button archive-property" data-id="${escapeHtml(item._id)}" type="button" aria-label="Arquivar imóvel" title="Arquivar imóvel"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M5 7l1 14h12l1-14"/><path d="M9 11v6M15 11v6"/><path d="M8 7V3h8v4"/></svg></button></div></article>`;
}

function renderLivePreview() {
  if (!form || !livePreview) return;
  const current = properties.find(property => String(property._id) === String(editingId)) || {};
  const data = new FormData(form);
  const title = data.get('titulo') || 'Título do imóvel';
  const type = data.get('tipo') || current.tipo || 'casa';
  const price = Number(data.get('preco')) || 0;
  const city = data.get('cidade') || 'Araras';
  const neighborhood = data.get('bairro') || 'Bairro';
  const state = data.get('uf') || 'SP';
  const description = data.get('descricao') || 'A descrição do imóvel aparecerá aqui para o cliente.';
  const savedPhotos = current.images || (current.image ? [{ src: current.image, thumb: current.image }] : []);
  const photos = livePreviewPhotoUrls.length
    ? livePreviewPhotoUrls.map(src => ({ src, thumb: src }))
    : savedPhotos;
  livePreviewGalleryIndex = Math.min(livePreviewGalleryIndex, Math.max(0, photos.length - 1));
  const mainPhoto = photos[livePreviewGalleryIndex]?.src || photos[livePreviewGalleryIndex]?.thumb || '';
  const image = mainPhoto
    ? `<img class="detail-image" src="${escapeHtml(mainPhoto)}" alt="${escapeHtml(title)} — foto ${livePreviewGalleryIndex + 1} de ${photos.length}">`
    : '<div class="live-preview-empty">A foto principal aparecerá aqui</div>';
  const details = typeFields[type].map(field => {
    const input = form.elements.namedItem(field.name);
    if (!input) return '';
    const value = field.type === 'checkbox' ? (input.checked ? 'Sim' : 'Não') : input.value;
    return value ? `<div><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(value)}</dd></div>` : '';
  }).join('');
  const encodedPlace = encodeURIComponent(`${neighborhood}, ${city}, ${state}`);
  const galleryControls = photos.length > 1 ? `<button type="button" class="gallery-nav gallery-previous" data-live-gallery-step="-1" aria-label="Foto anterior">‹</button><button type="button" class="gallery-nav gallery-next" data-live-gallery-step="1" aria-label="Próxima foto">›</button><span class="gallery-counter">${livePreviewGalleryIndex + 1} / ${photos.length}</span>` : '';
  const thumbnails = photos.map((photo, index) => `<button type="button" class="gallery-thumb ${index === livePreviewGalleryIndex ? 'active' : ''}" data-live-gallery-index="${index}" aria-label="Mostrar foto ${index + 1}"><img src="${escapeHtml(photo.thumb || photo.src)}" alt=""></button>`).join('');
  livePreview.innerHTML = `<div class="property-gallery"><div class="gallery-stage">${image}${mainPhoto ? '<button type="button" class="gallery-zoom-button" tabindex="-1">⌕ <span>Ampliar foto</span></button>' : ''}${galleryControls}</div>${photos.length ? `<div class="gallery-thumbnails">${thumbnails}</div>` : ''}</div><div class="admin-public-detail"><div class="eyebrow"><span class="eyebrow-line"></span> ${escapeHtml(typeLabel(type))} · VENDA · ${escapeHtml(city).toUpperCase()}</div><h2>${escapeHtml(title)}</h2><p class="detail-location">⌖ ${escapeHtml(neighborhood)}, ${escapeHtml(city)} - ${escapeHtml(state)}</p><strong class="detail-price">${formatMoney(price)}</strong><p class="detail-description">${escapeHtml(description)}</p>${details ? `<dl class="detail-specs">${details}</dl>` : ''}<section class="property-map"><div class="map-heading"><div><strong>Localização aproximada</strong><span>${escapeHtml(neighborhood)} · ${escapeHtml(city)}, ${escapeHtml(state)}</span></div><a href="https://www.google.com/maps/search/?api=1&query=${encodedPlace}" target="_blank" rel="noopener">Abrir no Google Maps ↗</a></div><iframe src="https://maps.google.com/maps?q=${encodedPlace}&output=embed" title="Mapa aproximado de ${escapeHtml(neighborhood)}" loading="lazy"></iframe><small>O mapa indica o bairro. Para preservar a privacidade, o endereço exato é informado pelo corretor.</small></section></div>`;
}

function refreshProperties() {
  properties = readProperties();
  const keyword = normalizeSearch(propertyFilter?.value || '');
  const active = properties.filter(item => item.status !== 'arquivado');
  const filtered = keyword ? active.filter(item => searchableProperty(item).includes(keyword)) : active;
  list.innerHTML = filtered.length
    ? filtered.map(propertyCard).join('')
    : `<div class="admin-empty">${keyword ? 'Nenhum imóvel encontrado para esta palavra-chave.' : 'Nenhum imóvel ativo nesta demonstração.'}</div>`;
}

function normalizeSearch(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function searchableProperty(item) {
  const values = [];
  const collect = (value, key = '') => {
    if (['image', 'images', 'src', 'thumb'].includes(key)) return;
    if (Array.isArray(value)) value.forEach(entry => collect(entry, key));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([childKey, childValue]) => collect(childValue, childKey));
    else values.push(value);
  };
  collect(item);
  values.push(typeLabel(item.tipo), formatMoney(item.preco));
  return normalizeSearch(values.join(' '));
}

typeSelect?.addEventListener('change', () => renderDetailFields());
form?.addEventListener('input', renderLivePreview);
form?.addEventListener('change', renderLivePreview);
photoInput?.addEventListener('change', () => {
  const selected = [...photoInput.files];
  if (selected.length > 8) {
    showMessage('Escolha no máximo 8 fotos por imóvel.', true);
    photoInput.value = '';
    photoSelection.textContent = 'Nenhuma foto selecionada';
    return;
  }
  livePreviewPhotoUrls.forEach(url => URL.revokeObjectURL(url));
  livePreviewPhotoUrls = selected.map(file => URL.createObjectURL(file));
  livePreviewGalleryIndex = 0;
  renderLivePreview();
  photoSelection.textContent = selected.length ? `${selected.length} ${selected.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}` : 'Nenhuma foto selecionada';
  clearMessage();
});
document.querySelector('#cancel-edit')?.addEventListener('click', resetForm);
document.querySelector('#close-property-editor')?.addEventListener('click', resetForm);
editPropertyDialog?.addEventListener('click', event => { if (event.target === editPropertyDialog) resetForm(); });
livePreview?.addEventListener('click', event => {
  const thumbnail = event.target.closest('[data-live-gallery-index]');
  const stepButton = event.target.closest('[data-live-gallery-step]');
  if (thumbnail) livePreviewGalleryIndex = Number(thumbnail.dataset.liveGalleryIndex);
  else if (stepButton) {
    const count = livePreview.querySelectorAll('[data-live-gallery-index]').length;
    livePreviewGalleryIndex = (livePreviewGalleryIndex + Number(stepButton.dataset.liveGalleryStep) + count) % count;
  } else return;
  renderLivePreview();
});
document.querySelector('#refresh-list').addEventListener('click', refreshProperties);
document.querySelector('#add-property')?.addEventListener('click', startCreate);
propertyFilter?.addEventListener('input', refreshProperties);
document.querySelector('#close-carousel').addEventListener('click', () => carouselDialog.close());
carouselDialog.addEventListener('click', event => { if (event.target === carouselDialog) carouselDialog.close(); });
document.querySelector('#carousel-previous').addEventListener('click', () => showCarouselSlide(carouselSlideIndex - 1));
document.querySelector('#carousel-next').addEventListener('click', () => showCarouselSlide(carouselSlideIndex + 1));
document.querySelector('#download-carousel-slide').addEventListener('click', downloadCarouselSlide);

function blobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível preparar uma das fotos.'));
    reader.readAsDataURL(blob);
  });
}

function canvasBlob(canvas, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('O navegador não conseguiu compactar uma das fotos.')), 'image/webp', quality));
}

function loadLocalPhoto(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = async () => {
      try {
        const scale = Math.min(1, 2048 / image.naturalWidth, 2048 / image.naturalHeight);
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = width;
        fullCanvas.height = height;
        fullCanvas.getContext('2d').drawImage(image, 0, 0, width, height);
        const full = await canvasBlob(fullCanvas, 0.92);
        const thumbScale = Math.min(1, 520 / image.naturalWidth, 520 / image.naturalHeight);
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = Math.max(1, Math.round(image.naturalWidth * thumbScale));
        thumbCanvas.height = Math.max(1, Math.round(image.naturalHeight * thumbScale));
        thumbCanvas.getContext('2d').drawImage(image, 0, 0, thumbCanvas.width, thumbCanvas.height);
        const thumb = await canvasBlob(thumbCanvas, 0.74);
        resolve({ src: await blobAsDataUrl(full), thumb: await blobAsDataUrl(thumb) });
      } catch (error) { reject(error); }
      finally { URL.revokeObjectURL(objectUrl); }
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error(`Não foi possível abrir a foto “${file.name}”.`)); };
    image.src = objectUrl;
  });
}

function preparePayload(payload, uploadedPhotos) {
  const current = editingId ? properties.find(property => String(property._id) === String(editingId)) : null;
  const images = uploadedPhotos.length ? uploadedPhotos : (current?.images || (current?.image ? [{ src: current.image, thumb: current.image }] : []));
  return {
    ...payload,
    preco: Number(payload.preco),
    localizacao: { cidade: payload.cidade, bairro: payload.bairro, uf: payload.uf },
    ...(images.length ? { images, image: images[0].src } : {})
  };
}
form?.addEventListener('submit', async event => {
  event.preventDefault();
  clearMessage();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.querySelector('span').textContent = photoInput.files.length ? 'Otimizando fotos…' : 'Salvando…';
  try {
    const payload = readPayload();
    const uploadedPhotos = await Promise.all([...photoInput.files].map(loadLocalPhoto));
    if (!editingId && !uploadedPhotos.length) throw new Error('Adicione pelo menos uma foto para cadastrar o imóvel e montar o carrossel.');
    const prepared = preparePayload(payload, uploadedPhotos);
    if (editingId) {
      const index = properties.findIndex(property => String(property._id) === String(editingId));
      if (index < 0) throw new Error('Imóvel não encontrado nesta demonstração.');
      properties[index] = { ...properties[index], ...prepared, status: 'ativo' };
    } else {
      properties.unshift({ ...prepared, _id: `demo-${Date.now()}`, status: 'ativo' });
    }
    saveProperties();
    const successMessage = editingId ? 'Alterações salvas.' : 'Imóvel cadastrado.';
    resetForm();
    refreshProperties();
    showMessage(successMessage);
  } catch (error) { showMessage(error.message, true); }
  finally {
    submitButton.disabled = false;
    submitButton.querySelector('span').textContent = editingId ? 'Salvar alterações' : 'Cadastrar imóvel';
  }
});
list.addEventListener('click', async event => {
  const editButton = event.target.closest('.edit-property');
  if (editButton) {
    const item = properties.find(property => String(property._id) === editButton.dataset.id);
    if (item && form) startEdit(item);
    else if (item) window.alert('A edição do imóvel será aberta em uma nova tela.');
    return;
  }
  const carouselButton = event.target.closest('.carousel-property');
  if (carouselButton) {
    const item = properties.find(property => String(property._id) === carouselButton.dataset.id);
    if (item) await openCarousel(item);
    return;
  }
  const archiveButton = event.target.closest('.archive-property');
  if (!archiveButton) return;
  if (!confirm('Arquivar este imóvel nesta demonstração?')) return;
  const property = properties.find(item => String(item._id) === String(archiveButton.dataset.id));
  if (property) property.status = 'arquivado';
  saveProperties();
  refreshProperties();
});

if (form) renderDetailFields();
refreshProperties();

function propertyPhotos(item) {
  const photos = Array.isArray(item.images) && item.images.length ? item.images : (item.image ? [{ src: item.image, thumb: item.image }] : []);
  return photos.filter(photo => photo?.src).slice(0, 8);
}

function carouselImageUrl(url) {
  if (url.startsWith('data:') || url.startsWith('/')) return url;
  return `/_image?url=${encodeURIComponent(url)}`;
}

function loadCarouselImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Uma foto não carregou. Confira sua conexão e tente novamente.'));
    image.src = carouselImageUrl(url);
  });
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || '').split(/\s+/);
  let line = '';
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      context.fillText(line, x, y);
      y += lineHeight;
      line = word;
      if (++lines >= maxLines) { line = ''; break; }
    } else line = test;
  }
  if (line) context.fillText(line, x, y);
}

function drawCover(image) {
  const ctx = carouselContext;
  ctx.fillStyle = '#f4f3ec';
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1080, 855);
  ctx.clip();
  const scale = Math.max(1080 / image.width, 855 / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  ctx.drawImage(image, (1080 - width) / 2, (855 - height) / 2, width, height);
  ctx.restore();
  const gradient = ctx.createLinearGradient(0, 530, 0, 855);
  gradient.addColorStop(0, '#13231a00');
  gradient.addColorStop(1, '#13231ad9');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 530, 1080, 325);
  ctx.fillStyle = '#fff';
  ctx.font = '600 24px Arial';
  ctx.fillText('BARTARIN  ·  IMÓVEIS', 72, 740);
  ctx.font = '500 17px Arial';
  ctx.fillText(`${carouselProperty.localizacao?.bairro || 'Araras'}  ·  ARARAS, SP`, 72, 790);
  ctx.fillStyle = '#f4f3ec';
  ctx.font = '700 19px Arial';
  ctx.fillText('À VENDA', 72, 918);
  ctx.fillStyle = '#283d31';
  ctx.font = '700 44px Georgia';
  wrapCanvasText(ctx, carouselProperty.titulo, 72, 982, 920, 54, 2);
  ctx.fillStyle = '#718576';
  roundedRect(ctx, 72, 1110, 520, 112, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 40px Arial';
  ctx.fillText(formatMoney(carouselProperty.preco), 100, 1180);
  ctx.font = '500 18px Arial';
  ctx.fillStyle = '#718576';
  ctx.fillText('Conheça este imóvel', 72, 1280);
  ctx.fillStyle = '#b2a382';
  ctx.fillRect(930, 1262, 78, 2);
}

function drawPhotoSlide(image, slideNumber, slideTotal) {
  const ctx = carouselContext;
  ctx.fillStyle = '#f4f3ec';
  ctx.fillRect(0, 0, 1080, 1350);
  const scale = Math.max(1080 / image.width, 1010 / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1080, 1010);
  ctx.clip();
  ctx.drawImage(image, (1080 - width) / 2, (1010 - height) / 2, width, height);
  ctx.restore();
  const gradient = ctx.createLinearGradient(0, 720, 0, 1010);
  gradient.addColorStop(0, '#13231a00');
  gradient.addColorStop(1, '#13231ac9');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 720, 1080, 290);
  ctx.fillStyle = '#fff';
  ctx.font = '600 20px Arial';
  ctx.fillText('BARTARIN  ·  IMÓVEIS', 64, 930);
  ctx.fillStyle = '#283d31';
  ctx.font = '700 34px Georgia';
  wrapCanvasText(ctx, carouselProperty.titulo, 64, 1090, 840, 44, 2);
  ctx.fillStyle = '#758b76';
  ctx.font = '600 20px Arial';
  ctx.fillText(`${carouselProperty.localizacao?.bairro || 'Araras'}  ·  ${formatMoney(carouselProperty.preco)}`, 64, 1205);
  ctx.fillStyle = '#8b9388';
  ctx.font = '500 18px Arial';
  ctx.fillText(`DETALHES DO IMÓVEL  ·  ${String(slideNumber).padStart(2, '0')} / ${String(slideTotal).padStart(2, '0')}`, 64, 1290);
}

function drawFinalSlide(slideNumber, slideTotal) {
  const ctx = carouselContext;
  ctx.fillStyle = '#718576';
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = '#ffffff1c';
  roundedRect(ctx, 58, 65, 964, 1220, 28);
  ctx.fill();
  ctx.fillStyle = '#f4f3ec';
  ctx.font = '600 22px Arial';
  ctx.fillText('BARTARIN  ·  IMÓVEIS', 104, 170);
  ctx.fillStyle = '#fff';
  ctx.font = '700 66px Georgia';
  wrapCanvasText(ctx, 'Seu próximo capítulo pode começar aqui.', 104, 395, 820, 80, 3);
  ctx.fillStyle = '#e9eee8';
  ctx.font = '500 27px Arial';
  wrapCanvasText(ctx, `Imóvel à venda em ${carouselProperty.localizacao?.bairro || 'Araras'}, Araras.`, 104, 720, 800, 42, 2);
  ctx.fillStyle = '#fff';
  roundedRect(ctx, 104, 870, 680, 92, 12);
  ctx.fill();
  ctx.fillStyle = '#435a49';
  ctx.font = '700 25px Arial';
  ctx.fillText('AGENDE SUA VISITA COM NOSSA EQUIPE', 138, 927);
  ctx.fillStyle = '#e9eee8';
  ctx.font = '500 21px Arial';
  ctx.fillText('Bartarin Imóveis  ·  Araras, SP', 104, 1080);
  ctx.fillStyle = '#e9eee8';
  ctx.font = '500 18px Arial';
  ctx.fillText(`REF. ${carouselProperty.reference || 'Consulte'}`, 104, 1160);
  ctx.fillText(`CONTATO  ·  ${String(slideNumber).padStart(2, '0')} / ${String(slideTotal).padStart(2, '0')}`, 104, 1240);
}

async function drawCarouselSlide(index) {
  const slideTotal = carouselPhotos.length + 2;
  carouselSlideIndex = (index + slideTotal) % slideTotal;
  const status = document.querySelector('#carousel-status');
  status.textContent = 'Preparando imagem…';
  try {
    if (carouselSlideIndex === 0) drawCover(await loadCarouselImage(carouselPhotos[0].src));
    else if (carouselSlideIndex === slideTotal - 1) drawFinalSlide(slideTotal, slideTotal);
    else drawPhotoSlide(await loadCarouselImage(carouselPhotos[carouselSlideIndex - 1].src), carouselSlideIndex + 1, slideTotal);
    document.querySelector('#carousel-counter').textContent = `Slide ${carouselSlideIndex + 1} de ${slideTotal}`;
    document.querySelector('#carousel-previous').disabled = carouselSlideIndex === 0;
    document.querySelector('#carousel-next').disabled = carouselSlideIndex === slideTotal - 1;
    status.textContent = 'Prévia pronta · formato 1080 × 1350';
  } catch (error) {
    status.textContent = error.message;
    showMessage(`${error.message} Se estiver sem conexão, tente novamente mais tarde.`, true);
  }
}

async function showCarouselSlide(index) {
  await drawCarouselSlide(index);
}

async function openCarousel(item) {
  carouselProperty = item;
  carouselPhotos = propertyPhotos(item);
  if (!carouselPhotos.length) {
    showMessage('Adicione fotos ao imóvel para criar o carrossel.', true);
    return;
  }
  carouselSlideIndex = 0;
  carouselDialog.showModal();
  await drawCarouselSlide(0);
}

function downloadCarouselSlide() {
  carouselCanvas.toBlob(blob => {
    if (!blob) {
      document.querySelector('#carousel-status').textContent = 'Não foi possível exportar a arte. Tente carregar o slide novamente.';
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const title = (carouselProperty.titulo || 'imovel').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    anchor.href = url;
    anchor.download = `bartarin-${title}-slide-${String(carouselSlideIndex + 1).padStart(2, '0')}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
