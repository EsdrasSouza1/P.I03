const COOKIE_CHOICE_KEY = 'bartarin-cookie-preferences-v1';

function saveCookieChoice(analytics) {
  localStorage.setItem(COOKIE_CHOICE_KEY, JSON.stringify({ necessary: true, analytics, version: 1, decidedAt: new Date().toISOString() }));
  document.querySelector('#cookie-banner')?.remove();
  document.querySelector('#cookie-preferences')?.close();
}

function openCookiePreferences() {
  let dialog = document.querySelector('#cookie-preferences');
  if (!dialog) {
    document.body.insertAdjacentHTML('beforeend', `<dialog id="cookie-preferences" class="cookie-preferences"><div><h2>Preferências de cookies</h2><p>Escolha quais categorias podem ser utilizadas. Cookies necessários permanecem ativos para segurança e autenticação.</p><label><span><strong>Necessários</strong><small>Sessão, autenticação e preferências essenciais.</small></span><input type="checkbox" checked disabled></label><label><span><strong>Analíticos</strong><small>Ajudariam a entender o uso do site. Nenhuma ferramenta analítica está ativa atualmente.</small></span><input id="cookie-analytics" type="checkbox"></label><div><button type="button" class="button button-outline" data-cookie-close>Cancelar</button><button type="button" class="button button-dark" data-cookie-save>Salvar preferências</button></div></div></dialog>`);
    dialog = document.querySelector('#cookie-preferences');
    dialog.querySelector('[data-cookie-close]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-cookie-save]').addEventListener('click', () => saveCookieChoice(dialog.querySelector('#cookie-analytics').checked));
  }
  const saved = JSON.parse(localStorage.getItem(COOKIE_CHOICE_KEY) || 'null');
  dialog.querySelector('#cookie-analytics').checked = Boolean(saved?.analytics);
  dialog.showModal();
}

if (!localStorage.getItem(COOKIE_CHOICE_KEY)) {
  document.body.insertAdjacentHTML('beforeend', `<aside id="cookie-banner" class="cookie-banner" aria-label="Aviso de cookies"><div><strong>Sua privacidade importa</strong><p>Usamos cookies necessários para segurança e login. Cookies opcionais só serão utilizados com sua autorização. <a href="/politica-cookies.html">Política de cookies</a></p></div><div><button class="button button-outline" type="button" data-cookie-reject>Recusar opcionais</button><button class="button button-outline" type="button" data-cookie-customize>Personalizar</button><button class="button button-dark" type="button" data-cookie-accept>Aceitar todos</button></div></aside>`);
  document.querySelector('[data-cookie-reject]').addEventListener('click', () => saveCookieChoice(false));
  document.querySelector('[data-cookie-accept]').addEventListener('click', () => saveCookieChoice(true));
  document.querySelector('[data-cookie-customize]').addEventListener('click', openCookiePreferences);
}

document.querySelectorAll('[data-cookie-settings]').forEach(button => button.addEventListener('click', openCookiePreferences));
