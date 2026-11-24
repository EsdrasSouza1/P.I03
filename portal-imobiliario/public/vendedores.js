const SELLERS_API = (window.BARTARIN_API_URL || `${window.location.protocol}//${window.location.hostname || 'localhost'}:5000`).replace(/\/$/, '');
const sellerList = document.querySelector('#seller-list');
const sellerFilter = document.querySelector('#seller-filter');
const sellerDialog = document.querySelector('#seller-dialog');
const sellerForm = document.querySelector('#seller-form');
const sellerMessage = document.querySelector('#seller-form-message');
const sellerStatus = document.querySelector('#sellers-connection-status');
let sellers = [];
let editingSellerId = null;

const sellerEscape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const sellerNormalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
function sellerHeaders(json = false) { const token = localStorage.getItem('bartarin-auth-token') || sessionStorage.getItem('bartarin-auth-token'); return { Accept: 'application/json', ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }; }
async function sellerRequest(path, options = {}) { const response = await fetch(`${SELLERS_API}${path}`, { credentials: 'include', ...options }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.erro || 'Não foi possível concluir a operação.'); return data; }

function sellerCard(seller) {
  const initial = (seller.nome || 'V').trim().charAt(0).toUpperCase();
  return `<article class="admin-property user-row ${seller.ativo ? '' : 'is-sold'}"><div class="user-avatar">${sellerEscape(initial)}</div><div class="admin-property-info"><span class="admin-property-type">${seller.ativo ? 'VENDEDOR ATIVO' : 'VENDEDOR INATIVO'}</span><h3>${sellerEscape(seller.nome)}</h3><p>${sellerEscape(seller.email)}${seller.telefone ? ` · ${sellerEscape(seller.telefone)}` : ''}${seller.creci ? ` · ${sellerEscape(seller.creci)}` : ''}</p><span class="seller-commission">${Number(seller.percentual_comissao).toLocaleString('pt-BR')}% da comissão da imobiliária</span></div><div class="admin-property-actions"><button class="quiet-button edit-seller" data-id="${sellerEscape(seller.id)}" type="button" aria-label="Editar vendedor" title="Editar vendedor"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg></button>${seller.ativo ? `<button class="quiet-button deactivate-seller" data-id="${sellerEscape(seller.id)}" type="button" aria-label="Desativar vendedor" title="Desativar vendedor"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg></button>` : ''}</div></article>`;
}
function renderSellers() { const keyword = sellerNormalize(sellerFilter.value); const filtered = keyword ? sellers.filter(item => sellerNormalize(Object.values(item).join(' ')).includes(keyword)) : sellers; sellerList.innerHTML = filtered.length ? filtered.map(sellerCard).join('') : `<div class="admin-empty">${keyword ? 'Nenhum vendedor encontrado.' : 'Nenhum vendedor cadastrado.'}</div>`; }
async function loadSellers() { sellerList.innerHTML = '<div class="admin-empty">Carregando vendedores…</div>'; try { sellers = await sellerRequest('/vendedores', { headers: sellerHeaders() }); sellerStatus.textContent = 'API conectada'; sellerStatus.classList.add('connected'); renderSellers(); } catch (error) { sellerStatus.textContent = 'API indisponível'; sellerStatus.classList.remove('connected'); sellerList.innerHTML = `<div class="admin-empty error-text">${sellerEscape(error.message)}</div>`; } }
function openSeller(seller = null) { editingSellerId = seller?.id || null; sellerForm.reset(); sellerForm.elements.ativo.checked = seller ? Boolean(seller.ativo) : true; sellerForm.elements.percentual_comissao.value = seller?.percentual_comissao ?? 50; ['nome', 'email', 'telefone', 'creci'].forEach(field => { sellerForm.elements[field].value = seller?.[field] || ''; }); sellerMessage.textContent = ''; document.querySelector('#seller-form-title').textContent = seller ? 'Editar vendedor' : 'Novo vendedor'; document.querySelector('#seller-submit-label').textContent = seller ? 'Salvar alterações' : 'Cadastrar vendedor'; sellerDialog.showModal(); }
function closeSeller() { if (sellerDialog.open) sellerDialog.close(); }
sellerForm.addEventListener('submit', async event => { event.preventDefault(); const submit = sellerForm.querySelector('button[type="submit"]'); const raw = Object.fromEntries(new FormData(sellerForm)); const payload = { ...raw, percentual_comissao: Number(raw.percentual_comissao), ativo: sellerForm.elements.ativo.checked }; submit.disabled = true; sellerMessage.textContent = ''; try { await sellerRequest(editingSellerId ? `/vendedores/${editingSellerId}` : '/vendedores', { method: editingSellerId ? 'PATCH' : 'POST', headers: sellerHeaders(true), body: JSON.stringify(payload) }); closeSeller(); await loadSellers(); } catch (error) { sellerMessage.textContent = error.message; sellerMessage.classList.add('error'); } finally { submit.disabled = false; } });
sellerList.addEventListener('click', async event => { const edit = event.target.closest('.edit-seller'); if (edit) { openSeller(sellers.find(item => item.id === edit.dataset.id)); return; } const deactivate = event.target.closest('.deactivate-seller'); if (!deactivate || !confirm('Desativar este vendedor? Ele não poderá ser selecionado em novas vendas.')) return; try { await sellerRequest(`/vendedores/${deactivate.dataset.id}`, { method: 'DELETE', headers: sellerHeaders() }); await loadSellers(); } catch (error) { alert(error.message); } });
document.querySelector('#add-seller').addEventListener('click', () => openSeller());
document.querySelector('#refresh-sellers').addEventListener('click', loadSellers);
document.querySelector('#close-seller-dialog').addEventListener('click', closeSeller);
document.querySelector('#cancel-seller').addEventListener('click', closeSeller);
sellerFilter.addEventListener('input', renderSellers);
loadSellers();
