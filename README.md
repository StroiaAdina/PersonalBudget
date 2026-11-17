# BugetulMeu

Aplicație web pentru gestionarea bugetului personal, realizată ca proiect la materia Programare Multimedia.

## Descriere

BugetulMeu ajută utilizatorul să vadă unde se duc banii: poate adăuga venituri și cheltuieli, le poate organiza pe categorii și vede pe pagina principală soldul, totalurile lunii și cheltuielile pe categorii. Fiecare utilizator are cont propriu și vede doar datele lui.

## Funcționalități

- Înregistrare și autentificare (parolele sunt criptate cu bcrypt)
- CRUD complet pentru categorii (adăugare, listare, editare, ștergere)
- CRUD complet pentru tranzacții (venituri și cheltuieli)
- Pagină principală cu sold, venituri și cheltuieli lunare, ultimele tranzacții și bare de progres pe categorii
- Validări JavaScript pentru toate formularele
- Design responsive (desktop și telefon)

## Tehnologii

- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5
- **Backend:** Node.js, Express
- **Bază de date:** SQLite (better-sqlite3)
- **Autentificare:** express-session, bcryptjs
- **Versionare:** Git și GitHub

## Baza de date

Trei tabele, legate prin chei străine:

- `users` (id, nume, email, parola)
- `categories` (id, nume, user_id) - o categorie aparține unui utilizator
- `transactions` (id, suma, tip, data, descriere, user_id, category_id) - o tranzacție aparține unui utilizator și unei categorii

Relații: un utilizator are mai multe categorii și mai multe tranzacții; o categorie are mai multe tranzacții (1:N).

## Instrucțiuni de rulare

1. Instalează Node.js (versiunea 18 sau mai nouă).
2. Clonează proiectul: