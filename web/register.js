const form = document.querySelector('#register-form');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const confirmInput = document.querySelector('#confirm-password');
const alertBox = document.querySelector('#form-alert');

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function markInvalid(input, invalid) {
  input.classList.toggle('is-invalid', invalid);
  input.setAttribute('aria-invalid', String(invalid));
}

document.querySelectorAll('[data-toggle-password]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.togglePassword);
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    button.textContent = showing ? 'Mostrar' : 'Ocultar';
    button.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const validName = nameInput.value.trim().length >= 2;
  const validMail = validEmail(emailInput.value);
  const validPassword = passwordInput.value.length >= 8;
  const passwordsMatch = confirmInput.value === passwordInput.value && confirmInput.value.length > 0;
  markInvalid(nameInput, !validName);
  markInvalid(emailInput, !validMail);
  markInvalid(passwordInput, !validPassword);
  markInvalid(confirmInput, !passwordsMatch);
  alertBox.classList.remove('visible');

  if (!validName || !validMail || !validPassword || !passwordsMatch) {
    alertBox.textContent = 'Confira os campos destacados antes de continuar.';
    alertBox.classList.add('visible');
    [nameInput, emailInput, passwordInput, confirmInput].find((input) => input.classList.contains('is-invalid'))?.focus();
    return;
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.value.trim(), email: emailInput.value.trim(), password: passwordInput.value }),
    });
    if (!response.ok) {
      alertBox.textContent = await response.text();
      alertBox.classList.add('visible');
      return;
    }
    window.location.assign('/entrar?registered=1');
  } catch {
    alertBox.textContent = 'Não foi possível conectar ao servidor local.';
    alertBox.classList.add('visible');
  }
});
