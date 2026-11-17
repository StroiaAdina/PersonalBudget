const formular = document.getElementById('form-categorie');
const campNume = document.getElementById('nume');
const campId = document.getElementById('categorie-id');
const eroareNume = document.getElementById('eroare-nume');
const lista = document.getElementById('lista-categorii');
const mesajGol = document.getElementById('mesaj-gol');
const titluFormular = document.getElementById('titlu-formular');
const butonSalveaza = document.getElementById('buton-salveaza');
const butonAnuleaza = document.getElementById('buton-anuleaza');

// Încarcă și afișează categoriile din baza de date
async function incarcaCategorii() {
  const raspuns = await fetch('/api/categorii');
  const categorii = await raspuns.json();

  lista.innerHTML = '';
  mesajGol.classList.toggle('d-none', categorii.length > 0);

  categorii.forEach(function (c) {
    const rand = document.createElement('tr');

    const celulaNume = document.createElement('td');
    celulaNume.textContent = c.nume;

    const celulaActiuni = document.createElement('td');
    celulaActiuni.className = 'text-end';

    const butonEdit = document.createElement('button');
    butonEdit.className = 'btn btn-sm btn-outline-secondary me-2';
    butonEdit.textContent = 'Editează';
    butonEdit.addEventListener('click', function () {
      campId.value = c.id;
      campNume.value = c.nume;
      titluFormular.textContent = 'Editează categoria';
      butonSalveaza.textContent = 'Salvează';
      butonAnuleaza.classList.remove('d-none');
    });

    const butonSterge = document.createElement('button');
    butonSterge.className = 'btn btn-sm btn-outline-danger';
    butonSterge.textContent = 'Șterge';
    butonSterge.addEventListener('click', async function () {
      if (!confirm('Sigur vrei să ștergi categoria "' + c.nume + '"?')) return;
      const r = await fetch('/api/categorii/' + c.id, { method: 'DELETE' });
      if (!r.ok) {
        const date = await r.json();
        alert(date.eroare);
        return;
      }
      incarcaCategorii();
    });

    celulaActiuni.appendChild(butonEdit);
    celulaActiuni.appendChild(butonSterge);
    rand.appendChild(celulaNume);
    rand.appendChild(celulaActiuni);
    lista.appendChild(rand);
  });
}

// Readuce formularul la starea de "adaugă"
function reseteazaFormular() {
  campId.value = '';
  campNume.value = '';
  campNume.classList.remove('is-invalid');
  titluFormular.textContent = 'Adaugă categorie';
  butonSalveaza.textContent = 'Adaugă';
  butonAnuleaza.classList.add('d-none');
}

butonAnuleaza.addEventListener('click', reseteazaFormular);

// Trimiterea formularului, cu validare
formular.addEventListener('submit', async function (e) {
  e.preventDefault();
  const nume = campNume.value.trim();

  if (nume === '') {
    eroareNume.textContent = 'Numele categoriei este obligatoriu.';
    campNume.classList.add('is-invalid');
    return;
  }
  if (nume.length < 2) {
    eroareNume.textContent = 'Numele trebuie să aibă minimum 2 caractere.';
    campNume.classList.add('is-invalid');
    return;
  }
  campNume.classList.remove('is-invalid');

  const esteEditare = campId.value !== '';
  const adresa = esteEditare ? '/api/categorii/' + campId.value : '/api/categorii';
  const metoda = esteEditare ? 'PUT' : 'POST';

  await fetch(adresa, {
    method: metoda,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nume: nume })
  });

  reseteazaFormular();
  incarcaCategorii();
});

incarcaCategorii();