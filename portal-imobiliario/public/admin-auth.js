const ADMIN_API_BASE_URL = (
  window.BARTARIN_API_URL ||
  document.querySelector('meta[name="api-base-url"]')?.content ||
  `${window.location.protocol}//${window.location.hostname || 'localhost'}:5000`
).replace(/\/$/, '');

const ADMIN_TOKEN_KEY = 'bartarin-auth-token';
const ADMIN_USER_KEY = 'bartarin-auth-user';

async function verifyAdminAccess() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY) || '';
  if (!token) {
    window.location.replace(`/login.html?next=${encodeURIComponent(window.location.pathname)}`);
    return;
  }
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/me`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.autenticado || !data.usuario) throw new Error('Sessão inválida');
    const storage = localStorage.getItem(ADMIN_TOKEN_KEY) ? localStorage : sessionStorage;
    storage.setItem(ADMIN_USER_KEY, JSON.stringify(data.usuario));
    document.body.classList.add('admin-authorized');
  } catch {
    clearAdminSession();
    window.location.replace(`/login.html?next=${encodeURIComponent(window.location.pathname)}`);
  }
}

function getAdminStorageValue(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key) || '';
}

function getAdminUser() {
  try { return JSON.parse(getAdminStorageValue(ADMIN_USER_KEY)) || {}; }
  catch { return {}; }
}

function clearAdminSession() {
  [ADMIN_TOKEN_KEY, ADMIN_USER_KEY].forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

verifyAdminAccess();

function adminHeaders(json = false) {
  const token = getAdminStorageValue(ADMIN_TOKEN_KEY);
  return { Accept: 'application/json', ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const adminUser = getAdminUser();
document.querySelectorAll('[data-admin-user-name]').forEach(element => { element.textContent = adminUser.nome || adminUser.usuario || 'Usuário'; });

document.querySelectorAll('[data-admin-user-menu]').forEach(menu => {
  const trigger = menu.querySelector('.admin-user-trigger');
  const dropdown = menu.querySelector('.admin-user-dropdown');
  trigger.addEventListener('click', event => {
    event.stopPropagation();
    const willOpen = dropdown.hidden;
    document.querySelectorAll('.admin-user-dropdown').forEach(item => { item.hidden = true; });
    dropdown.hidden = !willOpen;
    trigger.setAttribute('aria-expanded', String(willOpen));
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.admin-user-dropdown').forEach(dropdown => { dropdown.hidden = true; });
  document.querySelectorAll('.admin-user-trigger').forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
});

document.querySelectorAll('[data-admin-logout]').forEach(button => {
  button.addEventListener('click', async event => {
    event.stopPropagation();
    button.disabled = true;
    try {
      await fetch(`${ADMIN_API_BASE_URL}/logout`, { method: 'POST', headers: adminHeaders(), credentials: 'include' });
    } catch {
      // Remove a sessão local mesmo se a API estiver indisponível.
    } finally {
      clearAdminSession();
      window.location.replace('/login.html');
    }
  });
});

const passwordDialogMarkup = `<dialog class="password-dialog" id="password-dialog"><div class="edit-workspace-heading"><div><span class="panel-kicker">SEGURANÇA</span><h2>Alterar senha</h2></div><button class="quiet-button" type="button" data-close-password>Fechar ✕</button></div><form id="password-form" class="password-form"><label>Nova senha<input type="password" name="senha" required autocomplete="new-password"></label><label>Confirmar nova senha<input type="password" name="confirmacao" required autocomplete="new-password"></label><p class="form-message" aria-live="polite"></p><div class="password-actions"><button class="button button-outline" type="button" data-close-password>Cancelar</button><button class="button button-dark" type="submit">Salvar senha</button></div></form></dialog>`;
document.body.insertAdjacentHTML('beforeend', passwordDialogMarkup);

const passwordDialog = document.querySelector('#password-dialog');
const passwordForm = document.querySelector('#password-form');
document.querySelectorAll('[data-change-password]').forEach(button => button.addEventListener('click', event => {
  event.stopPropagation();
  passwordForm.reset();
  passwordForm.querySelector('.form-message').textContent = '';
  passwordDialog.showModal();
}));
document.querySelectorAll('[data-close-password]').forEach(button => button.addEventListener('click', () => passwordDialog.close()));

passwordForm.addEventListener('submit', async event => {
  event.preventDefault();
  const message = passwordForm.querySelector('.form-message');
  const senha = passwordForm.elements.senha.value;
  const confirmacao = passwordForm.elements.confirmacao.value;
  if (senha !== confirmacao) {
    message.textContent = 'As senhas informadas não são iguais.';
    message.classList.add('error');
    return;
  }
  if (!adminUser.id) {
    message.textContent = 'Não foi possível identificar o usuário autenticado.';
    message.classList.add('error');
    return;
  }
  const submit = passwordForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/usuarios/${adminUser.id}`, { method: 'PATCH', headers: adminHeaders(true), credentials: 'include', body: JSON.stringify({ senha }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.erro || 'Não foi possível alterar a senha.');
    message.textContent = 'Senha alterada com sucesso.';
    message.classList.remove('error');
    message.classList.add('success');
    window.setTimeout(() => passwordDialog.close(), 700);
  } catch (error) {
    message.textContent = error.message;
    message.classList.add('error');
  } finally { submit.disabled = false; }
});
