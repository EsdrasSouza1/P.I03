const REPORT_API = (window.BARTARIN_API_URL || `${window.location.protocol}//${window.location.hostname || 'localhost'}:5000`).replace(/\/$/, '');
const reportMode = document.querySelector('.report-page').dataset.report;
const reportContent = document.querySelector('#report-content');
const reportStatus = document.querySelector('#report-status');
const sellerFilter = document.querySelector('#report-seller');
const startFilter = document.querySelector('#report-start');
const endFilter = document.querySelector('#report-end');
const paymentDialog = document.querySelector('#payment-dialog');
let reportItems = [];
let selectedItems = [];
const reportPropertiesKey = 'bartarin-properties-v6';

const reportEscape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const reportMoney = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const reportDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
function reportHeaders(json = false) { const token = localStorage.getItem('bartarin-auth-token') || sessionStorage.getItem('bartarin-auth-token'); return { Accept: 'application/json', ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }; }
async function reportRequest(path, options = {}) { const response = await fetch(`${REPORT_API}${path}`, { credentials: 'include', ...options }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.erro || 'Não foi possível carregar o relatório.'); return data; }
function queryString() { const params = new URLSearchParams(); if (startFilter.value) params.set('inicio', startFilter.value); if (endFilter.value) params.set('fim', endFilter.value); if (sellerFilter.value) params.set('vendedor_id', sellerFilter.value); if (reportMode === 'comissoes') params.set('situacao', document.querySelector('#report-payment').value); return params.toString(); }

function readLocalSoldProperties() {
  try { return (JSON.parse(localStorage.getItem(reportPropertiesKey) || '[]') || []).filter(item => item.vendido && item.venda); }
  catch { return []; }
}

function localSaleMatches(item) {
  const sale = item.venda;
  if (startFilter.value && sale.data_venda < startFilter.value) return false;
  if (endFilter.value && sale.data_venda > endFilter.value) return false;
  if (sellerFilter.value && ![sale.vendedor_id, sale.captador_id].includes(sellerFilter.value)) return false;
  return true;
}

function localReportItems(apiItems) {
  const apiPropertyIds = new Set(apiItems.map(item => String(item.imovel_id)));
  const local = readLocalSoldProperties().filter(item => localSaleMatches(item) && !apiPropertyIds.has(String(item._id)));
  if (reportMode === 'vendas') return local.map(item => ({
    imovel_id: String(item._id), imovel: item.titulo, data_venda: item.venda.data_venda,
    cliente: item.venda.nome_do_cliente, valor_venda: item.venda.valor_venda,
    vendedor_nome: item.venda.vendedor_nome || item.venda.quem_vendeu || '', captador_nome: item.venda.captador_nome || '',
    comissao_imobiliaria: item.venda.comissao_imobiliaria || 0,
    comissao_liquida_imobiliaria: item.venda.comissao_liquida_imobiliaria ?? ((item.venda.comissao_imobiliaria || 0) - (item.venda.comissao_vendedor || 0) - (item.venda.comissao_captador || 0)),
    local: true
  }));
  const situation = document.querySelector('#report-payment').value;
  return local.flatMap(item => {
    const sale = item.venda;
    return [
      { tipo: 'venda', vendedor_id: sale.vendedor_id, vendedor_nome: sale.vendedor_nome || sale.quem_vendeu, percentual: sale.percentual_comissao_vendedor, valor_comissao: sale.comissao_vendedor, paga: Boolean(sale.comissao_vendedor_paga), paga_em: sale.comissao_vendedor_paga_em },
      { tipo: 'captacao', vendedor_id: sale.captador_id, vendedor_nome: sale.captador_nome, percentual: sale.percentual_comissao_captador, valor_comissao: sale.comissao_captador, paga: Boolean(sale.comissao_captador_paga), paga_em: sale.comissao_captador_paga_em }
    ].filter(part => part.vendedor_id && Number(part.valor_comissao) > 0)
      .filter(part => !sellerFilter.value || part.vendedor_id === sellerFilter.value)
      .filter(part => situation === 'todas' || (situation === 'pagas' ? part.paga : !part.paga))
      .map(part => ({ ...part, chave: `local:${item._id}:${part.tipo}`, imovel_id: String(item._id), imovel: item.titulo, data_venda: sale.data_venda, valor_venda: sale.valor_venda, local: true }));
  });
}

async function loadSellers() {
  const sellers = await reportRequest('/vendedores', { headers: reportHeaders() });
  sellerFilter.innerHTML = '<option value="">Todos os vendedores</option>' + sellers.map(item => `<option value="${reportEscape(item.id)}">${reportEscape(item.nome)}</option>`).join('');
}

function commissionRow(item) {
  return `<article class="report-row"><label class="report-check">${item.paga ? '<span class="paid-mark">✓</span>' : `<input type="checkbox" data-commission-key="${reportEscape(item.chave)}">`}</label><div><strong>${reportEscape(item.imovel)}</strong><span>${reportDate(item.data_venda)} · ${item.tipo === 'captacao' ? 'Captação' : 'Venda'}</span></div><div><span>Venda</span><strong>${reportMoney(item.valor_venda)}</strong></div><div><span>Percentual</span><strong>${Number(item.percentual).toLocaleString('pt-BR')}%</strong></div><div><span>Comissão</span><strong>${reportMoney(item.valor_comissao)}</strong></div><div><span>Situação</span><b class="report-status-badge ${item.paga ? 'is-paid' : ''}">${item.paga ? 'Paga' : 'Pendente'}</b></div></article>`;
}

function renderCommissions() {
  const groups = reportItems.reduce((map, item) => { const group = map.get(item.vendedor_id) || []; group.push(item); map.set(item.vendedor_id, group); return map; }, new Map());
  reportContent.innerHTML = groups.size ? [...groups.values()].map(items => {
    const pending = items.filter(item => !item.paga);
    const total = items.reduce((sum, item) => sum + Number(item.valor_comissao), 0);
    const keys = pending.map(item => item.chave).join(',');
    return `<section class="commission-group"><header><div><span class="panel-kicker">VENDEDOR</span><h3>${reportEscape(items[0].vendedor_nome)}</h3><small>${items.length} ${items.length === 1 ? 'lançamento' : 'lançamentos'} · ${reportMoney(total)}</small></div>${pending.length ? `<button class="quiet-button select-group" data-keys="${reportEscape(keys)}" type="button">Selecionar pendentes</button>` : '<span class="report-status-badge is-paid">Tudo pago</span>'}</header>${items.map(commissionRow).join('')}</section>`;
  }).join('') : '<div class="admin-empty">Nenhuma comissão encontrada no período.</div>';
  const total = reportItems.reduce((sum, item) => sum + Number(item.valor_comissao), 0);
  const paid = reportItems.filter(item => item.paga).reduce((sum, item) => sum + Number(item.valor_comissao), 0);
  document.querySelector('#report-total').textContent = reportMoney(total);
  document.querySelector('#report-paid').textContent = reportMoney(paid);
  document.querySelector('#report-pending').textContent = reportMoney(total - paid);
  updatePaymentButton();
}

function renderSales() {
  reportContent.innerHTML = reportItems.length ? `<div class="sales-report-table"><div class="report-row report-table-head"><span>Imóvel</span><span>Data / cliente</span><span>Responsáveis</span><span>Valor da venda</span><span>Resultado líquido</span></div>${reportItems.map(item => `<article class="report-row"><div><strong>${reportEscape(item.imovel)}</strong></div><div><strong>${reportDate(item.data_venda)}</strong><span>${reportEscape(item.cliente)}</span></div><div><strong>${reportEscape(item.vendedor_nome)}</strong><span>Captador: ${reportEscape(item.captador_nome || 'Não informado')}</span></div><div><strong>${reportMoney(item.valor_venda)}</strong><span>Comissão: ${reportMoney(item.comissao_imobiliaria)}</span></div><div><strong>${reportMoney(item.comissao_liquida_imobiliaria)}</strong></div></article>`).join('')}</div>` : '<div class="admin-empty">Nenhuma venda encontrada no período.</div>';
  document.querySelector('#sales-count').textContent = reportItems.length;
  document.querySelector('#sales-value').textContent = reportMoney(reportItems.reduce((sum, item) => sum + Number(item.valor_venda), 0));
  document.querySelector('#sales-gross').textContent = reportMoney(reportItems.reduce((sum, item) => sum + Number(item.comissao_imobiliaria), 0));
  document.querySelector('#sales-net').textContent = reportMoney(reportItems.reduce((sum, item) => sum + Number(item.comissao_liquida_imobiliaria), 0));
}

async function loadReport() {
  reportContent.innerHTML = '<div class="admin-empty">Carregando relatório…</div>';
  try {
    const apiItems = await reportRequest(`/relatorios/${reportMode}?${queryString()}`, { headers: reportHeaders() });
    reportItems = [...apiItems, ...localReportItems(apiItems)].sort((a, b) => String(b.data_venda).localeCompare(String(a.data_venda)));
    selectedItems = [];
    reportStatus.textContent = 'API conectada'; reportStatus.classList.add('connected');
    if (reportMode === 'comissoes') renderCommissions(); else renderSales();
  } catch (error) { reportStatus.textContent = 'Falha na consulta'; reportStatus.classList.remove('connected'); reportContent.innerHTML = `<div class="admin-empty error-text">${reportEscape(error.message)}</div>`; }
}

function updatePaymentButton() { const button = document.querySelector('#pay-selected'); if (!button) return; const checked = [...document.querySelectorAll('[data-commission-key]:checked')]; selectedItems = checked.map(input => reportItems.find(item => item.chave === input.dataset.commissionKey)).filter(Boolean); button.disabled = !selectedItems.length; button.textContent = selectedItems.length ? `Pagar selecionadas (${selectedItems.length})` : 'Pagar selecionadas'; }

function renderCommissionReceipt(items, receiptNumber, batches) {
  const total = items.reduce((sum, item) => sum + Number(item.valor_comissao), 0);
  const groups = items.reduce((map, item) => { const key = item.vendedor_id || item.vendedor_nome; const group = map.get(key) || []; group.push(item); map.set(key, group); return map; }, new Map());
  document.querySelector('#commission-receipt').innerHTML = `<header><div><span class="receipt-brand">BARTARIN IMÓVEIS</span><h3>Comprovante de pagamento de comissões</h3></div><div><b>${reportEscape(receiptNumber)}</b><span>${new Date().toLocaleString('pt-BR')}</span></div></header><div class="receipt-meta"><span><b>Lote(s):</b> ${reportEscape(batches.filter(Boolean).join(' / '))}</span><span><b>Quantidade:</b> ${items.length}</span></div>${[...groups.values()].map(group => `<section><div class="receipt-seller"><strong>${reportEscape(group[0].vendedor_nome)}</strong><span>Total do vendedor: ${reportMoney(group.reduce((sum, item) => sum + Number(item.valor_comissao), 0))}</span></div><div class="receipt-table"><div class="receipt-table-head"><span>Imóvel</span><span>Origem</span><span>Venda</span><span>Comissão</span></div>${group.map(item => `<div><span>${reportEscape(item.imovel)}</span><span>${item.tipo === 'captacao' ? 'Captação' : 'Venda'} · ${Number(item.percentual).toLocaleString('pt-BR')}%</span><span>${reportMoney(item.valor_venda)}</span><strong>${reportMoney(item.valor_comissao)}</strong></div>`).join('')}</div></section>`).join('')}<footer><span>Total pago</span><strong>${reportMoney(total)}</strong></footer><div class="receipt-signatures"><div><span>Responsável pelo pagamento</span></div><div><span>Recebedor</span></div></div>`;
}

function printCommissionReceipt() {
  const receipt = document.querySelector('#commission-receipt');
  const printWindow = window.open('', '_blank', 'width=920,height=760');
  if (!printWindow) { window.alert('Permita a abertura de janelas para imprimir o comprovante.'); return; }
  printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Comprovante de comissões</title><style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #26362c; background: #fff; font-family: Arial, sans-serif; font-size: 11px; }
    .commission-receipt { width: 100%; min-height: 267mm; padding: 10mm; border: 1px solid #bac5bc; }
    header { padding-bottom: 18px; display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; border-bottom: 3px solid #3f5d49; }
    header > div { display: grid; gap: 5px; }
    header > div:last-child { text-align: right; }
    header h3 { margin: 0; color: #1e3025; font-family: Georgia, serif; font-size: 22px; }
    header span { color: #647269; font-size: 10px; }
    header b { color: #26392d; font-size: 12px; }
    .receipt-brand { color: #3f5d49; font-size: 12px; font-weight: 800; letter-spacing: 2px; }
    .receipt-meta { margin: 16px 0; padding: 11px 13px; display: flex; justify-content: space-between; gap: 15px; border: 1px solid #d9dfda; background: #f6f8f5; }
    .commission-receipt > section { margin-top: 15px; border: 1px solid #cfd7d0; break-inside: avoid; }
    .receipt-seller { padding: 11px 13px; display: flex; justify-content: space-between; background: #eaf0eb; color: #26392d; }
    .receipt-seller strong { font-size: 12px; }
    .receipt-table > div { min-height: 34px; padding: 9px 12px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; align-items: center; gap: 10px; border-top: 1px solid #e0e5e1; }
    .receipt-table-head { min-height: 29px !important; background: #f8f9f7; color: #637168; font-size: 9px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; }
    .receipt-table strong, .receipt-table > div > span:last-child { text-align: right; }
    footer { margin-top: 20px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; border: 2px solid #3f5d49; color: #26392d; font-size: 13px; font-weight: 700; }
    footer strong { font-size: 21px; }
    .receipt-signatures { margin-top: 42mm; display: grid; grid-template-columns: 1fr 1fr; gap: 25mm; break-inside: avoid; }
    .receipt-signatures div { position: relative; padding-top: 10px; border-top: 1.5px solid #26362c; color: #445348; font-size: 10px; text-align: center; }
    .receipt-signatures div::before { content: 'Assinatura'; position: absolute; right: 0; bottom: calc(100% + 5px); left: 0; color: #8a948d; font-size: 8px; text-align: center; }
  </style></head><body>${receipt.outerHTML}<script>window.addEventListener('load',()=>{window.print();window.addEventListener('afterprint',()=>window.close(),{once:true});});<\/script></body></html>`);
  printWindow.document.close();
}

if (reportMode === 'comissoes') {
  reportContent.addEventListener('change', updatePaymentButton);
  reportContent.addEventListener('click', event => { const group = event.target.closest('.select-group'); if (!group) return; const keys = group.dataset.keys.split(','); document.querySelectorAll('[data-commission-key]').forEach(input => { if (keys.includes(input.dataset.commissionKey)) input.checked = true; }); updatePaymentButton(); });
  document.querySelector('#pay-selected').addEventListener('click', () => { const total = selectedItems.reduce((sum, item) => sum + Number(item.valor_comissao), 0); document.querySelector('#payment-dialog-title').textContent = 'Confirmar pagamento'; document.querySelector('#payment-summary').innerHTML = `Confirmar o pagamento de <strong>${selectedItems.length}</strong> ${selectedItems.length === 1 ? 'comissão' : 'comissões'}, totalizando <strong>${reportMoney(total)}</strong>?`; document.querySelector('#payment-message').textContent = ''; document.querySelector('#commission-receipt').hidden = true; document.querySelector('#payment-confirm-actions').hidden = false; document.querySelector('#receipt-actions').hidden = true; paymentDialog.showModal(); });
  document.querySelectorAll('[data-close-payment]').forEach(button => button.addEventListener('click', () => paymentDialog.close()));
  document.querySelector('#print-receipt').addEventListener('click', printCommissionReceipt);
  document.querySelector('#confirm-payment').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try {
      const localItems = selectedItems.filter(item => item.local);
      const apiSelected = selectedItems.filter(item => !item.local);
      const loteLocal = `PG-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}-LOCAL`;
      if (localItems.length) {
        const properties = JSON.parse(localStorage.getItem(reportPropertiesKey) || '[]');
        const paidAt = new Date().toISOString();
        localItems.forEach(item => {
          const property = properties.find(entry => String(entry._id) === String(item.imovel_id));
          if (!property?.venda) return;
          const prefix = item.tipo === 'captacao' ? 'comissao_captador' : 'comissao_vendedor';
          property.venda[`${prefix}_paga`] = true;
          property.venda[`${prefix}_paga_em`] = paidAt;
          property.venda[`${prefix}_lote`] = loteLocal;
        });
        localStorage.setItem(reportPropertiesKey, JSON.stringify(properties));
      }
      const result = apiSelected.length ? await reportRequest('/relatorios/comissoes/pagar', { method: 'POST', headers: reportHeaders(true), body: JSON.stringify({ itens: apiSelected.map(item => ({ imovel_id: item.imovel_id, tipo: item.tipo })) }) }) : { quantidade: 0, lote: loteLocal };
      const quantity = localItems.length + Number(result.quantidade || 0);
      const receiptNumber = `COMP-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
      renderCommissionReceipt(selectedItems, receiptNumber, [apiSelected.length ? result.lote : '', localItems.length ? loteLocal : '']);
      document.querySelector('#payment-dialog-title').textContent = 'Comprovante de pagamento';
      document.querySelector('#payment-summary').textContent = '';
      document.querySelector('#payment-message').textContent = `${quantity} pagamento(s) registrado(s) com sucesso.`;
      document.querySelector('#commission-receipt').hidden = false;
      document.querySelector('#payment-confirm-actions').hidden = true;
      document.querySelector('#receipt-actions').hidden = false;
      loadReport();
    } catch (error) { document.querySelector('#payment-message').textContent = error.message; document.querySelector('#payment-message').classList.add('error'); }
    finally { event.currentTarget.disabled = false; }
  });
}

document.querySelector('#apply-report').addEventListener('click', loadReport);
Promise.all([loadSellers(), loadReport()]).catch(error => { reportContent.innerHTML = `<div class="admin-empty error-text">${reportEscape(error.message)}</div>`; });
