const express = require('express');
const app = express();
const PORT = 3000;

// Folderul "public" conține paginile site-ului
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log('Serverul rulează pe portul ' + PORT);
});