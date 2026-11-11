const API_BASE_URL = (
  window.BARTARIN_API_URL ||
  document.querySelector('meta[name="api-base-url"]')?.content ||
  `${window.location.protocol}//${window.location.hostname || 'localhost'}:5000`
).replace(/\/$/, '');

const userList = document.querySelector('#user-list');
const userFilter = document.querySelector('#user-filter');
const userDialog = document.querySelector('#user-dialog');
const userForm = document.querySelector('#user-form');
const formMessage = document.querySelector('#user-form-message');
const connectionStatus = document.querySelector('#users-connection-status');
let users = [];
let editingUserId = null;

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

function authHeaders(json = false) {
  const token = localStorage.getItem('bartarin-auth-token') || sessionStorage.getItem('bartarin-auth-token');
  return {
    Accept: 'application/json',
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include', ...options });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new Error(data.erro || 'Não foi possível concluir a operação.');
  return data;
}

function userCard(user) {
  const initial = (user.nome || user.usuario || 'U').trim().charAt(0).toUpperCase();
  return `<article class="admin-property user-row"><div class="user-avatar">${escapeHtml(initial)}</div><div class="admin-property-info"><span class="admin-property-type">USUÁRIO ADMINISTRATIVO</span><h3>${escapeHtml(user.nome)}</h3><p>${escapeHtml(user.email)} · @${escapeHtml(user.usuario)}</p></div><div class="admin-property-actions"><button class="quiet-button edit-user" data-id="${escapeHtml(user.id)}" type="button" aria-label="Editar usuário" title="Editar usuário"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg></button><button class="quiet-button delete-user" data-id="${escapeHtml(user.id)}" type="button" aria-label="Excluir usuário" title="Excluir usuário"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M5 7l1 14h12l1-14"/><path d="M9 11v6M15 11v6"/><path d="M8 7V3h8v4"/></svg></button></div></article>`;
}

function renderUsers() {
  const keyword = normalize(userFilter.value);
  const filtered = keyword ? users.filter(user => normalize(Object.values(user).join(' ')).includes(keyword)) : users;
  userList.innerHTML = filtered.length ? filtered.map(userCard).join('') : `<div class="admin-empty">${keyword ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}</div>`;
}

async function loadUsers() {
  userList.innerHTML = '<div class="admin-empty">Carregando usuários…</div>';
  try {
    users = await apiRequest('/usuarios', { headers: authHeaders() });
    connectionStatus.textContent = 'API conectada';
    connectionStatus.classList.add('connected');
    renderUsers();
  } catch (error) {
    connectionStatus.textContent = 'API indisponível';
    connectionStatus.classList.remove('connected');
    userList.innerHTML = `<div class="admin-empty error-text">${escapeHtml(error.message)}</div>`;
  }
}

function openCreateUser() {
  editingUserId = null;
  userForm.reset();
  formMessage.textContent = '';
  document.querySelector('#user-form-title').textContent = 'Novo usuário';
  document.querySelector('#user-submit-label').textContent = 'Cadastrar usuário';
  document.querySelector('#password-hint').textContent = 'A senha é obrigatória no novo cadastro.';
  userForm.elements.senha.required = true;
  userDialog.showModal();
}

function openEditUser(user) {
  editingUserId = user.id;
  userForm.reset();
  userForm.elements.nome.value = user.nome || '';
  userForm.elements.email.value = user.email || '';
  userForm.elements.usuario.value = user.usuario || '';
  userForm.elements.senha.required = false;
  formMessage.textContent = '';
  document.querySelector('#user-form-title').textContent = 'Editar usuário';
  document.querySelector('#user-submit-label').textContent = 'Salvar alterações';
  document.querySelector('#password-hint').textContent = 'Deixe a senha vazia para manter a senha atual.';
  userDialog.showModal();
}

function closeUserDialog() { if (userDialog.open) userDialog.close(); }

userForm.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = userForm.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(userForm));
  if (editingUserId && !data.senha) delete data.senha;
  submit.disabled = true;
  formMessage.textContent = '';
  try {
    await apiRequest(editingUserId ? `/usuarios/${editingUserId}` : '/usuarios', {
      method: editingUserId ? 'PATCH' : 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(data)
    });
    closeUserDialog();
    await loadUsers();
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.classList.add('error');
  } finally { submit.disabled = false; }
});

userList.addEventListener('click', async event => {
  const editButton = event.target.closest('.edit-user');
  if (editButton) {
    const user = users.find(item => item.id === editButton.dataset.id);
    if (user) openEditUser(user);
    return;
  }
  const deleteButton = event.target.closest('.delete-user');
  if (!deleteButton || !confirm('Excluir este usuário? Esta ação não pode ser desfeita.')) return;
  try {
    await apiRequest(`/usuarios/${deleteButton.dataset.id}`, { method: 'DELETE', headers: authHeaders() });
    await loadUsers();
  } catch (error) { alert(error.message); }
});

document.querySelector('#add-user').addEventListener('click', openCreateUser);
document.querySelector('#refresh-users').addEventListener('click', loadUsers);
document.querySelector('#close-user-dialog').addEventListener('click', closeUserDialog);
document.querySelector('#cancel-user').addEventListener('click', closeUserDialog);
userDialog.addEventListener('click', event => { if (event.target === userDialog) closeUserDialog(); });
userFilter.addEventListener('input', renderUsers);
loadUsers();
