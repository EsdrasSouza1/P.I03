document.querySelectorAll('.show-password').forEach(button => button.addEventListener('click', () => {
  const input = button.parentElement.querySelector('input');
  input.type = input.type === 'password' ? 'text' : 'password';
  button.setAttribute('aria-label', input.type === 'password' ? 'Mostrar senha' : 'Ocultar senha');
}));

document.querySelectorAll('[data-auth-form]').forEach(form => form.addEventListener('submit', event => {
  event.preventDefault();
  const message = form.querySelector('.form-message');
  const mode = form.dataset.authForm;
  message.classList.add('error');
  const messages = {
    login: 'Tela demonstrativa: nenhum login foi realizado e nenhuma sessão foi criada.',
    register: 'Tela demonstrativa: seus dados não foram enviados nem armazenados.',
    recovery: 'Tela demonstrativa: nenhuma mensagem foi enviada.'
  };
  message.textContent = messages[mode];
}));
