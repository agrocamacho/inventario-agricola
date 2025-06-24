# Control de Inventario Agrícola

Una aplicación web moderna para el control y gestión de inventarios de productos agrícolas, con un diseño inspirado en macOS.

## Características

- Gestión completa de productos agrícolas
- Control de stock con entradas y salidas
- Seguimiento de períodos de tiempo
- Cálculo automático de:
  - Precio de costo unitario
  - Precio de venta de existencia
  - Ganancia potencial
  - Ganancia real por ventas
- Almacenamiento local en formato XML
- Interfaz moderna y responsiva
- Diseño inspirado en macOS

## Cómo usar

1. Abre el archivo `index.html` en tu navegador web
2. Para agregar un nuevo producto:
   - Haz clic en el botón "+ Nuevo Producto"
   - Completa el formulario con los datos del producto
   - Haz clic en "Guardar"

3. Para gestionar el stock:
   - Selecciona un producto de la lista
   - Usa los campos de entrada/salida para modificar el stock
   - Los cálculos se actualizarán automáticamente

4. Para crear un nuevo período:
   - Haz clic en "Nuevo Período"
   - Ingresa el nombre del período
   - Los datos se guardarán separadamente para cada período

5. Para editar un producto:
   - Selecciona el producto
   - Haz clic en el botón de edición (✎) junto al campo que deseas modificar
   - Ingresa el nuevo valor

## Almacenamiento

La aplicación guarda todos los datos en el almacenamiento local del navegador en formato XML. Cada período se guarda por separado, permitiendo un seguimiento histórico de los productos.

## Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- JavaScript habilitado
- Almacenamiento local del navegador disponible

## Notas

- Los datos se guardan automáticamente en el navegador
- Se recomienda hacer copias de seguridad periódicas de los datos
- La aplicación funciona completamente en el navegador, no requiere servidor 