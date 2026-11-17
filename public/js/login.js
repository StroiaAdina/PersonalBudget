const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Arată sau ascunde eroarea unui câmp
function seteazaEroare(idCamp, idEroare, mesaj) {
  const camp = document.getElementById(idCamp);
  const eroare = document.getElementById(idEroare);
  if (mesaj) {
    eroare.textContent = mesaj;
    camp.classList.add('is-invalid');
    return false;
  }
  camp.classList.remove('is-invalid');
  return true;
}

// Trimite datele la server; întoarce eroarea (text) sau null dacă a mers
async function trimite(adresa, date) {
  const raspuns = await fetch(adresa, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(date)
  });
  if (raspuns.ok) return null;
  const rezultat = await raspuns.json();
  return rezultat.eroare;
}

// ----- Login -----
document.getElementById('form-login').addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const parola = document.getElementById('login-parola').value;
  const mesaj = document.getElementById('mesaj-login');
  mesaj.classList.add('d-none');

  let valid = true;
  valid = seteazaEroare('login-email', 'eroare-login-email', REGEX_EMAIL.test(email) ? '' : 'Introdu un email valid.') && valid;
  valid = seteazaEroare('login-parola', 'eroare-login-parola', parola === '' ? 'Introdu parola.' : '') && valid;
  if (!valid) return;

  const eroare = await trimite('/api/login', { email: email, parola: parola });
  if (eroare) {
    mesaj.textContent = eroare;
    mesaj.classList.remove('d-none');
    return;
  }
  window.location.href = 'index.html';
});

// ----- Înregistrare -----
document.getElementById('form-inregistrare').addEventListener('submit', async function (e) {
  e.preventDefault();
  const nume = document.getElementById('reg-nume').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const parola = document.getElementById('reg-parola').value;
  const parola2 = document.getElementById('reg-parola2').value;
  const mesaj = document.getElementById('mesaj-reg');
  mesaj.classList.add('d-none');

  let valid = true;
  valid = seteazaEroare('reg-nume', 'eroare-reg-nume', nume.length < 2 ? 'Numele trebuie să aibă minimum 2 caractere.' : '') && valid;
  valid = seteazaEroare('reg-email', 'eroare-reg-email', REGEX_EMAIL.test(email) ? '' : 'Introdu un email valid.') && valid;
  valid = seteazaEroare('reg-parola', 'eroare-reg-parola', parola.length < 8 ? 'Parola trebuie să aibă minimum 8 caractere.' : '') && valid;
  valid = seteazaEroare('reg-parola2', 'eroare-reg-parola2', parola2 !== parola ? 'Parolele nu coincid.' : '') && valid;
  if (!valid) return;

  const eroare = await trimite('/api/inregistrare', { nume: nume, email: email, parola: parola });
  if (eroare) {
    mesaj.textContent = eroare;
    mesaj.classList.remove('d-none');
    return;
  }
  window.location.href = 'index.html';
});