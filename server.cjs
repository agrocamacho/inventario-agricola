const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

// Permitir CORS y JSON
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta actual
app.use(express.static(__dirname));

// API de productos
const DATA_FILE = 'products.json';

// Obtener productos
app.get('/products', (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } else {
        res.json([]);
    }
});

// Guardar productos
app.post('/products', (req, res) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ status: 'ok' });
});

// Borrar todos los productos
app.delete('/products', (req, res) => {
    fs.writeFileSync(DATA_FILE, '[]');
    res.json({ status: 'ok', message: 'Todos los productos han sido eliminados.' });
});

// Iniciar el servidor en todas las interfaces
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor corriendo en http://<TU_IP_LOCAL>:${PORT}`)); 