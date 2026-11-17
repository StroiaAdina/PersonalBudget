const express = require('express');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Utilizator de test (id 1), creat o singură dată
db.prepare(
  "INSERT OR IGNORE INTO users (id, nume, email, parola) VALUES (1, 'Maria', 'maria@exemplu.ro', 'test1234')"
).run();

// ===== CATEGORII =====

// Citire: toate categoriile
app.get('/api/categorii', (req, res) => {
  const categorii = db.prepare('SELECT * FROM categories WHERE user_id = 1').all();
  res.json(categorii);
});

// Creare: adaugă o categorie
app.post('/api/categorii', (req, res) => {
  const nume = (req.body.nume || '').trim();
  if (nume === '') {
    return res.status(400).json({ eroare: 'Numele este obligatoriu' });
  }
  const rezultat = db.prepare('INSERT INTO categories (nume, user_id) VALUES (?, 1)').run(nume);
  res.json({ id: rezultat.lastInsertRowid, nume: nume });
});

// Actualizare: modifică numele unei categorii
app.put('/api/categorii/:id', (req, res) => {
  const nume = (req.body.nume || '').trim();
  if (nume === '') {
    return res.status(400).json({ eroare: 'Numele este obligatoriu' });
  }
  db.prepare('UPDATE categories SET nume = ? WHERE id = ? AND user_id = 1').run(nume, req.params.id);
  res.json({ ok: true });
});

// Ștergere: șterge o categorie (doar dacă nu are tranzacții)
app.delete('/api/categorii/:id', (req, res) => {
  const folosita = db.prepare('SELECT COUNT(*) AS n FROM transactions WHERE category_id = ?').get(req.params.id);
  if (folosita.n > 0) {
    return res.status(400).json({ eroare: 'Categoria are tranzacții și nu poate fi ștearsă' });
  }
  db.prepare('DELETE FROM categories WHERE id = ? AND user_id = 1').run(req.params.id);
  res.json({ ok: true });
});
// ===== TRANZACȚII =====

// Validare comună pentru adăugare și editare
function valideazaTranzactie(corp) {
  const suma = Number(corp.suma);
  if (!(suma > 0)) return 'Suma trebuie să fie un număr pozitiv';
  if (corp.tip !== 'venit' && corp.tip !== 'cheltuiala') return 'Tipul trebuie să fie venit sau cheltuială';
  if (!corp.data) return 'Data este obligatorie';
  if (!corp.category_id) return 'Alege o categorie';
  const categorie = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = 1').get(corp.category_id);
  if (!categorie) return 'Categoria nu există';
  return null;
}

// Citire: toate tranzacțiile, cu numele categoriei
app.get('/api/tranzactii', (req, res) => {
  const tranzactii = db.prepare(`
    SELECT t.id, t.suma, t.tip, t.data, t.descriere, t.category_id, c.nume AS categorie
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = 1
    ORDER BY t.data DESC, t.id DESC
  `).all();
  res.json(tranzactii);
});

// Creare
app.post('/api/tranzactii', (req, res) => {
  const eroare = valideazaTranzactie(req.body);
  if (eroare) return res.status(400).json({ eroare: eroare });
  const b = req.body;
  const rezultat = db.prepare(
    'INSERT INTO transactions (suma, tip, data, descriere, user_id, category_id) VALUES (?, ?, ?, ?, 1, ?)'
  ).run(Number(b.suma), b.tip, b.data, (b.descriere || '').trim(), b.category_id);
  res.json({ id: rezultat.lastInsertRowid });
});

// Actualizare
app.put('/api/tranzactii/:id', (req, res) => {
  const eroare = valideazaTranzactie(req.body);
  if (eroare) return res.status(400).json({ eroare: eroare });
  const b = req.body;
  db.prepare(
    'UPDATE transactions SET suma = ?, tip = ?, data = ?, descriere = ?, category_id = ? WHERE id = ? AND user_id = 1'
  ).run(Number(b.suma), b.tip, b.data, (b.descriere || '').trim(), b.category_id, req.params.id);
  res.json({ ok: true });
});

// Ștergere
app.delete('/api/tranzactii/:id', (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = 1').run(req.params.id);
  res.json({ ok: true });
});
app.listen(PORT, () => {
  console.log('Serverul rulează pe portul ' + PORT);
});