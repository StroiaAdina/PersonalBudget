(async function () {
  const raspuns = await fetch('/api/eu');
  if (raspuns.status === 401) {
    window.location.href = 'login.html';
    return;
  }
  const utilizator = await raspuns.json();

  // Salutul de pe pagina principală
  const salut = document.getElementById('salut');
  if (salut) salut.textContent = 'Bună, ' + utilizator.nume + '!';

  // Butonul din meniu devine "Deconectare"
  const buton = document.querySelector('a[href="login.html"]');
  if (buton) {
    buton.textContent = 'Deconectare';
    buton.href = '#';
    buton.addEventListener('click', async function (e) {
      e.preventDefault();
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = 'login.html';
    });
  }
})();