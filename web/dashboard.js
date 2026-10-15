const sections = {
  feed: {
    eyebrow: 'MYBOOK · FEED',
    title: 'Seu feed começa aqui.',
    description: 'Ainda não há publicações. Quando você e outras pessoas começarem a compartilhar leituras, elas vão aparecer neste espaço.',
    action: 'Conhecer a área de livros',
    actionTab: 'books',
  },
  library: {
    eyebrow: 'MINHA BIBLIOTECA',
    title: 'Sua biblioteca está vazia.',
    description: 'Os livros que você adicionar vão aparecer aqui. Depois, podemos organizar sua estante por Quero ler, Lendo e Já li.',
    action: 'Ir para Livros',
    actionTab: 'books',
  },
  books: {
    eyebrow: 'LIVROS',
    title: 'Vamos começar pelo catálogo.',
    description: 'Ainda não há livros cadastrados. Esta área está vazia para começarmos a montar o catálogo juntos.',
  },
  agora: {
    eyebrow: 'ÁGORA DO LIVRO',
    title: 'A conversa começa quando você quiser.',
    description: 'Ainda não há grupos nem discussões. Vamos construir esta área do zero, com espaço para conversar sobre livros e temas em comum.',
  },
  recommendations: {
    eyebrow: 'RECOMENDAÇÕES',
    title: 'Nenhuma recomendação por enquanto.',
    description: 'Quando o catálogo e sua biblioteca começarem a tomar forma, poderemos pensar em como sugerir novas leituras.',
  },
  store: {
    eyebrow: 'LOJA',
    title: 'A loja está vazia.',
    description: 'Ainda não há livros ou ofertas aqui. Vamos decidir como esta área vai funcionar antes de adicionar conteúdo.',
  },
  profile: {
    eyebrow: 'MINHA CONTA',
    title: 'Seu perfil começa em branco.',
    description: 'Ainda não há informações de perfil para mostrar. Podemos acrescentar seus dados e preferências quando esta área for construída.',
  },
};

const title = document.querySelector('#view-title');
const eyebrow = document.querySelector('#view-eyebrow');
const description = document.querySelector('#view-description');
const action = document.querySelector('#view-action');
const emptyState = document.querySelector('.mybook-empty-state');
const libraryBookList = document.querySelector('#library-book-list');
const libraryStorageKey = 'mybook.library.current-session';

function getLibraryBooks() {
  try {
    const savedBooks = JSON.parse(window.sessionStorage.getItem(libraryStorageKey) || '[]');
    return Array.isArray(savedBooks) ? savedBooks : [];
  } catch {
    return [];
  }
}

function renderLibraryBooks() {
  libraryBookList.replaceChildren();
  const books = getLibraryBooks();
  const heading = document.createElement('header');
  heading.className = 'library-list-heading';
  const headingTitle = document.createElement('h1');
  headingTitle.textContent = 'Minha Biblioteca';
  const count = document.createElement('p');
  count.textContent = `${books.length} ${books.length === 1 ? 'livro na estante' : 'livros na estante'}`;
  heading.append(headingTitle, count);
  libraryBookList.append(heading);

  books.forEach((book) => {
    const item = document.createElement('article');
    item.className = 'library-book-item';
    const cover = document.createElement('div');
    cover.className = 'library-book-cover';
    cover.setAttribute('aria-hidden', 'true');
    cover.textContent = book.title;
    const copy = document.createElement('div');
    copy.className = 'library-book-copy';
    const status = document.createElement('span');
    status.className = 'library-book-status';
    status.textContent = { 'quero-ler': 'Quero ler', lendo: 'Lendo', lido: 'Já li' }[book.status] || 'Quero ler';
    const bookTitle = document.createElement('h2');
    bookTitle.textContent = book.title;
    const author = document.createElement('p');
    author.textContent = book.author;
    copy.append(status, bookTitle, author);
    item.append(cover, copy);
    libraryBookList.append(item);
  });
}

function renderSection(sectionName) {
  const key = sections[sectionName] ? sectionName : 'feed';
  const section = sections[key];
  eyebrow.textContent = section.eyebrow;
  title.textContent = section.title;
  description.textContent = section.description;
  document.title = `${section.eyebrow.split(' · ').at(-1)} | Mybook`;

  if (section.action) {
    action.hidden = false;
    action.href = `/dashboard?tab=${section.actionTab}`;
    action.dataset.tab = section.actionTab;
    action.innerHTML = `${section.action} <span aria-hidden="true">→</span>`;
  } else {
    action.hidden = true;
  }

  const hasLibraryBooks = key === 'library' && getLibraryBooks().length > 0;
  emptyState.hidden = hasLibraryBooks;
  libraryBookList.hidden = key !== 'library' || !hasLibraryBooks;
  document.querySelector('.empty-state-footnote').hidden = hasLibraryBooks;
  if (key === 'library' && hasLibraryBooks) renderLibraryBooks();

  document.querySelectorAll('[data-tab]').forEach((link) => {
    const active = link.dataset.tab === key;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function navigateTo(sectionName, shouldPush = true) {
  const key = sections[sectionName] ? sectionName : 'feed';
  if (shouldPush) window.history.pushState({ tab: key }, '', `/dashboard?tab=${key}`);
  renderSection(key);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', (event) => {
  if (event.target.closest('#add-book-button, #add-book-mobile')) {
    document.querySelector('#add-book-dialog').showModal();
    document.querySelector('#book-title').focus();
    return;
  }

  if (event.target.closest('[data-close-dialog]')) {
    document.querySelector('#add-book-dialog').close();
    return;
  }

  const link = event.target.closest('[data-tab]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigateTo(link.dataset.tab);
});

document.querySelector('#add-book-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const title = String(formData.get('title') || '').trim();
  const author = String(formData.get('author') || '').trim();
  if (!title || !author) {
    form.reportValidity();
    return;
  }

  const books = getLibraryBooks();
  books.unshift({
    title,
    author,
    status: String(formData.get('status') || 'quero-ler'),
  });
  window.sessionStorage.setItem(libraryStorageKey, JSON.stringify(books));
  form.reset();
  document.querySelector('#add-book-dialog').close();
  navigateTo('library');
});

window.addEventListener('popstate', () => {
  renderSection(new URLSearchParams(window.location.search).get('tab') || 'feed');
});

document.querySelectorAll('[data-logout], #logout-button').forEach((button) => {
  button.addEventListener('click', async () => {
    window.sessionStorage.removeItem(libraryStorageKey);
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      window.location.assign('/');
    }
  });
});

renderSection(new URLSearchParams(window.location.search).get('tab') || 'feed');
