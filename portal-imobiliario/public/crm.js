const seedLeads = window.BartarinDemoLeads || [];
const stageNames = { novo: 'Novo', em_atendimento: 'Em atendimento', visita_agendada: 'Visita agendada', convertido: 'Convertido', perdido: 'Encerrado' };
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
let leads = [...seedLeads];
try {
  const savedLeads = JSON.parse(localStorage.getItem('bartarin-demo-leads') || 'null');
  if (Array.isArray(savedLeads)) leads = savedLeads;
} catch { localStorage.removeItem('bartarin-demo-leads'); }
let selectedId = leads[0].id;
let activeStage = 'todos';
function saveDemoLeads() { localStorage.setItem('bartarin-demo-leads', JSON.stringify(leads)); }

function renderMetrics() {
  document.querySelector('#metric-total').textContent = leads.length;
  document.querySelector('#metric-new').textContent = leads.filter(lead => lead.etapa === 'novo').length;
  document.querySelector('#metric-visits').textContent = leads.filter(lead => lead.etapa === 'visita_agendada').length;
  document.querySelector('#metric-working').textContent = leads.filter(lead => lead.etapa === 'em_atendimento').length;
  document.querySelector('#sidebar-lead-count').textContent = leads.length;
}

function renderList() {
  const term = document.querySelector('#lead-search').value.trim().toLowerCase();
  const visible = leads.filter(lead => (activeStage === 'todos' || lead.etapa === activeStage) && `${lead.nome} ${lead.email} ${lead.interesse}`.toLowerCase().includes(term));
  document.querySelector('#lead-list').innerHTML = visible.length ? visible.map(lead => `<button class="lead-row ${lead.id === selectedId ? 'selected' : ''}" data-lead-id="${escapeHtml(lead.id)}"><span class="lead-avatar">${escapeHtml(lead.nome.split(' ').map(part => part[0]).slice(0, 2).join(''))}</span><span class="lead-main"><strong>${escapeHtml(lead.nome)}</strong><small>${escapeHtml(lead.interesse)}</small></span><span class="lead-row-meta"><i class="stage-dot stage-${escapeHtml(lead.etapa)}"></i><small>${escapeHtml(stageNames[lead.etapa])}</small><time>${escapeHtml(lead.atualizado)}</time></span></button>`).join('') : '<p class="crm-empty">Nenhum contato corresponde à busca.</p>';
  if (visible.length && !visible.some(lead => lead.id === selectedId)) selectedId = visible[0].id;
  renderDetail();
}

function renderDetail() {
  const lead = leads.find(item => item.id === selectedId);
  const target = document.querySelector('#lead-detail');
  const heading = document.querySelector('#lead-detail-heading');
  if (!lead) { heading.textContent = 'Selecione um lead'; target.innerHTML = '<p class="lead-detail-empty">Escolha uma pessoa na lista para ver etapa e histórico de atendimento.</p>'; return; }
  heading.textContent = lead.nome;
  target.innerHTML = `<div class="lead-profile"><span class="lead-avatar large">${escapeHtml(lead.nome.split(' ').map(part => part[0]).slice(0, 2).join(''))}</span><div><h3>${escapeHtml(lead.nome)}</h3><p>${escapeHtml(lead.interesse)}</p></div></div><div class="lead-contact-lines"><a href="mailto:${escapeHtml(lead.email)}">✉ ${escapeHtml(lead.email)}</a><a href="tel:${escapeHtml(lead.telefone.replace(/[^\d+]/g, ''))}">⌕ ${escapeHtml(lead.telefone)}</a></div><label class="stage-select-label">ETAPA ATUAL<select id="stage-select">${Object.entries(stageNames).map(([value, label]) => `<option value="${value}" ${lead.etapa === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><div class="history-heading"><span class="panel-kicker">HISTÓRICO DE CONTATO</span><span>${lead.historico.length} registros</span></div><div class="history-list">${lead.historico.map(entry => `<article class="history-entry"><i></i><div><time>${escapeHtml(entry.data)}</time><p>${escapeHtml(entry.texto)}</p></div></article>`).join('')}</div><form id="note-form" class="note-form"><label for="lead-note">Adicionar observação</label><textarea id="lead-note" rows="3" maxlength="300" placeholder="Anote o próximo passo ou resumo do contato..."></textarea><button class="button button-dark" type="submit">Adicionar ao histórico <span>↗</span></button></form>`;
  document.querySelector('#stage-select').addEventListener('change', event => {
    lead.etapa = event.target.value;
    lead.atualizado = 'Agora';
    lead.historico.unshift({ data: 'Agora', texto: `Etapa atualizada para “${stageNames[lead.etapa]}”.` });
    saveDemoLeads();
    renderMetrics(); renderList();
  });
  document.querySelector('#note-form').addEventListener('submit', event => {
    event.preventDefault();
    const textarea = event.currentTarget.querySelector('textarea');
    if (!textarea.value.trim()) return;
    lead.historico.unshift({ data: 'Agora', texto: textarea.value.trim() });
    lead.atualizado = 'Agora';
    saveDemoLeads();
    renderList();
  });
}

document.querySelectorAll('.lead-filter').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.lead-filter').forEach(item => item.classList.toggle('active', item === button));
  activeStage = button.dataset.stage;
  renderList();
}));
document.querySelector('#lead-search').addEventListener('input', renderList);
document.querySelector('#lead-list').addEventListener('click', event => {
  const row = event.target.closest('[data-lead-id]');
  if (!row) return;
  selectedId = row.dataset.leadId;
  renderList();
});
renderMetrics();
renderList();
