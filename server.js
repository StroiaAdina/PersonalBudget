const express = require('express');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log('Serverul rulează pe portul ' + PORT);
});