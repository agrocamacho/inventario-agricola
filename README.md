# Control de Inventario Agrícola

Sistema de control de inventario para productos agrícolas con gestión de stock, períodos de venta y análisis financiero.

## Características Principales

- **Gestión de Productos**: Agregar, editar y eliminar productos con información detallada
- **Control de Stock**: Entradas y salidas de inventario con seguimiento automático
- **Análisis Financiero**: Cálculo de ganancias potenciales y valores de inventario
- **Períodos de Venta**: Organización de datos por períodos específicos
- **Sistema de Etiquetas**: Clasificación de productos por categorías
- **Imágenes de Productos**: Soporte para URLs de imágenes externas
- **Interfaz Responsiva**: Funciona en dispositivos móviles y de escritorio
- **Base de Datos Firebase**: Almacenamiento en la nube con sincronización en tiempo real

## Funcionalidades de Imágenes

### Sistema de URLs de Imagen
- **Entrada de URL**: Los usuarios pueden ingresar URLs directas de imágenes
- **Validación**: Sistema de validación que verifica URLs válidas (http:// o https://)
- **Previsualización**: Vista previa de imágenes en tiempo real
- **Manejo de Errores**: Fallback automático a imagen placeholder si la URL no carga
- **Edición**: Botón para cambiar la imagen de productos existentes

### Cómo Usar las Imágenes
1. **Nuevo Producto**: En el formulario de producto, ingresa la URL de la imagen
2. **Editar Imagen**: Haz clic en el botón de editar imagen (✎) en la vista de producto
3. **URLs Válidas**: Deben comenzar con `http://` o `https://`
4. **Placeholder**: Si no se ingresa URL o hay error, se usa imagen por defecto

### Ejemplos de URLs de Imagen
- `https://via.placeholder.com/300x200/007AFF/FFFFFF?text=Producto`
- `https://picsum.photos/300/200`
- `https://ejemplo.com/imagen.jpg`

## Instalación y Uso

1. **Clonar el repositorio**
2. **Instalar dependencias**: `npm install`
3. **Configurar Firebase**: Actualizar configuración en `script.js`
4. **Ejecutar servidor**: `node server.js`
5. **Acceder**: Abrir `http://localhost:3000`

## Estructura del Proyecto

```
ser/
├── index.html          # Interfaz principal
├── script.js           # Lógica de la aplicación
├── styles.css          # Estilos CSS
├── server.js           # Servidor Express
├── tags.js             # Gestión de etiquetas
├── products.json       # Datos de productos (backup)
├── placeholder.svg     # Imagen por defecto
└── uploads/            # Directorio de imágenes (legacy)
```

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Base de Datos**: Firebase Realtime Database
- **Almacenamiento**: URLs de imágenes externas
- **UI/UX**: Diseño inspirado en iOS con componentes modernos

## Cambios Recientes

### Sistema de Imágenes por URL (Última Actualización)
- ✅ Reemplazado sistema de subida de archivos por URLs
- ✅ Validación de URLs en tiempo real
- ✅ Previsualización de imágenes
- ✅ Manejo de errores de carga
- ✅ Botón de edición de imagen mejorado
- ✅ Compatibilidad con Firebase

## Contribuir

1. Fork el proyecto
2. Crear rama para nueva funcionalidad
3. Commit los cambios
4. Push a la rama
5. Abrir Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. 