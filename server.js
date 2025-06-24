import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fsSync from 'fs'; // Importar fsSync para uso síncrono

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

// --- Subida de imágenes ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fsSync.existsSync(uploadDir)) {
    fsSync.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
});

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API de productos (JSON) ---
app.get('/products', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'products.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.json([]); // Si no existe el archivo, devuelve array vacío
        } else {
            res.status(500).json({ error: 'Error al leer productos' });
        }
    }
});

app.post('/products', express.json(), async (req, res) => {
    try {
        await fs.writeFile(path.join(__dirname, 'products.json'), JSON.stringify(req.body, null, 2));
        res.json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar productos' });
    }
});

// Ruta para borrar todos los productos
app.delete('/products', async (req, res) => {
    try {
        await fs.writeFile(path.join(__dirname, 'products.json'), '[]', 'utf8');
        res.json({ status: 'ok', message: 'Todos los productos han sido eliminados.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'No se pudo limpiar la base de datos.' });
    }
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