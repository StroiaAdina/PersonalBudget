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

app.listen(PORT, () => {
  console.log('Serverul rulează pe portul ' + PORT);
});