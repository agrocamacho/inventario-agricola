const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para servir archivos estáticos
app.get('/:file', (req, res) => {
    const file = req.params.file;
    res.sendFile(path.join(__dirname, file));
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).send('Archivo no encontrado');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 