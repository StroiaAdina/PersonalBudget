const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(session({
  secret: 'un-secret-pentru-proiect',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static('public'));

// Contul de test (Maria) primește parola criptată
const parolaTest = bcrypt.hashSync('test1234', 10);
db.prepare("INSERT OR IGNORE INTO users (id, nume, email, parola) VALUES (1, 'Maria', 'maria@exemplu.ro', ?)").run(parolaTest);
db.prepare("UPDATE users SET parola = ? WHERE id = 1 AND parola = 'test1234'").run(parolaTest);

// ===== AUTENTIFICARE =====
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Înregistrare
app.post('/api/inregistrare', (req, res) => {
  const nume = (req.body.nume || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const parola = req.body.parola || '';

  if (nume.length < 2) return res.status(400).json({ eroare: 'Numele trebuie să aibă minimum 2 caractere' });
  if (!REGEX_EMAIL.test(email)) return res.status(400).json({ eroare: 'Email invalid' });
  if (parola.length < 8) return res.status(400).json({ eroare: 'Parola trebuie să aibă minimum 8 caractere' });

  const existent = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existent) return res.status(400).json({ eroare: 'Există deja un cont cu acest email' });

  const hash = bcrypt.hashSync(parola, 10);
  const rezultat = db.prepare('INSERT INTO users (nume, email, parola) VALUES (?, ?, ?)').run(nume, email, hash);
  const id = Number(rezultat.lastInsertRowid);

  // Categorii implicite pentru contul nou
  const adauga = db.prepare('INSERT INTO categories (nume, user_id) VALUES (?, ?)');
  ['Mâncare', 'Transport', 'Utilități', 'Distracție', 'Salariu'].forEach(function (c) {
    adauga.run(c, id);
  });

  req.session.userId = id;
  res.json({ ok: true });
});

// Login
app.post('/api/login', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const parola = req.body.parola || '';
  const utilizator = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!utilizator || !bcrypt.compareSync(parola, utilizator.parola)) {
    return res.status(401).json({ eroare: 'Email sau parolă incorectă' });
  }
  req.session.userId = utilizator.id;
  res.json({ ok: true });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(function () {
    res.json({ ok: true });
  });
});

// De aici în jos, toate rutele /api cer utilizator logat
app.use('/api', (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ eroare: 'Nu ești autentificat' });
  next();
});

// Datele utilizatorului curent
app.get('/api/eu', (req, res) => {
  const u = db.prepare('SELECT id, nume, email FROM users WHERE id = ?').get(req.session.userId);
  res.json(u);
});

// ===== CATEGORII =====
app.get('/api/categorii', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories WHERE user_id = ?').all(req.session.userId));
});

app.post('/api/categorii', (req, res) => {
  const nume = (req.body.nume || '').trim();
  if (nume === '') return res.status(400).json({ eroare: 'Numele este obligatoriu' });
  const rezultat = db.prepare('INSERT INTO categories (nume, user_id) VALUES (?, ?)').run(nume, req.session.userId);
  res.json({ id: rezultat.lastInsertRowid, nume: nume });
});

app.put('/api/categorii/:id', (req, res) => {
  const nume = (req.body.nume || '').trim();
  if (nume === '') return res.status(400).json({ eroare: 'Numele este obligatoriu' });
  db.prepare('UPDATE categories SET nume = ? WHERE id = ? AND user_id = ?').run(nume, req.params.id, req.session.userId);
  res.json({ ok: true });
});

app.delete('/api/categorii/:id', (req, res) => {
  const folosita = db.prepare('SELECT COUNT(*) AS n FROM transactions WHERE category_id = ?').get(req.params.id);
  if (folosita.n > 0) {
    return res.status(400).json({ eroare: 'Categoria are tranzacții și nu poate fi ștearsă' });
  }
  db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(req.params.id, req.session.userId);
  res.json({ ok: true });
});

// ===== TRANZACȚII =====
function valideazaTranzactie(corp, userId) {
  const suma = Number(corp.suma);
  if (!(suma > 0)) return 'Suma trebuie să fie un număr pozitiv';
  if (corp.tip !== 'venit' && corp.tip !== 'cheltuiala') return 'Tipul trebuie să fie venit sau cheltuială';
  if (!corp.data) return 'Data este obligatorie';
  if (!corp.category_id) return 'Alege o categorie';
  const categorie = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(corp.category_id, userId);
  if (!categorie) return 'Categoria nu există';
  return null;
}

app.get('/api/tranzactii', (req, res) => {
  const tranzactii = db.prepare(`
    SELECT t.id, t.suma, t.tip, t.data, t.descriere, t.category_id, c.nume AS categorie
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
    ORDER BY t.data DESC, t.id DESC
  `).all(req.session.userId);
  res.json(tranzactii);
});

app.post('/api/tranzactii', (req, res) => {
  const eroare = valideazaTranzactie(req.body, req.session.userId);
  if (eroare) return res.status(400).json({ eroare: eroare });
  const b = req.body;
  const rezultat = db.prepare(
    'INSERT INTO transactions (suma, tip, data, descriere, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(Number(b.suma), b.tip, b.data, (b.descriere || '').trim(), req.session.userId, b.category_id);
  res.json({ id: rezultat.lastInsertRowid });
});

app.put('/api/tranzactii/:id', (req, res) => {
  const eroare = valideazaTranzactie(req.body, req.session.userId);
  if (eroare) return res.status(400).json({ eroare: eroare });
  const b = req.body;
  db.prepare(
    'UPDATE transactions SET suma = ?, tip = ?, data = ?, descriere = ?, category_id = ? WHERE id = ? AND user_id = ?'
  ).run(Number(b.suma), b.tip, b.data, (b.descriere || '').trim(), b.category_id, req.params.id, req.session.userId);
  res.json({ ok: true });
});

app.delete('/api/tranzactii/:id', (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(req.params.id, req.session.userId);
  res.json({ ok: true });
});

// ===== REZUMAT PENTRU PAGINA PRINCIPALĂ =====
app.get('/api/rezumat', (req, res) => {
  const uid = req.session.userId;
  const luna = new Date().toISOString().slice(0, 7);

  const sold = db.prepare(
    "SELECT COALESCE(SUM(CASE WHEN tip = 'venit' THEN suma ELSE -suma END), 0) AS v FROM transactions WHERE user_id = ?"
  ).get(uid).v;

  const venituri = db.prepare(
    "SELECT COALESCE(SUM(suma), 0) AS v FROM transactions WHERE user_id = ? AND tip = 'venit' AND data LIKE ?"
  ).get(uid, luna + '%').v;

  const cheltuieli = db.prepare(
    "SELECT COALESCE(SUM(suma), 0) AS v FROM transactions WHERE user_id = ? AND tip = 'cheltuiala' AND data LIKE ?"
  ).get(uid, luna + '%').v;

  const ultimele = db.prepare(`
    SELECT t.suma, t.tip, t.data, t.descriere, c.nume AS categorie
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
    ORDER BY t.data DESC, t.id DESC
    LIMIT 5
  `).all(uid);

  const peCategorii = db.prepare(`
    SELECT c.nume AS categorie, SUM(t.suma) AS total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.tip = 'cheltuiala' AND t.data LIKE ?
    GROUP BY c.id
    ORDER BY total DESC
  `).all(uid, luna + '%');

  res.json({ sold, venituri, cheltuieli, ultimele, peCategorii });
});

app.listen(PORT, () => {
  console.log('Serverul rulează pe portul ' + PORT);
});