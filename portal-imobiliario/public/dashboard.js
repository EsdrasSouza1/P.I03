const dashboardPeriod = document.querySelector('#dashboard-period');
const dashboardNeighborhood = document.querySelector('#dashboard-neighborhood');
const dashboardType = document.querySelector('#dashboard-type');
const dashboardSeller = document.querySelector('#dashboard-seller');
const dashboardStatus = document.querySelector('#dashboard-status');
let dashboardProperties = [];

const dashboardMoney = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value) || 0);
const dashboardNormalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
const dashboardSellerName = item => item.venda?.vendedor_nome || item.venda?.quem_vendeu || '';
const dashboardEscape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const dashboardTypeLabel = type => ({ apartamento: 'Apartamento', casa: 'Casa', casa_condominio: 'Casa em condomínio', chacara: 'Chácara', comercial: 'Sala comercial', galpao: 'Galpão', terreno: 'Terreno' }[type] || type || 'Não informado');

function localDashboardProperties() {
  try {
    const saved = JSON.parse(localStorage.getItem('bartarin-properties-v6') || 'null');
    if (Array.isArray(saved) && saved.length) return saved;
  } catch { /* usa os dados iniciais */ }
  return structuredClone(window.BartarinDemoProperties || []);
}

async function apiDashboardProperties() {
  const apiBase = (window.BARTARIN_API_URL || `${window.location.protocol}//${window.location.hostname || 'localhost'}:5000`).replace(/\/$/, '');
  const token = localStorage.getItem('bartarin-auth-token') || sessionStorage.getItem('bartarin-auth-token');
  const response = await fetch(`${apiBase}/imoveis`, { headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, credentials: 'include' });
  if (!response.ok) throw new Error('API indisponível');
  const items = await response.json();
  return items.map(item => ({
    _id: item.id,
    titulo: item.titulo_anuncio,
    tipo: item.tipo,
    preco: item.valor,
    localizacao: { bairro: item.bairro, cidade: item.cidade, uf: item.estado },
    status: item.status,
    vendido: item.vendido,
    venda: item.venda,
    criado_em: item.criado_em
  }));
}

function parseDashboardDate(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function periodStart() {
  const value = dashboardPeriod.value;
  if (value === 'all') return null;
  const now = new Date();
  if (value === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), now.getMonth() - Number(value) + 1, 1);
}

function matchesCatalogueFilters(item) {
  const neighborhood = dashboardNormalize(dashboardNeighborhood.value);
  return (!neighborhood || dashboardNormalize(item.localizacao?.bairro).includes(neighborhood))
    && (!dashboardType.value || item.tipo === dashboardType.value)
    && item.status !== 'arquivado';
}

function matchesSaleFilters(item) {
  if (!item.vendido || !matchesCatalogueFilters(item)) return false;
  if (dashboardSeller.value && dashboardSellerName(item) !== dashboardSeller.value) return false;
  const start = periodStart();
  const saleDate = parseDashboardDate(item.venda?.data_venda);
  return !start || (saleDate && saleDate >= start);
}

function populateDashboardFilters() {
  const neighborhoods = [...new Set(dashboardProperties.map(item => item.localizacao?.bairro).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  document.querySelector('#dashboard-neighborhoods').innerHTML = neighborhoods.map(value => `<option value="${dashboardEscape(value)}"></option>`).join('');
  const types = [...new Set(dashboardProperties.map(item => item.tipo).filter(Boolean))].sort();
  dashboardType.innerHTML = '<option value="">Todos os tipos</option>' + types.map(value => `<option value="${dashboardEscape(value)}">${dashboardEscape(dashboardTypeLabel(value))}</option>`).join('');
  const sellers = [...new Set(dashboardProperties.map(dashboardSellerName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  dashboardSeller.innerHTML = '<option value="">Todos os responsáveis</option>' + sellers.map(value => `<option value="${dashboardEscape(value)}">${dashboardEscape(value)}</option>`).join('');
}

function renderMetrics(sales, available) {
  const revenue = sales.reduce((sum, item) => sum + (Number(item.venda?.valor_venda) || 0), 0);
  document.querySelector('#metric-sold').textContent = sales.length;
  document.querySelector('#metric-available').textContent = available.length;
  document.querySelector('#metric-revenue').textContent = dashboardMoney(revenue);
  document.querySelector('#metric-average').textContent = dashboardMoney(sales.length ? revenue / sales.length : 0);
  document.querySelector('#metric-sold-caption').textContent = dashboardPeriod.options[dashboardPeriod.selectedIndex].textContent;
}

function lastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') };
  });
}

function renderSalesChart(baseSold) {
  const months = lastSixMonths();
  const values = months.map(month => baseSold.filter(item => {
    const date = parseDashboardDate(item.venda?.data_venda);
    return date && `${date.getFullYear()}-${date.getMonth()}` === month.key;
  }).length);
  const maximum = Math.max(1, ...values);
  document.querySelector('#sales-chart').innerHTML = months.map((month, index) => `<div><span class="chart-value">${values[index]}</span><div class="chart-column"><i style="height:${Math.max(4, values[index] / maximum * 100)}%"></i></div><small>${dashboardEscape(month.label)}</small></div>`).join('');
}

function renderTypeChart(available) {
  const counts = available.reduce((result, item) => ({ ...result, [item.tipo]: (result[item.tipo] || 0) + 1 }), {});
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const maximum = Math.max(1, ...entries.map(([, count]) => count));
  document.querySelector('#type-chart').innerHTML = entries.length ? entries.map(([type, count]) => `<div><span>${dashboardEscape(dashboardTypeLabel(type))}</span><div><i style="width:${count / maximum * 100}%"></i></div><strong>${count}</strong></div>`).join('') : '<p class="dashboard-empty">Nenhum imóvel disponível.</p>';
}

function renderLatestSales(sales) {
  const latest = [...sales].sort((a, b) => (parseDashboardDate(b.venda?.data_venda)?.getTime() || 0) - (parseDashboardDate(a.venda?.data_venda)?.getTime() || 0)).slice(0, 5);
  document.querySelector('#latest-sales').innerHTML = latest.length ? latest.map(item => `<article><div><strong>${dashboardEscape(item.titulo)}</strong><span>${dashboardEscape(item.venda?.nome_do_cliente)} · ${dashboardEscape(dashboardSellerName(item))}</span></div><div><b>${dashboardMoney(item.venda?.valor_venda)}</b><small>${dashboardEscape(item.venda?.data_venda)}</small></div></article>`).join('') : '<p class="dashboard-empty">Nenhuma venda no período.</p>';
}

function renderRecentProperties(items) {
  const recent = [...items].sort((a, b) => (parseDashboardDate(b.criado_em)?.getTime() || 0) - (parseDashboardDate(a.criado_em)?.getTime() || 0)).slice(0, 5);
  document.querySelector('#recent-properties').innerHTML = recent.length ? recent.map(item => `<article><div><strong>${dashboardEscape(item.titulo)}</strong><span>${dashboardEscape(item.localizacao?.bairro)} · ${dashboardEscape(dashboardTypeLabel(item.tipo))}</span></div><div><b>${dashboardMoney(item.preco)}</b><small>${item.vendido ? 'Vendido' : 'Disponível'}</small></div></article>`).join('') : '<p class="dashboard-empty">Nenhum imóvel cadastrado.</p>';
}

function renderDashboard() {
  const catalogueBase = dashboardProperties.filter(matchesCatalogueFilters);
  const available = catalogueBase.filter(item => !item.vendido);
  const sales = dashboardProperties.filter(matchesSaleFilters);
  const soldForSixMonths = dashboardProperties.filter(item => item.vendido && matchesCatalogueFilters(item) && (!dashboardSeller.value || dashboardSellerName(item) === dashboardSeller.value));
  renderMetrics(sales, available);
  renderSalesChart(soldForSixMonths);
  renderTypeChart(available);
  renderLatestSales(sales);
  renderRecentProperties(catalogueBase);
}

async function loadDashboard() {
  dashboardProperties = localDashboardProperties();
  if (!dashboardProperties.length) {
    try { dashboardProperties = await apiDashboardProperties(); dashboardStatus.textContent = 'Dados da API'; }
    catch { dashboardStatus.textContent = 'Sem dados disponíveis'; }
  }
  populateDashboardFilters();
  renderDashboard();
}

[dashboardPeriod, dashboardNeighborhood, dashboardType, dashboardSeller].forEach(control => control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', renderDashboard));
document.querySelector('#clear-dashboard-filters').addEventListener('click', () => {
  dashboardPeriod.value = 'month';
  dashboardNeighborhood.value = '';
  dashboardType.value = '';
  dashboardSeller.value = '';
  renderDashboard();
});
loadDashboard();
