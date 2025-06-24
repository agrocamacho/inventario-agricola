import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Ruta para guardar productos
app.post('/save-products', async (req, res) => {
    try {
        const xmlData = req.body.xmlData;
        await fs.writeFile('products.xml', xmlData);
        res.json({ success: true, message: 'Productos guardados exitosamente' });
    } catch (error) {
        console.error('Error al guardar productos:', error);
        res.status(500).json({ success: false, message: 'Error al guardar los productos' });
    }
});

// Ruta para cargar productos
app.get('/load-products', async (req, res) => {
    try {
        const xmlData = await fs.readFile('products.xml', 'utf8');
        res.json({ success: true, data: xmlData });
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Si el archivo no existe, devolver un XML vacío
            res.json({ success: true, data: '<?xml version="1.0"?><products></products>' });
        } else {
            console.error('Error al cargar productos:', error);
            res.status(500).json({ success: false, message: 'Error al cargar los productos' });
        }
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('¡Algo salió mal!');
});

// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
    console.log('Directorio actual:', __dirname);
}); 