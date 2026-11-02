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
const carouselDialog = document.querySelector('#carousel-dialog');
const carouselCanvas = document.querySelector('#carousel-canvas');
const carouselContext = carouselCanvas.getContext('2d');
let carouselProperty = null;
let carouselPhotos = [];
let carouselSlideIndex = 0;
let editingId = null;
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

function clearMessage() { message.textContent = ''; message.classList.remove('error'); }
function showMessage(text, isError = false) { message.textContent = text; message.classList.toggle('error', isError); }

function resetForm() {
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
}

function startEdit(item) {
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function propertyCard(item) {
  const location = [item.localizacao?.bairro, item.localizacao?.cidade].filter(Boolean).join(', ');
  return `<article class="admin-property"><div class="admin-property-info"><span class="admin-property-type">${escapeHtml(typeLabel(item.tipo))} · Venda</span><h3>${escapeHtml(item.titulo)}</h3><p>${escapeHtml(location)} · ${formatMoney(item.preco)}</p></div><div class="admin-property-actions"><button class="quiet-button carousel-property" data-id="${escapeHtml(item._id)}" type="button">Criar carrossel</button><button class="quiet-button edit-property" data-id="${escapeHtml(item._id)}" type="button">Editar</button><button class="quiet-button archive-property" data-id="${escapeHtml(item._id)}" type="button">Arquivar</button></div></article>`;
}

function refreshProperties() {
  properties = readProperties();
  const active = properties.filter(item => item.status !== 'arquivado');
  list.innerHTML = active.length ? active.map(propertyCard).join('') : '<div class="admin-empty">Nenhum imóvel ativo nesta demonstração.</div>';
}

typeSelect.addEventListener('change', () => renderDetailFields());
photoInput.addEventListener('change', () => {
  const selected = [...photoInput.files];
  if (selected.length > 8) {
    showMessage('Escolha no máximo 8 fotos por imóvel.', true);
    photoInput.value = '';
    photoSelection.textContent = 'Nenhuma foto selecionada';
    return;
  }
  photoSelection.textContent = selected.length ? `${selected.length} ${selected.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}` : 'Nenhuma foto selecionada';
  clearMessage();
});
document.querySelector('#cancel-edit').addEventListener('click', resetForm);
document.querySelector('#refresh-list').addEventListener('click', refreshProperties);
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
form.addEventListener('submit', async event => {
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
    const item = properties.find(property => property._id === editButton.dataset.id);
    if (item) startEdit(item);
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

renderDetailFields();
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
