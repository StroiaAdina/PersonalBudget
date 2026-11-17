// Formatează un număr: 1234.5 -> 1.234,50 lei
function formateazaSuma(n) {
  return n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' lei';
}

// 2026-11-15 -> 15.11.2026
function formateazaData(d) {
  const p = d.split('-');
  return p[2] + '.' + p[1] + '.' + p[0];
}

async function incarcaRezumat() {
  const raspuns = await fetch('/api/rezumat');
  const date = await raspuns.json();

  // Cardurile de sus
  document.getElementById('sold').textContent = formateazaSuma(date.sold);
  document.getElementById('venituri').textContent = formateazaSuma(date.venituri);
  document.getElementById('cheltuieli').textContent = formateazaSuma(date.cheltuieli);

  // Ultimele tranzacții
  const corpTabel = document.getElementById('ultimele-tranzactii');
  corpTabel.innerHTML = '';
  document.getElementById('mesaj-gol').classList.toggle('d-none', date.ultimele.length > 0);

  date.ultimele.forEach(function (t) {
    const esteVenit = t.tip === 'venit';
    const rand = document.createElement('tr');

    const valori = [formateazaData(t.data), t.descriere || '-', t.categorie];
    valori.forEach(function (v) {
      const celula = document.createElement('td');
      celula.textContent = v;
      rand.appendChild(celula);
    });

    const celulaSuma = document.createElement('td');
    celulaSuma.className = 'text-end ' + (esteVenit ? 'text-income' : 'text-expense');
    celulaSuma.textContent = (esteVenit ? '+' : '-') + formateazaSuma(t.suma);
    rand.appendChild(celulaSuma);

    corpTabel.appendChild(rand);
  });

  // Cheltuieli pe categorii (procent din total)
  const zonaCategorii = document.getElementById('pe-categorii');
  zonaCategorii.innerHTML = '';
  document.getElementById('mesaj-gol-categorii').classList.toggle('d-none', date.peCategorii.length > 0);

  date.peCategorii.forEach(function (c) {
    const procent = Math.round((c.total / date.cheltuieli) * 100);

    const eticheta = document.createElement('p');
    eticheta.className = 'mb-1';
    eticheta.textContent = c.categorie + ' ';
    const suma = document.createElement('span');
    suma.className = 'float-end';
    suma.textContent = formateazaSuma(c.total) + ' (' + procent + '%)';
    eticheta.appendChild(suma);

    const bara = document.createElement('div');
    bara.className = 'progress mb-3';
    const umplutura = document.createElement('div');
    umplutura.className = 'progress-bar bar-ok';
    umplutura.style.width = procent + '%';
    bara.appendChild(umplutura);

    zonaCategorii.appendChild(eticheta);
    zonaCategorii.appendChild(bara);
  });
}

incarcaRezumat();