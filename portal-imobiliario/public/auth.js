const API_BASE_URL = (
  window.BARTARIN_API_URL ||
  document.querySelector('meta[name="api-base-url"]')?.content ||
  (window.location.protocol === 'file:'
    ? 'http://localhost:5000'
    : `${window.location.protocol}//${window.location.hostname || 'localhost'}:5000`)
).replace(/\/$/, '');

const TOKEN_KEY = 'bartarin-auth-token';
const USER_KEY = 'bartarin-auth-user';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.querySelectorAll('.show-password').forEach(button => {
  button.addEventListener('click', () => {
    const input = button.parentElement.querySelector('input');
    input.type = input.type === 'password' ? 'text' : 'password';
    button.setAttribute('aria-label', input.type === 'password' ? 'Mostrar senha' : 'Ocultar senha');
  });
});

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
}

function saveAuthSession(token, usuario, lembrar) {
  clearAuthSession();
  const storage = lembrar ? localStorage : sessionStorage;
  if (token) storage.setItem(TOKEN_KEY, token);
  if (usuario) storage.setItem(USER_KEY, JSON.stringify(usuario));
}

function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function setFormMessage(messageElement, text, type = '') {
  messageElement.textContent = text;
  messageElement.classList.remove('error', 'success');
  if (type) messageElement.classList.add(type);
}

function setFieldInvalid(input, isInvalid) {
  const wrap = input?.closest('.auth-input-wrap');
  if (wrap) wrap.classList.toggle('invalid', isInvalid);
}

function resolveNextUrl() {
  const next = new URLSearchParams(window.location.search).get('next') || '';
  if (next.startsWith('/') && !next.startsWith('//')) return next;
  return '/admin.html';
}

function validateLoginInputs(form) {
  const emailInput = form.elements.namedItem('email');
  const senhaInput = form.elements.namedItem('senha');
  const lembrarInput = form.elements.namedItem('lembrar');

  const email = (emailInput?.value || '').trim();
  const senha = senhaInput?.value || '';
  const lembrar = Boolean(lembrarInput?.checked);

  setFieldInvalid(emailInput, false);
  setFieldInvalid(senhaInput, false);

  if (!email) {
    setFieldInvalid(emailInput, true);
    emailInput?.focus();
    return { valid: false, error: 'Informe seu e-mail para entrar.' };
  }

  if (!EMAIL_REGEX.test(email)) {
    setFieldInvalid(emailInput, true);
    emailInput?.focus();
    return { valid: false, error: 'Informe um endereço de e-mail válido.' };
  }

  if (!senha) {
    setFieldInvalid(senhaInput, true);
    senhaInput?.focus();
    return { valid: false, error: 'Informe sua senha.' };
  }

  if (senha.length < 8) {
    setFieldInvalid(senhaInput, true);
    senhaInput?.focus();
    return { valid: false, error: 'A senha deve ter pelo menos 8 caracteres.' };
  }

  return { valid: true, payload: { email, senha, lembrar } };
}

function renderActiveSession(form, usuario) {
  const panel = document.querySelector('#active-session-panel');
  if (!panel || !usuario) return;

  const avatar = document.querySelector('#session-avatar');
  const nameEl = document.querySelector('#session-user-name');
  const emailEl = document.querySelector('#session-user-email');

  const initial = (usuario.nome || usuario.usuario || 'U').trim().charAt(0).toUpperCase();
  if (avatar) avatar.textContent = initial;
  if (nameEl) nameEl.textContent = usuario.nome || usuario.usuario;
  if (emailEl) emailEl.textContent = usuario.email || '';

  panel.classList.remove('hidden');
  form.classList.add('hidden');
}

function hideActiveSession(form) {
  const panel = document.querySelector('#active-session-panel');
  if (panel) panel.classList.add('hidden');
  form.classList.remove('hidden');
}

async function checkActiveSession(loginForm) {
  const token = getStoredToken();
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) clearAuthSession();
      return;
    }

    const data = await response.json();
    if (data?.autenticado && data?.usuario) {
      const targetStorage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
      targetStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
      renderActiveSession(loginForm, data.usuario);
    }
  } catch {
    // API indisponível no carregamento: mantém o formulário disponível.
  }
}

async function handleLoginSubmit(form) {
  const message = form.querySelector('.form-message');
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton?.querySelector('.submit-label');

  setFormMessage(message, '');

  const validation = validateLoginInputs(form);
  if (!validation.valid) {
    setFormMessage(message, validation.error, 'error');
    return;
  }

  const originalLabel = submitLabel ? submitLabel.textContent : 'Entrar';
  if (submitButton) submitButton.disabled = true;
  if (submitLabel) submitLabel.textContent = 'Entrando...';

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(validation.payload)
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      setFormMessage(
        message,
        data.erro || 'Não foi possível entrar. Verifique seus dados e tente novamente.',
        'error'
      );
      return;
    }

    if (!data?.autenticado || !data?.usuario) {
      setFormMessage(message, 'Resposta inválida do servidor de autenticação.', 'error');
      return;
    }

    saveAuthSession(data.token, data.usuario, validation.payload.lembrar);
    setFormMessage(
      message,
      `Bem-vindo(a), ${data.usuario.nome}! Redirecionando...`,
      'success'
    );

    window.setTimeout(() => {
      window.location.href = resolveNextUrl();
    }, 800);
  } catch {
    setFormMessage(
      message,
      'Não foi possível conectar ao servidor. Verifique se a API está em execução.',
      'error'
    );
  } finally {
    if (submitButton) submitButton.disabled = false;
    if (submitLabel) submitLabel.textContent = originalLabel;
  }
}

function setupLoginForm(form) {
  ['email', 'senha'].forEach(fieldName => {
    const input = form.elements.namedItem(fieldName);
    input?.addEventListener('input', () => {
      setFieldInvalid(input, false);
      const message = form.querySelector('.form-message');
      if (message?.classList.contains('error')) setFormMessage(message, '');
    });
  });

  const logoutButton = document.querySelector('#logout-button');
  logoutButton?.addEventListener('click', async () => {
    logoutButton.disabled = true;
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include'
      });
    } catch {
      // Mesmo se o servidor estiver inacessível, encerra a sessão local.
    } finally {
      clearAuthSession();
      hideActiveSession(form);
      form.reset();
      const message = form.querySelector('.form-message');
      setFormMessage(message, 'Sessão encerrada com sucesso.', 'success');
      logoutButton.disabled = false;
    }
  });

  checkActiveSession(form);
}

document.querySelectorAll('[data-auth-form]').forEach(form => {
  const mode = form.dataset.authForm;

  if (mode === 'login') {
    setupLoginForm(form);
    form.addEventListener('submit', event => {
      event.preventDefault();
      handleLoginSubmit(form);
    });
    return;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    const messages = {
      register: 'Tela demonstrativa: seus dados não foram enviados nem armazenados.',
      recovery: 'Tela demonstrativa: nenhuma mensagem foi enviada.'
    };
    setFormMessage(message, messages[mode] || '', 'error');
  });
});
