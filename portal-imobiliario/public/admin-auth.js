const ADMIN_API_BASE_URL = (
  window.BARTARIN_API_URL ||
  document.querySelector('meta[name="api-base-url"]')?.content ||
  `${window.location.protocol}//${window.location.hostname || 'localhost'}:5000`
).replace(/\/$/, '');

function clearAdminSession() {
  ['bartarin-auth-token', 'bartarin-auth-user'].forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

document.querySelectorAll('[data-admin-logout]').forEach(button => {
  button.addEventListener('click', async () => {
    button.disabled = true;
    const token = localStorage.getItem('bartarin-auth-token') || sessionStorage.getItem('bartarin-auth-token');
    try {
      await fetch(`${ADMIN_API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
    } catch {
      // Mesmo com a API indisponível, encerra a sessão armazenada no navegador.
    } finally {
      clearAdminSession();
      window.location.replace('/login.html');
    }
  });
});
