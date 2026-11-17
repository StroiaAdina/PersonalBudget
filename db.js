const Database = require('better-sqlite3');

// Creează (sau deschide) fișierul bazei de date
const db = new Database('buget.db');

// Activează legăturile între tabele
db.pragma('foreign_keys = ON');

// Tabelul 1: utilizatori
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nume TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    parola TEXT NOT NULL
  )
`);

// Tabelul 2: categorii (fiecare aparține unui utilizator)
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nume TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Tabelul 3: tranzacții (aparțin unui utilizator și unei categorii)
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suma REAL NOT NULL,
    tip TEXT NOT NULL,
    data TEXT NOT NULL,
    descriere TEXT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )
`);

module.exports = db;