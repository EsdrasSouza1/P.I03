const form = document.querySelector('#login-form');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const alertBox = document.querySelector('#form-alert');

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function setInvalid(input, invalid) {
  input.classList.toggle('is-invalid', invalid);
  input.setAttribute('aria-invalid', String(invalid));
}

emailInput.addEventListener('input', () => {
  if (emailInput.value.trim()) setInvalid(emailInput, !validateEmail(emailInput.value));
});

passwordInput.addEventListener('input', () => {
  if (passwordInput.value) setInvalid(passwordInput, passwordInput.value.length < 8);
});

document.querySelector('#toggle-password').addEventListener('click', (event) => {
  const showing = passwordInput.type === 'text';
  passwordInput.type = showing ? 'password' : 'text';
  event.currentTarget.textContent = showing ? 'Mostrar' : 'Ocultar';
  event.currentTarget.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const emailValid = validateEmail(emailInput.value);
  const passwordValid = passwordInput.value.length >= 8;
  setInvalid(emailInput, !emailValid);
  setInvalid(passwordInput, !passwordValid);
  alertBox.classList.remove('visible');

  if (!emailValid || !passwordValid) {
    alertBox.textContent = 'Confira os campos destacados antes de continuar.';
    alertBox.classList.add('visible');
    (!emailValid ? emailInput : passwordInput).focus();
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.value.trim(), password: passwordInput.value }),
    });

    if (!response.ok) {
      const serverMessage = (await response.text()).trim();
      alertBox.textContent = serverMessage || (response.status === 401 ? 'E-mail ou senha incorretos.' : `Não foi possível entrar (erro ${response.status}).`);
      alertBox.classList.add('visible');
      return;
    }

    window.location.assign('/dashboard');
  } catch {
    alertBox.textContent = 'Não foi possível conectar ao servidor local.';
    alertBox.classList.add('visible');
  }
});

document.querySelector('#forgot-link').addEventListener('click', (event) => {
  event.preventDefault();
  alertBox.textContent = 'A recuperação de senha será disponibilizada quando a autenticação for integrada.';
  alertBox.classList.add('visible');
});
