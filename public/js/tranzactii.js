const formular = document.getElementById('form-tranzactie');
const campId = document.getElementById('tranzactie-id');
const campSuma = document.getElementById('suma');
const campTip = document.getElementById('tip');
const campData = document.getElementById('data');
const campCategorie = document.getElementById('categorie');
const campDescriere = document.getElementById('descriere');
const lista = document.getElementById('lista-tranzactii');
const mesajGol = document.getElementById('mesaj-gol');
const titluFormular = document.getElementById('titlu-formular');
const butonSalveaza = document.getElementById('buton-salveaza');
const butonAnuleaza = document.getElementById('buton-anuleaza');

// Transformă 2026-11-15 în 15.11.2026
function formateazaData(d) {
  const p = d.split('-');
  return p[2] + '.' + p[1] + '.' + p[0];
}

// Arată sau ascunde mesajul de eroare al unui câmp
function seteazaEroare(camp, idEroare, mesaj) {
  const element = document.getElementById(idEroare);
  if (mesaj) {
    element.textContent = mesaj;
    camp.classList.add('is-invalid');
  } else {
    camp.classList.remove('is-invalid');
  }
}

// Umple lista de categorii din formular
async function incarcaCategorii() {
  const raspuns = await fetch('/api/categorii');
  const categorii = await raspuns.json();
  campCategorie.innerHTML = '<option value="">Alege categoria...</option>';
  categorii.forEach(function (c) {
    const optiune = document.createElement('option');
    optiune.value = c.id;
    optiune.textContent = c.nume;
    campCategorie.appendChild(optiune);
  });
}

// Afișează tranzacțiile în tabel
async function incarcaTranzactii() {
  const raspuns = await fetch('/api/tranzactii');
  const tranzactii = await raspuns.json();

  lista.innerHTML = '';
  mesajGol.classList.toggle('d-none', tranzactii.length > 0);

  tranzactii.forEach(function (t) {
    const rand = document.createElement('tr');
    const esteVenit = t.tip === 'venit';

    const celulaData = document.createElement('td');
    celulaData.textContent = formateazaData(t.data);

    const celulaDescriere = document.createElement('td');
    celulaDescriere.textContent = t.descriere || '-';

    const celulaCategorie = document.createElement('td');
    celulaCategorie.textContent = t.categorie;

    const celulaSuma = document.createElement('td');
    celulaSuma.className = 'text-end ' + (esteVenit ? 'text-income' : 'text-expense');
    celulaSuma.textContent = (esteVenit ? '+' : '-') + t.suma.toFixed(2) + ' lei';

    const celulaActiuni = document.createElement('td');
    celulaActiuni.className = 'text-end';

    const butonEdit = document.createElement('button');
    butonEdit.className = 'btn btn-sm btn-outline-secondary me-2';
    butonEdit.textContent = 'Editează';
    butonEdit.addEventListener('click', function () {
      campId.value = t.id;
      campSuma.value = t.suma;
      campTip.value = t.tip;
      campData.value = t.data;
      campCategorie.value = t.category_id;
      campDescriere.value = t.descriere || '';
      titluFormular.textContent = 'Editează tranzacția';
      butonSalveaza.textContent = 'Salvează';
      butonAnuleaza.classList.remove('d-none');
      window.scrollTo(0, 0);
    });

    const butonSterge = document.createElement('button');
    butonSterge.className = 'btn btn-sm btn-outline-danger';
    butonSterge.textContent = 'Șterge';
    butonSterge.addEventListener('click', async function () {
      if (!confirm('Sigur vrei să ștergi această tranzacție?')) return;
      await fetch('/api/tranzactii/' + t.id, { method: 'DELETE' });
      incarcaTranzactii();
    });

    celulaActiuni.appendChild(butonEdit);
    celulaActiuni.appendChild(butonSterge);

    rand.appendChild(celulaData);
    rand.appendChild(celulaDescriere);
    rand.appendChild(celulaCategorie);
    rand.appendChild(celulaSuma);
    rand.appendChild(celulaActiuni);
    lista.appendChild(rand);
  });
}

function reseteazaFormular() {
  formular.reset();
  campId.value = '';
  campSuma.classList.remove('is-invalid');
  campData.classList.remove('is-invalid');
  campCategorie.classList.remove('is-invalid');
  titluFormular.textContent = 'Adaugă tranzacție';
  butonSalveaza.textContent = 'Adaugă';
  butonAnuleaza.classList.add('d-none');
}

butonAnuleaza.addEventListener('click', reseteazaFormular);

// Trimiterea formularului, cu validări
formular.addEventListener('submit', async function (e) {
  e.preventDefault();
  let valid = true;

  const suma = parseFloat(campSuma.value);
  if (isNaN(suma) || suma <= 0) {
    seteazaEroare(campSuma, 'eroare-suma', 'Introdu o sumă mai mare ca 0.');
    valid = false;
  } else {
    seteazaEroare(campSuma, 'eroare-suma', '');
  }

  if (campData.value === '') {
    seteazaEroare(campData, 'eroare-data', 'Alege o dată.');
    valid = false;
  } else {
    seteazaEroare(campData, 'eroare-data', '');
  }

  if (campCategorie.value === '') {
    seteazaEroare(campCategorie, 'eroare-categorie', 'Alege o categorie.');
    valid = false;
  } else {
    seteazaEroare(campCategorie, 'eroare-categorie', '');
  }

  if (!valid) return;

  const esteEditare = campId.value !== '';
  const adresa = esteEditare ? '/api/tranzactii/' + campId.value : '/api/tranzactii';
  const metoda = esteEditare ? 'PUT' : 'POST';

  const raspuns = await fetch(adresa, {
    method: metoda,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      suma: suma,
      tip: campTip.value,
      data: campData.value,
      category_id: campCategorie.value,
      descriere: campDescriere.value
    })
  });

  if (!raspuns.ok) {
    const date = await raspuns.json();
    alert(date.eroare);
    return;
  }

  reseteazaFormular();
  incarcaTranzactii();
});

incarcaCategorii();
incarcaTranzactii();