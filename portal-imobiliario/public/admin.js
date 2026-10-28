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
let editingId = null;
const propertiesKey = 'bartarin-properties';
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
const typeLabel = type => ({ apartamento: 'Apartamento', casa: 'Casa', galpao: 'Comercial / Galpão', terreno: 'Terreno' }[type] || type);
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
    titulo: data.get('titulo'), tipo, finalidade: data.get('finalidade'), preco: data.get('preco'),
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
  form.elements.namedItem('finalidade').value = item.finalidade || 'venda';
  form.elements.namedItem('preco').value = item.preco || '';
  form.elements.namedItem('cidade').value = item.localizacao?.cidade || '';
  form.elements.namedItem('bairro').value = item.localizacao?.bairro || '';
  form.elements.namedItem('uf').value = item.localizacao?.uf || '';
  form.elements.namedItem('descricao').value = item.descricao || '';
  renderDetailFields(item.detalhes || {});
  document.querySelector('#form-title').textContent = 'Editar imóvel';
  document.querySelector('#submit-label').textContent = 'Salvar alterações';
  document.querySelector('#cancel-edit').classList.remove('hidden');
  clearMessage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function propertyCard(item) {
  const location = [item.localizacao?.bairro, item.localizacao?.cidade].filter(Boolean).join(', ');
  return `<article class="admin-property"><div class="admin-property-info"><span class="admin-property-type">${escapeHtml(typeLabel(item.tipo))} · ${item.finalidade === 'locacao' ? 'Locação' : 'Venda'}</span><h3>${escapeHtml(item.titulo)}</h3><p>${escapeHtml(location)} · ${formatMoney(item.preco)}</p></div><div class="admin-property-actions"><button class="quiet-button edit-property" data-id="${escapeHtml(item._id)}" type="button">Editar</button><button class="quiet-button archive-property" data-id="${escapeHtml(item._id)}" type="button">Arquivar</button></div></article>`;
}

function refreshProperties() {
  properties = readProperties();
  const active = properties.filter(item => item.status !== 'arquivado');
  list.innerHTML = active.length ? active.map(propertyCard).join('') : '<div class="admin-empty">Nenhum imóvel ativo nesta demonstração.</div>';
}

typeSelect.addEventListener('change', () => renderDetailFields());
document.querySelector('#cancel-edit').addEventListener('click', resetForm);
document.querySelector('#refresh-list').addEventListener('click', refreshProperties);
form.addEventListener('submit', async event => {
  event.preventDefault();
  clearMessage();
  try {
    const payload = readPayload();
    if (editingId) {
      const index = properties.findIndex(property => String(property._id) === String(editingId));
      if (index < 0) throw new Error('Imóvel não encontrado nesta demonstração.');
      properties[index] = { ...properties[index], ...payload, preco: Number(payload.preco), localizacao: { cidade: payload.cidade, bairro: payload.bairro, uf: payload.uf }, status: 'ativo' };
    } else {
      properties.unshift({ ...payload, _id: `demo-${Date.now()}`, preco: Number(payload.preco), localizacao: { cidade: payload.cidade, bairro: payload.bairro, uf: payload.uf }, status: 'ativo', image: 'photo-1600585154340-be6161a56a0c' });
    }
    saveProperties();
    const successMessage = editingId ? 'Alterações salvas.' : 'Imóvel cadastrado.';
    resetForm();
    refreshProperties();
    showMessage(successMessage);
  } catch (error) { showMessage(error.message, true); }
});
list.addEventListener('click', async event => {
  const editButton = event.target.closest('.edit-property');
  if (editButton) {
    const item = properties.find(property => property._id === editButton.dataset.id);
    if (item) startEdit(item);
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
