# Sistema de Inventario Agro Camacho

Sistema de gestión de inventario para Agro Camacho con análisis financiero y control de períodos.

## Características

- **Gestión de Productos**: Agregar, editar y eliminar productos
- **Control de Stock**: Entradas y salidas de inventario
- **Análisis Financiero**: Cálculo de ganancias potenciales y valores de inventario
- **Períodos de Control**: Organización por períodos de tiempo
- **Filtros y Búsqueda**: Búsqueda por nombre y filtros por etiquetas
- **Interfaz Responsiva**: Optimizada para móviles y escritorio
- **Autenticación**: Sistema de login para administradores
- **Base de Datos Firebase**: Almacenamiento en la nube

## Despliegue en Render

### Pasos para desplegar:

1. **Crear cuenta en Render**:
   - Ve a [render.com](https://render.com)
   - Crea una cuenta gratuita

2. **Crear nuevo Web Service**:
   - En el dashboard de Render, haz clic en "New +"
   - Selecciona "Web Service"
   - Conecta tu repositorio de GitHub

3. **Configurar el servicio**:
   - **Name**: `agrocamacho-inventory` (o el nombre que prefieras)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Variables de entorno** (opcional):
   - `PORT`: 3000 (por defecto)

5. **Desplegar**:
   - Haz clic en "Create Web Service"
   - Render construirá y desplegará tu aplicación automáticamente

### Estructura del proyecto:

```
ser/
├── index.html          # Página principal
├── script.js           # Lógica de la aplicación
├── styles.css          # Estilos CSS
├── server.js           # Servidor Express
├── package.json        # Dependencias de Node.js
├── tags.js            # Configuración de etiquetas
├── products.json      # Datos de productos (opcional)
└── uploads/           # Carpeta para imágenes subidas
```

### Configuración de Firebase:

El proyecto usa Firebase Realtime Database. Asegúrate de que tu configuración de Firebase esté correcta en `script.js`:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "tu-sender-id",
  appId: "tu-app-id"
};
```

## Uso Local

Para ejecutar localmente:

```bash
npm install
npm start
```

Luego abre `http://localhost:3000` en tu navegador.

## Notas Importantes

- El sistema usa Firebase para almacenamiento de datos
- Las imágenes se almacenan localmente en la carpeta `uploads/`
- La autenticación es simple (admin/admin por defecto)
- El sistema es completamente responsivo

## Solución de Problemas

### Problema: Las ventas y ganancias no se actualizan al editar el historial

**Solución**: Se ha corregido el problema en la función `editPeriodModal`. Ahora cuando se edita un período, se recalculan automáticamente las ventas y ganancias basadas en los nuevos valores de stock y precios.

### Problema: Error de CORS

**Solución**: El servidor ya incluye middleware CORS configurado correctamente.

### Problema: Archivos no encontrados

**Solución**: Asegúrate de que todos los archivos estén en la raíz del proyecto y que el servidor esté configurado correctamente. 