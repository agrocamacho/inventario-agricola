// Global variables
let products = [];
let currentProductIndex = -1;
let periods = [];
let elements = null;
let currentPeriod = 'current';
let selectedFilterTag = '';
let isAlphaSortActive = false;
let searchQuery = '';

// Variables para rastrear cambios pendientes por producto
let pendingChangesByProduct = {};
let originalValuesByProduct = {};

// DOM Elements
let productList;
let productDetails;
let productModal;
let productForm;
let addProductBtn;
let deleteProductBtn;
let closeModalBtn;
let prevProductBtn;
let nextProductBtn;
let periodSelect;
let newPeriodBtn;
let stockIn;
let stockOut;
let addStockBtn;
let removeStockBtn;
let productName;
let unitPrice;
let salePrice;
let currentStock;
let productImage;
let totalInventoryValue;
let totalProducts;
let totalPotentialProfit;
let statsPanel;
let mainContainer;
let viewInventoryBtn;

// Login Logic
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const closeLoginModal = document.getElementById('closeLoginModal');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// Inicialización de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDqb4BuMMc33r9C6I-XVLfpgAJH52oeM5Y",
  authDomain: "agrocamacho-5d82f.firebaseapp.com",
  databaseURL: "https://agrocamacho-5d82f-default-rtdb.firebaseio.com",
  projectId: "agrocamacho-5d82f",
  storageBucket: "agrocamacho-5d82f.appspot.com",
  messagingSenderId: "106322718569",
  appId: "1:106322718569:web:b45ef3bc137810db6717f8",
  measurementId: "G-6B4V6DCZZ8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function isLoggedIn() {
  return localStorage.getItem('isAdmin') === 'true';
}

function showFinancialData(show) {
  // Oculta o muestra los elementos financieros
  const financials = document.querySelectorAll('.financial-data');
  financials.forEach(el => {
    el.style.display = show ? '' : 'none';
  });
}

// Initialize DOM elements
function initializeDOMElements() {
    console.log('Initializing DOM elements...');
    const elements = {
        productList: document.getElementById('productList'),
        productDetails: document.getElementById('productDetails'),
        productModal: document.getElementById('productModal'),
        productForm: document.getElementById('productForm'),
        statsPanel: document.getElementById('statsPanel'),
        mainContainer: document.getElementById('mainContainer'),
        viewInventoryBtn: document.getElementById('viewInventoryBtn'),
        addProductBtn: document.getElementById('addProductBtn'),
        newPeriodBtn: document.getElementById('newPeriodBtn'),
        viewPeriodsBtn: document.getElementById('viewPeriodsBtn'),
        closeModal: document.getElementById('closeModal'),
        prevProduct: document.getElementById('prevProduct'),
        nextProduct: document.getElementById('nextProduct'),
        editImageBtn: document.getElementById('editImageBtn'),
        imageInput: document.getElementById('imageInput'),
        stockIn: document.getElementById('stockIn'),
        stockOut: document.getElementById('stockOut'),
        addStockBtn: document.getElementById('addStockBtn'),
        removeStockBtn: document.getElementById('removeStockBtn'),
        dateRangeModal: document.getElementById('dateRangeModal'),
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate'),
        confirmDateRange: document.getElementById('confirmDateRange'),
        cancelDateRange: document.getElementById('cancelDateRange'),
        periodsHistoryModal: document.getElementById('periodsHistoryModal'),
        periodsList: document.getElementById('periodsList'),
        closePeriodsHistory: document.getElementById('closePeriodsHistory'),
        totalInventoryValue: document.getElementById('totalInventoryValue'),
        totalProducts: document.getElementById('totalProducts'),
        totalPotentialProfit: document.getElementById('totalPotentialProfit')
    };

    // Verify essential elements
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Elemento no encontrado: ${key}`);
            throw new Error(`Elemento esencial no encontrado: ${key}`);
        }
    }

    console.log('DOM elements initialized successfully');
    return elements;
}

// Initialize the application
function init() {
    console.log('Initializing application...');
    
    try {
        // Initialize DOM elements
        elements = initializeDOMElements();

        // Load products
        loadProducts();
        
        // Setup event listeners
        setupEventListeners(elements);
        
        // Setup keyboard navigation
        setupKeyboardNavigation();
        
        // Update statistics
        updateStats();
        
        // Show first product if exists
        if (products.length > 0) {
            selectProduct(products[0].id);
        }
        
        // Setup stock controls
        setupStockControls();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        alert(`Error initializing application: ${error.message}. Please reload the page.`);
    }
}

// Función para formatear números
function formatNumber(number) {
    return '$' + Math.round(number || 0).toLocaleString('es-ES');
}

// Update statistics
function updateStats() {
    if (!elements.totalInventoryValue || !elements.totalProducts || !elements.totalPotentialProfit) {
        console.error('Statistics elements not found');
        return;
    }

    const stats = products.reduce((acc, product) => {
        const stock = product.currentStock || 0;
        acc.totalValue += product.unitPrice * stock;
        acc.totalProducts += 1;
        acc.potentialProfit += (product.salePrice - product.unitPrice) * stock;
        return acc;
    }, { totalValue: 0, totalProducts: 0, potentialProfit: 0 });

    elements.totalInventoryValue.textContent = formatNumber(stats.totalValue);
    elements.totalProducts.textContent = stats.totalProducts.toLocaleString('es-ES');
    elements.totalPotentialProfit.textContent = formatNumber(stats.potentialProfit);
}

// Load products from Realtime Database
async function loadProducts() {
    try {
        products = await obtenerProductos();
        // Asegurarse de que cada producto tenga un objeto periods
        products = products.map(product => ({
            ...product,
            stock: product.stock !== undefined ? product.stock : (product.currentStock !== undefined ? product.currentStock : 0),
            periods: product.periods || { current: { stockIn: 0, stockOut: 0, sales: 0, profit: 0 } }
        }));
        console.log('Productos cargados exitosamente:', products);
        loadFilterTags();
        updateProductList();
        updateStats();
        // Seleccionar el primer producto si existe
        if (products.length > 0) {
            selectProduct(products[0].id);
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showDialog('Error', 'No se pudieron cargar los productos. Por favor, recargue la página.');
    }
}

// Save products to Realtime Database
async function saveProducts() {
    try {
        // Guardar cada producto individualmente en Firebase
        for (const product of products) {
            await guardarProducto(product);
        }
        console.log('Productos guardados exitosamente en Realtime Database');
        updateStats();
    } catch (error) {
        console.error('Error al guardar productos en Realtime Database:', error);
        showDialog('Error', 'No se pudieron guardar los productos en Realtime Database. Por favor, intente nuevamente.');
    }
}

// Load periods for a product
function loadPeriods(product) {
    const periods = {};
    const periodElements = product.getElementsByTagName('period');
    Array.from(periodElements).forEach(period => {
        const periodId = period.getAttribute('id');
        periods[periodId] = {
            stockIn: parseInt(period.getElementsByTagName('stockIn')[0].textContent),
            stockOut: parseInt(period.getElementsByTagName('stockOut')[0].textContent),
            sales: parseFloat(period.getElementsByTagName('sales')[0].textContent),
            profit: parseFloat(period.getElementsByTagName('profit')[0].textContent)
        };
    });
    return periods;
}

// Update the product list in the sidebar
function updateProductList() {
    const productList = document.getElementById('productList');
    if (!productList) return;

    productList.innerHTML = '';
    
    // Filtrar productos por etiqueta seleccionada
    let filteredProducts = selectedFilterTag 
        ? products.filter(product => 
            product.tags && product.tags.some(tag => tag.id === selectedFilterTag))
        : products;
    
    // Filtrar productos por búsqueda de nombre
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(product => 
            (product.name || '').toLowerCase().includes(searchQuery)
        );
    }
    
    // Ordenar alfabéticamente si está activo
    if (isAlphaSortActive) {
        filteredProducts = [...filteredProducts].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', {sensitivity: 'base'}));
    }
    
    filteredProducts.forEach((product) => {
        const item = document.createElement('div');
        item.className = 'product-item';
        
        // Agregar clase de resaltado si hay búsqueda activa
        if (searchQuery && (product.name || '').toLowerCase().includes(searchQuery)) {
            item.classList.add('search-match');
        }
        
        item.dataset.id = product.id;
        
        const tagsHtml = product.tags ? product.tags.map(tag => `
            <span class="product-tag" style="background-color: ${tag.color}">${tag.name}</span>
        `).join('') : '';
        
        item.innerHTML = `
            <span class="product-name">${product.name || ''}</span>
            <span class="product-stock">${product.currentStock?.toLocaleString() || '0'}</span>
            <div class="product-tags">${tagsHtml}</div>
            <div class="product-actions">
                <button class="save-product-btn" data-product-id="${product.id}" title="Guardar cambios" style="display:none; background:#28a745; color:white; border:none; border-radius:4px; padding:4px 8px; font-size:12px; cursor:pointer; margin-right:4px;">💾</button>
                <button class="delete-product-btn" title="Eliminar producto" style="background:none;border:none;color:#d00;font-size:1.2em;cursor:pointer;">🗑️</button>
            </div>
        `;
        
        // Evento para seleccionar producto en todo el item, excepto los botones
        item.addEventListener('click', (e) => {
            if (e.target.closest('.delete-product-btn') || e.target.closest('.save-product-btn')) return;
            selectProduct(product.id);
        });
        
        // Evento para guardar producto individual
        const saveBtn = item.querySelector('.save-product-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await saveIndividualProduct(product.id);
            });
        }
        
        // Evento para eliminar producto
        item.querySelector('.delete-product-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmDelete = confirm(`¿Seguro que deseas eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`);
            if (confirmDelete) {
                const prodIndex = products.findIndex(p => p.id === product.id);
                if (prodIndex !== -1) {
                    await deleteProduct(prodIndex);
                }
            }
        });
        
        productList.appendChild(item);
    });
}

// Custom dialog functions
function showDialog(title, message) {
    alert(`${title}\n${message}`);
}

// Función para mostrar el diálogo de edición
async function showEditDialog(message, currentValue) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'edit-dialog';
        dialog.innerHTML = `
            <div class="edit-dialog-content">
                <h3>${message}</h3>
                <input type="text" id="editValue" value="${currentValue}" step="0.01">
                <div class="edit-dialog-buttons">
                    <button class="btn-primary" id="confirmEdit">Guardar</button>
                    <button class="btn-secondary" id="cancelEdit">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const input = dialog.querySelector('#editValue');
        input.focus();
        input.select();

        dialog.querySelector('#confirmEdit').addEventListener('click', () => {
            const newValue = input.value;
            document.body.removeChild(dialog);
            resolve(newValue);
        });

        dialog.querySelector('#cancelEdit').addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(null);
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                dialog.querySelector('#confirmEdit').click();
            } else if (e.key === 'Escape') {
                dialog.querySelector('#cancelEdit').click();
            }
        });
    });
}

// Select a product to display its details
function selectProduct(productId) {
    if (!elements.productDetails) {
        console.error('Product details element not found');
        return;
    }
    const index = products.findIndex(p => p.id === productId);
    currentProductIndex = index;
    const product = products[index];
    if (product) {
        elements.productDetails.classList.add('fade-out');
        setTimeout(() => {
            const productName = elements.productDetails.querySelector('#productName');
            const unitPrice = elements.productDetails.querySelector('#unitPrice');
            const salePrice = elements.productDetails.querySelector('#salePrice');
            const currentStock = elements.productDetails.querySelector('#currentStock');
            if (productName) productName.textContent = product.name || '';
            if (unitPrice) unitPrice.textContent = formatNumber(product.unitPrice || 0);
            if (salePrice) salePrice.textContent = formatNumber(product.salePrice || 0);
            if (currentStock) currentStock.textContent = (product.currentStock || 0).toLocaleString();
            // Mostrar la imagen del producto correctamente
            const productImageContainer = elements.productDetails.querySelector('#productImage');
            if (productImageContainer) {
                const img = productImageContainer.querySelector('img');
                if (img) {
                    img.src = product.image || 'placeholder.svg';
                    img.alt = product.name || '';
                    img.onerror = function() {
                        this.src = 'placeholder.svg';
                    };
                }
            }
            updateFinancialAnalysis(product);
            elements.productDetails.style.display = 'block';
            elements.productDetails.classList.remove('fade-out');
            elements.productDetails.classList.add('fade-in');
        }, 300);
    } else {
        const productName = elements.productDetails.querySelector('#productName');
        if (productName) productName.textContent = 'Seleccione un producto';
        elements.productDetails.style.display = 'none';
    }
    // Update selected state in list
    const productItems = elements.productList.querySelectorAll('.product-item');
    productItems.forEach((item) => {
        if (item.dataset.id === String(productId)) {
            item.classList.add('selected');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
    
    // Limpiar búsqueda cuando se selecciona un producto
    if (searchQuery) {
        const searchInput = document.getElementById('searchProductInput');
        if (searchInput) {
            searchInput.value = '';
            searchQuery = '';
            updateProductList();
        }
    }
}

// Update period-specific information
function updatePeriodInfo() {
    const product = products[currentProductIndex];
    const periodData = product.periods[currentPeriod] || {
        stockIn: 0,
        stockOut: 0,
        sales: 0,
        profit: 0
    };
    
    document.getElementById('totalSalesValue').textContent = `$${periodData.sales.toFixed(2)}`;
    document.getElementById('totalProfit').textContent = `$${periodData.profit.toFixed(2)}`;
}

// Add a new product
async function addProduct(productData) {
    try {
        const initialStock = parseInt(productData.initialStock) || 0;
        const newProduct = {
            name: productData.name,
            unitPrice: parseFloat(productData.unitPrice),
            salePrice: parseFloat(productData.salePrice),
            stock: initialStock,
            currentStock: initialStock,
            image: productData.image || 'placeholder.svg',
            tags: productData.tags || [],
            periods: {
                current: {
                    stockIn: initialStock,
                    stockOut: 0,
                    sales: 0,
                    profit: 0,
                    initialStock: initialStock
                }
            }
        };
        await guardarProducto(newProduct);
        await loadProducts();
        updateProductList();
        updateStats();
        // Seleccionar el último producto agregado
        if (products.length > 0) {
            selectProduct(products[products.length - 1].id);
        }
        console.log('Producto agregado exitosamente');
    } catch (error) {
        console.error('Error al agregar producto:', error);
        showDialog('Error', 'No se pudo agregar el producto. Por favor, intente nuevamente.');
    }
}

// Update product information
function updateProduct(index, productData) {
    const initialStock = parseInt(productData.initialStock) || 0;
    const updatedProduct = {
        ...products[index],
        name: productData.name,
        unitPrice: parseFloat(productData.unitPrice),
        salePrice: parseFloat(productData.salePrice),
        stock: initialStock,
        currentStock: initialStock,
        image: productData.image || products[index].image
    };
    products[index] = updatedProduct;
    saveProducts();
    updateProductList();
    selectProduct(products[index].id);
}

// Función para agregar stock
async function addStock(amount) {
    if (currentProductIndex === -1) {
        alert('Por favor seleccione un producto primero');
        return;
    }
    
    const product = products[currentProductIndex];
    if (!product) return;

    // Actualizar stock actual
    product.currentStock = (product.currentStock || 0) + amount;
    
    // Actualizar período actual
    if (!product.periods) {
        product.periods = {};
    }
    if (!product.periods.current) {
        product.periods.current = {
            stockIn: 0,
            stockOut: 0,
            sales: 0,
            profit: 0,
            initialStock: product.currentStock
        };
    }
    
    product.periods.current.stockIn = (product.periods.current.stockIn || 0) + amount;
    
    // Guardar cambios optimizados
    await actualizarStockYPreciosActuales(product.id, product.currentStock);
    await guardarPeriodoProducto(product.id, 'current', product.periods.current);
    updateProductList();
    selectProduct(product.id);
    updateFinancialAnalysis(product);
}

// Función para remover stock
async function removeStock(amount) {
    if (currentProductIndex === -1) {
        alert('Por favor seleccione un producto primero');
        return;
    }
    
    const product = products[currentProductIndex];
    if (!product) return;

    // Verificar si hay suficiente stock
    if ((product.currentStock || 0) < amount) {
        alert('No hay suficiente stock disponible');
        return;
    }

    // Actualizar stock actual
    product.currentStock = (product.currentStock || 0) - amount;
    
    // Actualizar período actual
    if (!product.periods) {
        product.periods = {};
    }
    if (!product.periods.current) {
        product.periods.current = {
            stockIn: 0,
            stockOut: 0,
            sales: 0,
            profit: 0,
            initialStock: product.currentStock
        };
    }
    
    // Calcular ventas y ganancias
    const saleAmount = amount * (product.salePrice || 0);
    const costAmount = amount * (product.unitPrice || 0);
    const profitAmount = saleAmount - costAmount;
    
    product.periods.current.stockOut = (product.periods.current.stockOut || 0) + amount;
    product.periods.current.sales = (product.periods.current.sales || 0) + saleAmount;
    product.periods.current.profit = (product.periods.current.profit || 0) + profitAmount;
    
    // Guardar cambios optimizados
    await actualizarStockYPreciosActuales(product.id, product.currentStock);
    await guardarPeriodoProducto(product.id, 'current', product.periods.current);
    updateProductList();
    selectProduct(product.id);
    updateFinancialAnalysis(product);
}

// Función para obtener la última fecha de corte
function getLastPeriodEndDate() {
    const periods = Object.keys(products[0]?.periods || {})
        .filter(period => period !== 'current')
        .map(period => {
            const [start, end] = period.split('_');
            return new Date(end);
        })
        .sort((a, b) => b - a);
    
    return periods[0] || null;
}

// Función para formatear fecha
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Función para mostrar notificación estilo iOS/macOS
function showNotification(message, duration = 2000) {
    // Crear el elemento de notificación si no existe
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
            </div>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
    } else {
        notification.querySelector('span').textContent = message;
    }

    // Mostrar la notificación
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Ocultar la notificación después del tiempo especificado
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Función para crear nuevo período
async function createNewPeriod() {
    const dateRangeModal = document.getElementById('dateRangeModal');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    // Obtener la última fecha de corte
    lastPeriodEndDate = getLastPeriodEndDate();
    
    // Si hay una última fecha, establecerla como fecha de inicio
    if (lastPeriodEndDate) {
        const nextDay = new Date(lastPeriodEndDate);
        nextDay.setDate(nextDay.getDate() + 1);
        startDateInput.value = formatDate(nextDay);
    } else {
        // Si no hay fecha anterior, permitir seleccionar la fecha de inicio
        startDateInput.value = formatDate(new Date());
    }
    
    // Establecer la fecha actual como fecha de fin por defecto
    endDateInput.value = formatDate(new Date());
    
    // Mostrar el modal
    dateRangeModal.style.display = 'block';
    
    // Configurar el evento de confirmación
    const confirmDateRange = document.getElementById('confirmDateRange');
    const cancelDateRange = document.getElementById('cancelDateRange');
    
    return new Promise((resolve) => {
        const handleConfirm = () => {
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            
            if (startDate > endDate) {
                showDialog('Error', 'La fecha de inicio no puede ser posterior a la fecha de fin');
                return;
            }
            
            const periodName = `${formatDate(startDate)}_${formatDate(endDate)}`;
            
            // Guardar el stock actual como stock inicial para el nuevo período
            products.forEach(product => {
                // Guardar el período actual antes de crear el nuevo
                if (product.periods['current']) {
                    const currentPeriodData = product.periods['current'];
                    const finalStock = product.currentStock || 0;
                    
                    // Calcular estadísticas adicionales
                    const totalStockInPeriod = (currentPeriodData.initialStock || 0) + (currentPeriodData.stockIn || 0);
                    const totalStockOutPeriod = currentPeriodData.stockOut || 0;
                    const remainingStock = finalStock;
                    
                    // Guardar el período actual con sus datos completos
                    product.periods[periodName] = {
                        stockIn: currentPeriodData.stockIn || 0,
                        stockOut: currentPeriodData.stockOut || 0,
                        sales: currentPeriodData.sales || 0,
                        profit: currentPeriodData.profit || 0,
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        initialStock: currentPeriodData.initialStock || 0,
                        finalStock: finalStock,
                        // Información adicional del período
                        totalStockInPeriod: totalStockInPeriod,
                        totalStockOutPeriod: totalStockOutPeriod,
                        remainingStock: remainingStock,
                        productName: product.name,
                        unitPrice: product.unitPrice,
                        salePrice: product.salePrice
                    };
                    
                    // Reiniciar el período actual con el stock final del período anterior como inicial
                    product.periods['current'] = {
                        stockIn: 0,
                        stockOut: 0,
                        sales: 0,
                        profit: 0,
                        initialStock: finalStock,
                        startDate: new Date().toISOString()
                    };

                    // Asegurarse de que el stock actual se mantenga
                    product.currentStock = finalStock;
                }
            });
            
            currentPeriod = periodName;
            updatePeriodSelect();
            selectProduct(products[currentProductIndex].id);
            saveProducts();
            
            // Actualizar la vista para mostrar las estadísticas reseteadas
            if (currentProductIndex !== -1) {
                updateFinancialAnalysis(products[currentProductIndex]);
            }
            
            dateRangeModal.style.display = 'none';
            
            // Mostrar notificación de éxito
            showNotification('Período guardado exitosamente');
            
            resolve();
        };
        
        const handleCancel = () => {
            dateRangeModal.style.display = 'none';
            resolve();
        };
        
        confirmDateRange.onclick = handleConfirm;
        cancelDateRange.onclick = handleCancel;
    });
}

// Actualizar la función updatePeriodSelect para mostrar fechas formateadas
function updatePeriodSelect() {
    if (!periodSelect) return;
    
    periodSelect.innerHTML = '';
    const periods = new Set(['current']);
    
    products.forEach(product => {
        if (product.periods) {
            Object.keys(product.periods).forEach(period => {
                if (period !== 'current') {
                    const [start, end] = period.split('_');
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    const formattedPeriod = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                    periods.add(period);
                }
            });
        }
    });
    
    periods.forEach(period => {
        const option = document.createElement('option');
        option.value = period;
        if (period === 'current') {
            option.textContent = 'Período Actual';
        } else {
            const [start, end] = period.split('_');
            const startDate = new Date(start);
            const endDate = new Date(end);
            option.textContent = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        }
        periodSelect.appendChild(option);
    });
    
    periodSelect.value = currentPeriod;
}

// Delete product
async function deleteProduct(index) {
    try {
        const productId = products[index].id; // Guarda el id antes de eliminar del array
        products.splice(index, 1);
        // Elimina de Firebase
        await db.ref('productos/' + productId).remove();
        // No llamar a saveProducts aquí
        // Handle the current product selection
        if (index === currentProductIndex) {
            currentProductIndex = -1;
            selectProduct(-1);
        } else if (index < currentProductIndex) {
            currentProductIndex--;
        }
        // Update the product list y estadísticas
        updateProductList();
        updateStats();
        // Mantener el panel de inventario visible
        if (elements && elements.mainContainer && elements.statsPanel) {
            elements.mainContainer.style.display = 'flex';
            elements.statsPanel.style.display = 'none';
        }
        // Mostrar notificación
        showNotification('Producto eliminado exitosamente', 2000);
        console.log('Producto eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        showDialog('Error', 'No se pudo eliminar el producto. Por favor, intente nuevamente.');
    }
}

// Setup event listeners
function setupEventListeners(elements) {
    console.log('Setting up event listeners...');

    // View Inventory button
    if (elements.viewInventoryBtn) {
        elements.viewInventoryBtn.addEventListener('click', () => {
            console.log('View Inventory button clicked');
            elements.statsPanel.style.display = 'none';
            elements.mainContainer.style.display = 'flex';
            
            // Add back to analytics button if it doesn't exist
            if (!document.getElementById('backToStatsBtn')) {
                const backToStatsBtn = document.createElement('button');
                backToStatsBtn.id = 'backToStatsBtn';
                backToStatsBtn.className = 'btn-primary back-to-stats';
                backToStatsBtn.innerHTML = '📊 Volver a Analíticas';
                backToStatsBtn.style.position = 'fixed';
                backToStatsBtn.style.top = '20px';
                backToStatsBtn.style.right = '20px';
                backToStatsBtn.style.zIndex = '1000';
                document.body.appendChild(backToStatsBtn);

                backToStatsBtn.addEventListener('click', () => {
                    elements.mainContainer.style.display = 'none';
                    elements.statsPanel.style.display = 'block';
                    updateBackToStatsBtn();
                });
            }

            if (products.length > 0 && currentProductIndex === -1) {
                selectProduct(products[0].id);
            }
            updateProductList();
            updateStats();
        });
    }

    // Add product button
    if (elements.addProductBtn) {
        elements.addProductBtn.addEventListener('click', () => {
            console.log('Add Product button clicked');
            elements.productForm.reset();
            elements.productModal.style.display = 'block';
        });
    }

    // Close modal button
    if (elements.closeModal) {
        elements.closeModal.addEventListener('click', () => {
            console.log('Close Modal button clicked');
            elements.productModal.style.display = 'none';
        });
    }

    // Product form submission
    if (elements.productForm) {
        elements.productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Product form submitted');
            try {
                // Validar que haya al menos una etiqueta seleccionada
                const selectedTagsArr = getSelectedTags();
                if (!selectedTagsArr || selectedTagsArr.length === 0) {
                    showDialog('Error', 'Debe asignar al menos una etiqueta al producto.');
                    return;
                }
                const formData = new FormData(elements.productForm);
                const imageUrl = formData.get('productImage');
                
                // Si estamos editando un producto existente
                const editId = elements.productForm.dataset.editId;
                if (editId) {
                    const index = products.findIndex(p => p.id === editId);
                    if (index !== -1) {
                        const productData = {
                            name: formData.get('productName'),
                            unitPrice: parseFloat(formData.get('unitPrice')),
                            salePrice: parseFloat(formData.get('salePrice')),
                            initialStock: parseInt(formData.get('initialStock')),
                            image: imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : (products[index].image || 'placeholder.svg'),
                            tags: selectedTagsArr
                        };
                        updateProduct(index, productData);
                    }
                } else {
                    // Si es un nuevo producto
                    const productData = {
                        name: formData.get('productName'),
                        unitPrice: parseFloat(formData.get('unitPrice')),
                        salePrice: parseFloat(formData.get('salePrice')),
                        initialStock: parseInt(formData.get('initialStock')),
                        image: imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : 'placeholder.svg',
                        tags: selectedTagsArr
                    };
                    await addProduct(productData);
                }

                // Cerrar el modal y limpiar el formulario
                elements.productModal.style.display = 'none';
                elements.productForm.reset();
                clearSelectedTags();
                // Actualizar la lista de productos y estadísticas
                updateProductList();
                updateStats();
            } catch (error) {
                console.error('Error al guardar el producto:', error);
                showDialog('Error', 'No se pudo guardar el producto. Por favor, intente nuevamente.');
            }
        });
    }

    // Stock controls
    if (elements.addStockBtn && elements.stockIn) {
        elements.addStockBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir el comportamiento por defecto del botón
            const inputValue = elements.stockIn.value;
            console.log('Raw input value:', inputValue);
            const amount = parseInt(inputValue, 10);
            console.log('Parsed amount:', amount);
            
            if (!isNaN(amount) && amount > 0) {
                addStock(amount);
                elements.stockIn.value = '';
            } else {
                alert('Por favor ingrese una cantidad mayor a 0');
            }
        });
    }

    if (elements.removeStockBtn && elements.stockOut) {
        elements.removeStockBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir el comportamiento por defecto del botón
            const inputValue = elements.stockOut.value;
            console.log('Raw input value:', inputValue);
            const amount = parseInt(inputValue, 10);
            console.log('Parsed amount:', amount);
            
            if (!isNaN(amount) && amount > 0) {
                removeStock(amount);
                elements.stockOut.value = '';
            } else {
                alert('Por favor ingrese una cantidad mayor a 0');
            }
        });
    }

    // Navigation buttons
    if (elements.prevProduct) {
        elements.prevProduct.addEventListener('click', () => {
            if (currentProductIndex > 0) {
                selectProduct(products[currentProductIndex - 1].id);
            }
        });
    }

    if (elements.nextProduct) {
        elements.nextProduct.addEventListener('click', () => {
            if (currentProductIndex < products.length - 1) {
                selectProduct(products[currentProductIndex + 1].id);
            }
        });
    }

    // New period button
    if (elements.newPeriodBtn) {
        elements.newPeriodBtn.addEventListener('click', createNewPeriod);
    }

    // View periods button
    if (elements.viewPeriodsBtn) {
        elements.viewPeriodsBtn.addEventListener('click', showPeriodsHistory);
    }

    // Edit periods button
    const editPeriodsBtn = document.getElementById('editPeriodsBtn');
    if (editPeriodsBtn) {
        editPeriodsBtn.addEventListener('click', () => {
            showEditPeriodsModal();
        });
    }

    // Botón de reset de base de datos
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', resetDatabase);
    }

    // Agregar el evento para el selector de etiquetas de filtro
    // Event listener para búsqueda por nombre
    const searchProductInput = document.getElementById('searchProductInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchProductInput) {
        searchProductInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            
            // Mostrar/ocultar botón de limpiar
            if (clearSearchBtn) {
                clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
            }
            
            updateProductList();
        });
        
        // Limpiar búsqueda con Escape
        searchProductInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });
    }
    
    // Event listener para botón de limpiar búsqueda
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
    
    // Función para limpiar búsqueda
    function clearSearch() {
        if (searchProductInput) {
            searchProductInput.value = '';
        }
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
        }
        searchQuery = '';
        updateProductList();
    }
    
    const filterTagSelect = document.getElementById('filterTagSelect');
    if (filterTagSelect) {
        filterTagSelect.addEventListener('change', (e) => {
            filterProductsByTag(e.target.value);
        });
    }

    // Edit buttons - Sistema de guardado individual por producto
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const field = btn.dataset.field;
            const valueSpan = document.getElementById(field);
            const currentValue = valueSpan?.textContent;
            
            if (currentValue !== undefined && selectedProduct) {
                // Inicializar cambios pendientes para este producto si no existe
                if (!pendingChangesByProduct[selectedProduct]) {
                    pendingChangesByProduct[selectedProduct] = {};
                }
                if (!originalValuesByProduct[selectedProduct]) {
                    originalValuesByProduct[selectedProduct] = {};
                }
                
                // Guardar valor original si es la primera edición de este campo
                if (!originalValuesByProduct[selectedProduct][field]) {
                    originalValuesByProduct[selectedProduct][field] = currentValue;
                }
                
                // Crear input temporal para edición
                const input = document.createElement('input');
                input.type = 'number';
                input.step = field.includes('Price') ? '0.01' : '1';
                input.value = currentValue.replace(/[^0-9.-]/g, '');
                input.className = 'edit-mode';
                input.style.width = '80px';
                input.style.marginRight = '4px';
                
                // Reemplazar el span con el input
                valueSpan.style.display = 'none';
                valueSpan.parentNode.insertBefore(input, valueSpan);
                input.focus();
                input.select();
                
                // Ocultar botón de editar
                btn.style.display = 'none';
                
                // Función para actualizar cambios pendientes
                const updatePendingChanges = () => {
                    const newValue = input.value;
                    if (newValue !== originalValuesByProduct[selectedProduct][field]) {
                        pendingChangesByProduct[selectedProduct][field] = newValue;
                    } else {
                        delete pendingChangesByProduct[selectedProduct][field];
                    }
                    
                    // Actualizar botón de guardar del producto
                    updateProductSaveButton(selectedProduct);
                    
                    // Debug: mostrar en consola
                    console.log('Cambios pendientes para', selectedProduct, ':', pendingChangesByProduct[selectedProduct]);
                };
                
                // Función para restaurar vista normal
                const restoreNormalView = () => {
                    // Remover input
                    if (input.parentNode) {
                        input.parentNode.removeChild(input);
                    }
                    
                    // Mostrar span original
                    valueSpan.style.display = 'inline';
                    
                    // Mostrar botón de editar
                    btn.style.display = 'inline-block';
                };
                
                // Event listeners para input
                input.addEventListener('input', updatePendingChanges);
                
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        // Solo actualizar el valor visual, no guardar aún
                        const newValue = input.value;
                        if (field.includes('Price')) {
                            valueSpan.textContent = `$${parseFloat(newValue || 0).toFixed(2)}`;
                        } else {
                            valueSpan.textContent = parseInt(newValue || 0);
                        }
                        restoreNormalView();
                        updatePendingChanges();
                        
                        // Forzar actualización de la lista para mostrar el botón
                        setTimeout(() => {
                            updateProductList();
                            updateProductSaveButton(selectedProduct);
                        }, 100);
                    } else if (e.key === 'Escape') {
                        // Restaurar valor original
                        valueSpan.textContent = originalValuesByProduct[selectedProduct][field];
                        restoreNormalView();
                        delete pendingChangesByProduct[selectedProduct][field];
                        updateProductSaveButton(selectedProduct);
                        
                        // Forzar actualización de la lista
                        setTimeout(() => {
                            updateProductList();
                            updateProductSaveButton(selectedProduct);
                        }, 100);
                    }
                });
                
                input.addEventListener('blur', () => {
                    // Al perder el foco, actualizar el valor visual
                    const newValue = input.value;
                    if (field.includes('Price')) {
                        valueSpan.textContent = `$${parseFloat(newValue || 0).toFixed(2)}`;
                    } else {
                        valueSpan.textContent = parseInt(newValue || 0);
                    }
                    restoreNormalView();
                    updatePendingChanges();
                    
                    // Forzar actualización de la lista para mostrar el botón
                    setTimeout(() => {
                        updateProductList();
                        updateProductSaveButton(selectedProduct);
                    }, 100);
                });
            }
        });
    });

    // Edit image button
    if (elements.editImageBtn) {
        elements.editImageBtn.addEventListener('click', async () => {
            const product = products[currentProductIndex];
            if (product) {
                const currentImageUrl = product.image || '';
                const newImageUrl = await showEditDialog('Ingrese la URL de la nueva imagen:', currentImageUrl);
                
                if (newImageUrl !== null) {
                    const trimmedUrl = newImageUrl.trim();
                    
                    // Si está vacío, usar placeholder
                    if (trimmedUrl === '') {
                        product.image = 'placeholder.svg';
                    } else {
                        // Validar que sea una URL válida (permitir URLs relativas también)
                        try {
                            // Si es una URL absoluta, validarla
                            if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
                                new URL(trimmedUrl);
                            }
                            // Si es una URL relativa o absoluta válida, guardarla
                            product.image = trimmedUrl;
                        } catch (e) {
                            showDialog('Error', 'Por favor ingrese una URL válida (debe comenzar con http:// o https://)');
                            return;
                        }
                    }
                    
                    await guardarCampoProducto(product.id, 'image', product.image);
                    selectProduct(product.id);
                    showNotification('Imagen actualizada correctamente');
                }
            }
        });
    }

    console.log('Event listeners setup completed');
}

// Función para mostrar el historial de períodos - VERSIÓN SIMPLIFICADA
function showPeriodsHistory() {
    console.log('showPeriodsHistory ejecutándose...'); // Debug
    const periodsHistoryModal = document.getElementById('periodsHistoryModal');
    const periodsList = document.getElementById('periodsList');
    
    if (!periodsHistoryModal || !periodsList) {
        console.error('No se encontraron los elementos del modal de períodos');
        return;
    }
    
    // Limpiar la lista actual
    periodsList.innerHTML = '';
    
    // Obtener todos los períodos únicos de todos los productos
    const allPeriods = new Set();
    products.forEach(product => {
        if (product.periods) {
            Object.keys(product.periods).forEach(period => {
                if (period !== 'current') {
                    allPeriods.add(period);
                }
            });
        }
    });
    
    console.log('Períodos encontrados:', allPeriods.size); // Debug
    
    // Convertir a array y ordenar por fecha (más reciente primero)
    const sortedPeriods = Array.from(allPeriods).sort((a, b) => {
        const [aStart, aEnd] = a.split('_');
        const [bStart, bEnd] = b.split('_');
        return new Date(bEnd) - new Date(aEnd);
    });
    
    // Crear elementos para cada período - VERSIÓN SIMPLIFICADA
    sortedPeriods.forEach(period => {
        const [start, end] = period.split('_');
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        const periodElement = document.createElement('div');
        periodElement.className = 'period-item';
        
        // Calcular estadísticas totales para este período
        const periodStats = products.reduce((stats, product) => {
            const periodData = product.periods[period] || {
                stockIn: 0,
                stockOut: 0,
                sales: 0,
                profit: 0,
                initialStock: 0
            };
            
            stats.totalStockIn += periodData.stockIn;
            stats.totalStockOut += periodData.stockOut;
            stats.totalSales += periodData.sales;
            stats.totalProfit += periodData.profit;
            
            return stats;
        }, {
            totalStockIn: 0,
            totalStockOut: 0,
            totalSales: 0,
            totalProfit: 0
        });
        
        // HTML MUY SIMPLIFICADO - solo lo esencial
        periodElement.innerHTML = `
            <div class="period-header">
                <h3>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</h3>
                <div class="period-actions">
                    <button class="btn-secondary view-period-details" data-period="${period}">Ver Detalles</button>
                    <button class="period-edit-button" data-period="${period}">✎ Editar</button>
                    <button class="btn-danger delete-period" data-period="${period}" title="Eliminar período">🗑️</button>
                </div>
            </div>
            <div class="period-summary">
                <div class="summary-item">
                    <span>Entradas:</span>
                    <span>${periodStats.totalStockIn.toLocaleString('es-ES')}</span>
                </div>
                <div class="summary-item">
                    <span>Salidas:</span>
                    <span>${periodStats.totalStockOut.toLocaleString('es-ES')}</span>
                </div>
                <div class="summary-item">
                    <span>Ventas Totales:</span>
                    <span>${formatNumber(periodStats.totalSales)}</span>
                </div>
                <div class="summary-item">
                    <span>Ganancia Total:</span>
                    <span>${formatNumber(periodStats.totalProfit)}</span>
                </div>
            </div>
        `;
        
        periodsList.appendChild(periodElement);
        
        // Agregar event listener inmediatamente después de crear el botón
        const editButton = periodElement.querySelector('.period-edit-button');
        if (editButton) {
            console.log('Botón encontrado y agregando event listener:', editButton); // Debug
            editButton.addEventListener('click', async (e) => {
                console.log('Botón editar clickeado'); // Debug
                const period = editButton.getAttribute('data-period');
                await editPeriodModal(period);
            });
        } else {
            console.error('No se encontró el botón de editar en el período:', period); // Debug
        }
        
        console.log('Período agregado:', period); // Debug
    });
    
    // Mostrar el modal
    periodsHistoryModal.style.display = 'block';
    
    // Event listeners para los botones de detalles
    document.querySelectorAll('.view-period-details').forEach(button => {
        button.addEventListener('click', () => {
            const period = button.getAttribute('data-period');
            const detailsElement = document.getElementById(`details-${period}`);
            if (detailsElement) {
                detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
            }
        });
    });

    // Event listeners para eliminar períodos
    document.querySelectorAll('.delete-period').forEach(button => {
        button.addEventListener('click', async () => {
            const period = button.getAttribute('data-period');
            const confirmed = confirm(`¿Está seguro de que desea eliminar el período "${period}"? Esta acción no se puede deshacer.`);
            if (confirmed) {
                await deletePeriod(period);
            }
        });
    });
}

// Función para eliminar un período
async function deletePeriod(periodName) {
    if (!confirm('¿Está seguro que desea eliminar este período? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        // Eliminar el período de todos los productos
        products.forEach(product => {
            if (product.periods[periodName]) {
                delete product.periods[periodName];
            }
        });

        // Guardar los cambios
        await saveProducts();
        
        // Actualizar la vista
        showPeriodsHistory();
        
        console.log('Período eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar período:', error);
        showDialog('Error', 'No se pudo eliminar el período. Por favor, intente nuevamente.');
    }
}

// Event Listeners
document.getElementById('viewPeriodsBtn').addEventListener('click', showPeriodsHistory);
document.getElementById('closePeriodsHistory').addEventListener('click', () => {
    document.getElementById('periodsHistoryModal').style.display = 'none';
});

// Initialize the application when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Update financial analysis for a product
function updateFinancialAnalysis(product) {
    if (!product) return;

    const currentPeriod = product.periods?.current || {
        stockIn: 0,
        stockOut: 0,
        sales: 0,
        profit: 0,
        initialStock: 0
    };

    // Calcular valores financieros
    const totalCostPrice = (product.unitPrice || 0) * (product.currentStock || 0);
    const stockValue = (product.salePrice || 0) * (product.currentStock || 0);
    const potentialProfit = stockValue - totalCostPrice;

    // Actualizar elementos de la interfaz
    const elements = {
        totalCostPrice: document.getElementById('totalCostPrice'),
        stockValue: document.getElementById('stockValue'),
        potentialProfit: document.getElementById('potentialProfit'),
        initialStock: document.getElementById('initialStock'),
        addedStock: document.getElementById('addedStock'),
        soldStock: document.getElementById('soldStock'),
        totalStockPeriod: document.getElementById('totalStockPeriod'),
        finalStock: document.getElementById('finalStock'),
        totalSalesValue: document.getElementById('totalSalesValue'),
        totalProfit: document.getElementById('totalProfit')
    };

    // Actualizar valores con verificaciones de null
    if (elements.totalCostPrice) elements.totalCostPrice.textContent = formatNumber(totalCostPrice);
    if (elements.stockValue) elements.stockValue.textContent = formatNumber(stockValue);
    if (elements.potentialProfit) elements.potentialProfit.textContent = formatNumber(potentialProfit);
    if (elements.initialStock) elements.initialStock.textContent = (currentPeriod.initialStock || 0).toLocaleString();
    if (elements.addedStock) elements.addedStock.textContent = (currentPeriod.stockIn || 0).toLocaleString();
    if (elements.soldStock) elements.soldStock.textContent = (currentPeriod.stockOut || 0).toLocaleString();
    if (elements.totalStockPeriod) {
        const totalStockPeriod = (currentPeriod.initialStock || 0) + (currentPeriod.stockIn || 0);
        elements.totalStockPeriod.textContent = totalStockPeriod.toLocaleString();
    }
    if (elements.finalStock) elements.finalStock.textContent = (product.currentStock || 0).toLocaleString();
    if (elements.totalSalesValue) elements.totalSalesValue.textContent = formatNumber(currentPeriod.sales || 0);
    if (elements.totalProfit) elements.totalProfit.textContent = formatNumber(currentPeriod.profit || 0);
}

// Setup keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Solo procesar las teclas si estamos en el inventario
        if (elements.mainContainer.style.display === 'none') return;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const items = document.querySelectorAll('.product-item');
            const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
            
            if (currentIndex === -1) {
                if (items.length > 0) {
                    selectProduct(items[0].dataset.id);
                }
                return;
            }
            
            let newIndex;
            if (e.key === 'ArrowLeft') {
                newIndex = Math.max(0, currentIndex - 1);
                // Agregar efecto visual para la flecha izquierda
                const prevBtn = document.getElementById('prevProduct');
                if (prevBtn) {
                    prevBtn.classList.add('active');
                    setTimeout(() => prevBtn.classList.remove('active'), 200);
                }
            } else {
                newIndex = Math.min(items.length - 1, currentIndex + 1);
                // Agregar efecto visual para la flecha derecha
                const nextBtn = document.getElementById('nextProduct');
                if (nextBtn) {
                    nextBtn.classList.add('active');
                    setTimeout(() => nextBtn.classList.remove('active'), 200);
                }
            }
            
            if (newIndex !== currentIndex) {
                selectProduct(items[newIndex].dataset.id);
                items[newIndex].focus();
                
                // Mostrar indicador de navegación
                showNavigationIndicator(e.key === 'ArrowLeft' ? '←' : '→');
            }
        }
    });
}

// Función para mostrar el indicador de navegación
function showNavigationIndicator(direction) {
    let indicator = document.querySelector('.navigation-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'navigation-indicator';
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = direction;
    indicator.classList.remove('fade-out');
    
    setTimeout(() => {
        indicator.classList.add('fade-out');
    }, 300);
}

// Modificar la función createProductListItem para incluir etiquetas
function createProductListItem(product) {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.dataset.id = product.id;
    
    const tagsHtml = product.tags ? product.tags.map(tag => `
        <span class="product-tag" style="background-color: ${tag.color}">${tag.name}</span>
    `).join('') : '';
    
    item.innerHTML = `
        <span class="product-name">${product.name}</span>
        <span class="product-stock">${product.currentStock}</span>
        <div class="product-tags">${tagsHtml}</div>
    `;
    
    return item;
}

// Modificar la función para guardar un producto
function saveProduct(productData) {
    const product = {
        ...productData,
        id: productData.id || Date.now().toString(),
        tags: getSelectedTags(),
        currentStock: parseInt(productData.initialStock) || 0,
        periods: productData.periods || {
            current: {
                stockIn: 0,
                stockOut: 0,
                sales: 0,
                profit: 0,
                initialStock: parseInt(productData.initialStock) || 0
            }
        }
    };

    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
        products[index] = product;
    } else {
        products.push(product);
    }

    localStorage.setItem('products', JSON.stringify(products));
    updateProductList();
    clearSelectedTags();
}

// Modificar la función para cargar un producto
function loadProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        // Cargar datos básicos del producto
        document.getElementById('productName').textContent = product.name;
        document.getElementById('unitPrice').textContent = formatNumber(product.unitPrice);
        document.getElementById('salePrice').textContent = formatNumber(product.salePrice);
        document.getElementById('currentStock').textContent = product.currentStock;
        
        // Cargar etiquetas del producto
        loadProductTags(product.tags);
        
        // ... resto del código de carga del producto ...
    }
}

// Modificar la función para abrir el modal de producto
function openProductModal(productId = null) {
    loadTags(); // <-- Asegura que el selector de etiquetas esté actualizado
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    form.reset();
    clearSelectedTags();
    const imageInput = document.getElementById('productImageInput');
    const imageUrlPreview = document.getElementById('imageUrlPreview');
    const imageUrlPreviewContainer = document.getElementById('imageUrlPreviewContainer');
    if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            document.getElementById('productNameInput').value = product.name;
            document.getElementById('unitPriceInput').value = product.unitPrice;
            document.getElementById('salePriceInput').value = product.salePrice;
            document.getElementById('initialStockInput').value = product.stock || product.currentStock || 0;
            loadProductTags(product.tags);
            if (imageInput) imageInput.value = product.image || '';
            // Mostrar previsualización de la imagen actual
            if (imageUrlPreview && imageUrlPreviewContainer) {
                if (product.image && product.image !== 'placeholder.svg') {
                    imageUrlPreview.src = product.image;
                    imageUrlPreviewContainer.style.display = 'block';
                } else {
                    imageUrlPreview.src = '';
                    imageUrlPreviewContainer.style.display = 'none';
                }
            }
            form.dataset.editId = productId;
        }
    } else {
        delete form.dataset.editId;
        if (imageInput) imageInput.value = '';
        if (imageUrlPreview && imageUrlPreviewContainer) {
            imageUrlPreview.src = '';
            imageUrlPreviewContainer.style.display = 'none';
        }
    }
    modal.style.display = 'block';
}

// Función para limpiar la base de datos con verificación de seguridad
async function resetDatabase() {
    // Verificar que el usuario esté logueado
    if (!isLoggedIn()) {
        showDialog('Error', 'Debe iniciar sesión para realizar esta acción.');
        return;
    }

    // Pedir contraseña de confirmación
    const password = await showEditDialog('Ingrese la contraseña para confirmar:', '');
    if (password === null) {
        return; // Usuario canceló
    }

    // Verificar contraseña
    if (password !== 'agrocamacho') {
        showDialog('Error', 'Contraseña incorrecta. La operación ha sido cancelada.');
        return;
    }

    // Mostrar advertencia final
    const confirmed = await showConfirmDialog(
        '⚠️ ADVERTENCIA CRÍTICA ⚠️',
        'Está a punto de ELIMINAR COMPLETAMENTE todos los datos:\n\n' +
        '• Todos los productos\n' +
        '• Todo el historial de períodos\n' +
        '• Todas las etiquetas\n' +
        '• Todos los datos financieros\n\n' +
        'Esta acción NO SE PUEDE DESHACER.\n\n' +
        '¿Está completamente seguro de que desea continuar?'
    );

    if (confirmed) {
        try {
            // Mostrar indicador de progreso
            showNotification('Eliminando datos...', 3000);
            
            // Limpiar productos
            products = [];
            localStorage.removeItem('products');

            // Limpiar etiquetas
            localStorage.removeItem('productTags');

            // Borrar productos en Realtime Database
            await db.ref('productos').remove();

            // Actualizar la interfaz
            updateProductList();
            updateStats();
            clearSelectedTags();

            // Mostrar mensaje de éxito
            showNotification('Base de datos limpiada exitosamente', 5000);
            
            // Recargar la página para asegurar un estado limpio
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Error al limpiar la base de datos:', error);
            showDialog('Error', 'No se pudo limpiar la base de datos. Por favor, intente nuevamente.');
        }
    }
}

// Actualizar los event listeners para los controles de stock
function setupStockControls() {
    if (elements.addStockBtn && elements.stockIn) {
        elements.addStockBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir el comportamiento por defecto del botón
            const inputValue = elements.stockIn.value;
            console.log('Raw input value:', inputValue);
            const amount = parseInt(inputValue, 10);
            console.log('Parsed amount:', amount);
            
            if (!isNaN(amount) && amount > 0) {
                addStock(amount);
                elements.stockIn.value = '';
            } else {
                //alert('Por favor ingrese una cantidad mayor a 0');
            }
        });
    }

    if (elements.removeStockBtn && elements.stockOut) {
        elements.removeStockBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir el comportamiento por defecto del botón
            const inputValue = elements.stockOut.value;
            console.log('Raw input value:', inputValue);
            const amount = parseInt(inputValue, 10);
            console.log('Parsed amount:', amount);
            
            if (!isNaN(amount) && amount > 0) {
                removeStock(amount);
                elements.stockOut.value = '';
            } else {
                //alert('Por favor ingrese una cantidad mayor a 0');
            }
        });
    }
}

// Función para cargar las etiquetas en el selector de filtro
function loadFilterTags() {
    const filterTagSelect = document.getElementById('filterTagSelect');
    if (!filterTagSelect) return;

    // Mantener la opción "Todas las etiquetas"
    filterTagSelect.innerHTML = '<option value="">Todas las etiquetas</option>';
    
    // Obtener todas las etiquetas únicas de los productos
    const allTags = new Set();
    products.forEach(product => {
        if (product.tags) {
            product.tags.forEach(tag => {
                allTags.add(JSON.stringify(tag));
            });
        }
    });

    // Agregar las etiquetas al selector
    allTags.forEach(tagStr => {
        const tag = JSON.parse(tagStr);
        const option = document.createElement('option');
        option.value = tag.id;
        option.textContent = tag.name;
        filterTagSelect.appendChild(option);
    });
}

// Función para filtrar productos por etiqueta
function filterProductsByTag(tagId) {
    selectedFilterTag = tagId;
    updateProductList();
}

// === LÓGICA PARA MÓVIL: BOTÓN Y MODAL DE LISTA DE PRODUCTOS ===
function isMobile() {
    return window.innerWidth <= 768;
}

function renderMobileProductList() {
    const container = document.getElementById('mobileProductListContainer');
    if (!container) return;
    container.innerHTML = '';
    // Filtrar productos por etiqueta seleccionada
    const filteredProducts = selectedFilterTag 
        ? products.filter(product => product.tags && product.tags.some(tag => tag.id === selectedFilterTag))
        : products;
    if (filteredProducts.length === 0) {
        container.innerHTML = '<div style="padding:1em; text-align:center; color:#888;">No hay productos en esta categoría.</div>';
        return;
    }
    filteredProducts.forEach((product, index) => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <span class="product-name">${product.name || ''}</span>
            <span class="product-stock">${product.currentStock?.toLocaleString() || '0'}</span>
        `;
        item.addEventListener('click', () => {
            selectProduct(product.id);
            closeMobileProductListModal();
        });
        container.appendChild(item);
    });
}

function renderMobileFilterSection() {
    const filterSection = document.getElementById('mobileFilterSection');
    if (!filterSection) return;
    // Copiar el filtro de etiquetas existente
    const original = document.getElementById('filterTagSelect');
    if (!original) return;
    // Crear un select nuevo para evitar conflictos
    const select = document.createElement('select');
    select.id = 'mobileFilterTagSelect';
    select.className = 'tag-select';
    select.innerHTML = original.innerHTML;
    select.value = selectedFilterTag;
    select.addEventListener('change', (e) => {
        filterProductsByTag(e.target.value);
        renderMobileProductList();
    });
    filterSection.innerHTML = '';
    filterSection.appendChild(select);
}

function openMobileProductListModal() {
    document.getElementById('mobileProductListModal').style.display = 'flex';
    renderMobileFilterSection();
    renderMobileProductList();
}
function closeMobileProductListModal() {
    document.getElementById('mobileProductListModal').style.display = 'none';
}

// Mostrar/ocultar botón flotante solo en móvil
function updateMobileProductListBtnVisibility() {
    const btn = document.getElementById('openProductListBtn');
    if (!btn) return;
    btn.style.display = isMobile() ? 'flex' : 'none';
}

// Event listeners para el botón y modal
window.addEventListener('resize', updateMobileProductListBtnVisibility);
document.addEventListener('DOMContentLoaded', () => {
    updateMobileProductListBtnVisibility();
    // Asegura que el modal esté oculto al cargar la página
    const mobileModal = document.getElementById('mobileProductListModal');
    if (mobileModal) {
        mobileModal.style.display = 'none';
    }
    const btn = document.getElementById('openProductListBtn');
    if (btn) {
        btn.addEventListener('click', openMobileProductListModal);
    }
    const closeBtn = document.getElementById('closeMobileProductListModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMobileProductListModal);
    }
    // Cerrar modal al hacer click fuera del panel
    if (mobileModal) {
        mobileModal.addEventListener('click', (e) => {
            if (e.target === mobileModal) closeMobileProductListModal();
        });
    }
});

// Overlay de orientación horizontal en móvil
function checkOrientation() {
  const overlay = document.getElementById('rotateDeviceOverlay');
  if (!overlay) return;
  if (window.innerWidth < window.innerHeight && window.innerWidth <= 768) {
    overlay.style.display = 'flex';
  } else {
    overlay.style.display = 'none';
  }
}
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
document.addEventListener('DOMContentLoaded', checkOrientation);

document.addEventListener('DOMContentLoaded', function() {
  const showBtn = document.getElementById('showSidebarButtons');
  const btnsGroup = document.getElementById('sidebarButtonsGroup');

  function isMobile() {
    return window.innerWidth <= 600;
  }

  function hideButtonsOnMobile() {
    if (isMobile()) {
      btnsGroup.classList.remove('show');
      showBtn.style.display = 'block';
      showBtn.textContent = 'Mostrar Opciones';
    } else {
      btnsGroup.classList.remove('show');
      btnsGroup.style.display = '';
      showBtn.style.display = 'none';
    }
  }

  showBtn.addEventListener('click', function() {
    if (btnsGroup.classList.contains('show')) {
      btnsGroup.classList.remove('show');
      showBtn.textContent = 'Mostrar Opciones';
    } else {
      btnsGroup.classList.add('show');
      showBtn.textContent = 'Ocultar Opciones';
    }
  });

  window.addEventListener('resize', hideButtonsOnMobile);
  hideButtonsOnMobile();
});

document.addEventListener('DOMContentLoaded', function() {
  const fabBtn = document.getElementById('fabMenuBtn');
  const fabMenu = document.getElementById('fabMenu');
  const addProductBtn = document.getElementById('addProductBtn');
  const newPeriodBtn = document.getElementById('newPeriodBtn');
  const viewPeriodsBtn = document.getElementById('viewPeriodsBtn');

  function isMobile() {
    return window.innerWidth <= 600;
  }

  function updateFabVisibility() {
    if (isMobile()) {
      fabBtn.style.display = 'flex';
    } else {
      fabBtn.style.display = 'none';
      fabMenu.style.display = 'none';
    }
  }

  fabBtn.addEventListener('click', function() {
    fabMenu.style.display = fabMenu.style.display === 'flex' ? 'none' : 'flex';
  });

  // Cerrar menú al hacer click fuera
  document.addEventListener('click', function(e) {
    if (isMobile() && fabMenu.style.display === 'flex' && !fabMenu.contains(e.target) && e.target !== fabBtn) {
      fabMenu.style.display = 'none';
    }
  });

  // Redirigir clicks del menú flotante a los botones originales
  document.getElementById('fabAddProduct').onclick = () => addProductBtn.click();
  document.getElementById('fabNewPeriod').onclick = () => newPeriodBtn.click();
  document.getElementById('fabViewPeriods').onclick = () => viewPeriodsBtn.click();

  window.addEventListener('resize', updateFabVisibility);
  updateFabVisibility();
});

// Login Logic
if (loginBtn && loginModal && loginForm && closeLoginModal && loginError) {
  // Mostrar modal login
  loginBtn.onclick = () => {
    loginModal.style.display = 'block';
    loginError.style.display = 'none';
  };

  // Cerrar modal login
  closeLoginModal.onclick = () => {
    loginModal.style.display = 'none';
  };

  // Procesar login
  loginForm.onsubmit = (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    if (user === 'admin' && pass === 'agrocamacho') {
      localStorage.setItem('isAdmin', 'true');
      loginModal.style.display = 'none';
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'block';
      showFinancialData(true);
      // Mostrar botón de reset de base de datos
      const resetDataBtn = document.getElementById('resetDataBtn');
      if (resetDataBtn) {
        resetDataBtn.style.display = 'inline-block';
      }
    } else {
      loginError.style.display = 'block';
    }
  };

  // Al cargar la página
  window.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'block';
      showFinancialData(true);
      // Mostrar botón de reset de base de datos
      const resetDataBtn = document.getElementById('resetDataBtn');
      if (resetDataBtn) {
        resetDataBtn.style.display = 'inline-block';
      }
    } else {
      loginBtn.style.display = 'block';
      logoutBtn.style.display = 'none';
      showFinancialData(false);
      // Ocultar botón de reset de base de datos
      const resetDataBtn = document.getElementById('resetDataBtn');
      if (resetDataBtn) {
        resetDataBtn.style.display = 'none';
      }
    }
  });
}

function logout() {
  localStorage.removeItem('isAdmin');
  showFinancialData(false);
  loginBtn.style.display = 'block';
  logoutBtn.style.display = 'none';
  // Ocultar botón de reset de base de datos
  const resetDataBtn = document.getElementById('resetDataBtn');
  if (resetDataBtn) {
    resetDataBtn.style.display = 'none';
  }
}

if (logoutBtn) {
  logoutBtn.onclick = logout;
}

window.addEventListener('DOMContentLoaded', function() {
  const backToStatsBtn = document.getElementById('backToStatsBtn');
  const mainContainer = document.getElementById('mainContainer');
  const statsPanel = document.getElementById('statsPanel');

  function updateBackToStatsBtn() {
    if (mainContainer && statsPanel && backToStatsBtn) {
      if (mainContainer.style.display !== 'none' && mainContainer.style.display !== '') {
        backToStatsBtn.style.display = 'inline-block';
      } else {
        backToStatsBtn.style.display = 'none';
      }
    }
  }

  if (backToStatsBtn) {
    backToStatsBtn.onclick = function() {
      if (mainContainer && statsPanel) {
        mainContainer.style.display = 'none';
        statsPanel.style.display = 'block';
        updateBackToStatsBtn();
      }
    };
  }

  // Cuando se muestra el inventario, asegúrate de mostrar el botón
  const viewInventoryBtn = document.getElementById('viewInventoryBtn');
  if (viewInventoryBtn) {
    viewInventoryBtn.addEventListener('click', function() {
      if (mainContainer && statsPanel) {
        mainContainer.style.display = 'flex';
        statsPanel.style.display = 'none';
        updateBackToStatsBtn();
      }
    });
  }

  updateBackToStatsBtn();
});

// --- Previsualización de imagen por URL ---
document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('productImageInput');
    const imageUrlPreview = document.getElementById('imageUrlPreview');
    const imageUrlPreviewContainer = document.getElementById('imageUrlPreviewContainer');
    if (imageInput) {
        imageInput.addEventListener('input', function() {
            // Solo mostrar previsualización si estamos editando un producto existente
            const form = document.getElementById('productForm');
            if (!form || !form.dataset.editId) {
                // Si no estamos editando, ocultar la previsualización
                if (imageUrlPreview && imageUrlPreviewContainer) {
                    imageUrlPreview.src = '';
                    imageUrlPreviewContainer.style.display = 'none';
                }
                return;
            }
            
            const imageUrl = imageInput.value.trim();
            if (imageUrl && imageUrl !== 'placeholder.svg') {
                // Validar que sea una URL válida
                try {
                    // Si es una URL absoluta, validarla
                    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                        new URL(imageUrl);
                    }
                    imageUrlPreview.src = imageUrl;
                    imageUrlPreviewContainer.style.display = 'block';
                    
                    // Manejar errores de carga de imagen
                    imageUrlPreview.onerror = function() {
                        imageUrlPreview.src = 'placeholder.svg';
                        imageUrlPreviewContainer.style.display = 'block';
                    };
                    
                    // Manejar carga exitosa
                    imageUrlPreview.onload = function() {
                        imageUrlPreviewContainer.style.display = 'block';
                    };
                } catch (e) {
                    // Si no es una URL válida, ocultar la previsualización
                    imageUrlPreview.src = '';
                    imageUrlPreviewContainer.style.display = 'none';
                }
            } else {
                imageUrlPreview.src = '';
                imageUrlPreviewContainer.style.display = 'none';
            }
        });
    }
});

// Función para guardar un producto en Realtime Database
function guardarProducto(producto) {
  if (producto.id) {
    return db.ref('productos/' + producto.id).set(producto);
  } else {
    const newRef = db.ref('productos').push();
    producto.id = newRef.key;
    return newRef.set(producto);
  }
}

// Función para obtener todos los productos de Realtime Database
function obtenerProductos() {
  return db.ref('productos').once('value').then(snapshot => {
    const productosObj = snapshot.val() || {};
    return Object.values(productosObj);
  });
}

// Ejemplo de uso:
// obtenerProductos().then(productos => console.log(productos));
// guardarProducto({ nombre: "Tomate", precio: 10, stock: 100 });

// Puedes conectar estas funciones con tu UI según lo necesites.

// Función para mostrar diálogo de confirmación
function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3 style="color: #FF3B30; margin-bottom: 15px;">${title}</h3>
                <div style="white-space: pre-line; line-height: 1.6; margin-bottom: 20px; text-align: left;">${message}</div>
                <div class="dialog-buttons">
                    <button class="btn-secondary dialog-cancel">Cancelar</button>
                    <button class="btn-danger dialog-confirm">ELIMINAR TODO</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const handleConfirm = () => {
            document.body.removeChild(dialog);
            resolve(true);
        };

        const handleCancel = () => {
            document.body.removeChild(dialog);
            resolve(false);
        };

        dialog.querySelector('.dialog-confirm').addEventListener('click', handleConfirm);
        dialog.querySelector('.dialog-cancel').addEventListener('click', handleCancel);
    });
}

// Lógica del botón de ordenamiento alfabético
window.addEventListener('DOMContentLoaded', () => {
    const toggleSortBtn = document.getElementById('toggleSortBtn');
    if (toggleSortBtn) {
        toggleSortBtn.addEventListener('click', () => {
            isAlphaSortActive = !isAlphaSortActive;
            toggleSortBtn.textContent = isAlphaSortActive ? 'Orden original' : 'Ordenar A-Z';
            updateProductList();
        });
        // Asegura el texto correcto al cargar
        toggleSortBtn.textContent = isAlphaSortActive ? 'Orden original' : 'Ordenar A-Z';
    }
});

// Función para mostrar modal de edición de período
async function editPeriodModal(period) {
    const [start, end] = period.split('_');
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Crear modal de edición
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.style.zIndex = '2000';
    
    let modalContent = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h2>Editar Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</h2>
            <div class="period-edit-form">
    `;
    
    // Ordenar productos alfabéticamente para el modal
    const sortedProducts = [...products].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', {sensitivity: 'base'}));
    
    // Agregar campos editables para cada producto
    sortedProducts.forEach(product => {
        const periodData = product.periods[period] || {
            stockIn: 0,
            stockOut: 0,
            sales: 0,
            profit: 0,
            initialStock: 0,
            unitPrice: product.unitPrice,
            salePrice: product.salePrice
        };
        
        // Determinar si es el último período del producto
        const productPeriods = Object.keys(product.periods || {}).filter(p => p !== 'current');
        const isLastPeriod = productPeriods.length > 0 && period === productPeriods.sort((a, b) => {
            const [aStart, aEnd] = a.split('_');
            const [bStart, bEnd] = b.split('_');
            return new Date(bEnd) - new Date(aEnd);
        })[0];
        
        modalContent += `
            <div class="product-edit-section" data-product-id="${product.id}">
                <h3>${product.name}</h3>
                <div class="edit-fields">
                    <div class="form-group">
                        <label>Stock Inicial:</label>
                        <input type="number" class="edit-field" data-field="initialStock" value="${periodData.initialStock || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Entradas:</label>
                        <input type="number" class="edit-field" data-field="stockIn" value="${periodData.stockIn || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Salidas:</label>
                        <input type="number" class="edit-field" data-field="stockOut" value="${periodData.stockOut || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Precio Unitario:</label>
                        <input type="number" class="edit-field" data-field="unitPrice" value="${periodData.unitPrice || product.unitPrice || 0}" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Precio de Venta:</label>
                        <input type="number" class="edit-field" data-field="salePrice" value="${periodData.salePrice || product.salePrice || 0}" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Stock Final Calculado:</label>
                        <span class="calculated-final">${(periodData.initialStock || 0) + (periodData.stockIn || 0) - (periodData.stockOut || 0)}</span>
                        ${isLastPeriod ? '<small style="color: #007aff;">(Este valor se usará como stock actual del producto)</small>' : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    modalContent += `
            </div>
            <div class="modal-buttons">
                <button class="btn-primary" id="savePeriodChanges">Guardar Cambios</button>
                <button class="btn-secondary" id="cancelPeriodEdit">Cancelar</button>
            </div>
        </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Event listeners para el modal
    const saveBtn = modal.querySelector('#savePeriodChanges');
    const cancelBtn = modal.querySelector('#cancelPeriodEdit');
    
    // Actualizar stock final calculado cuando cambien los valores
    modal.querySelectorAll('.edit-field').forEach(input => {
        input.addEventListener('input', () => {
            const productSection = input.closest('.product-edit-section');
            const initialStock = parseInt(productSection.querySelector('[data-field="initialStock"]').value) || 0;
            const stockIn = parseInt(productSection.querySelector('[data-field="stockIn"]').value) || 0;
            const stockOut = parseInt(productSection.querySelector('[data-field="stockOut"]').value) || 0;
            const calculatedFinal = productSection.querySelector('.calculated-final');
            calculatedFinal.textContent = initialStock + stockIn - stockOut;
        });
    });
    
    // Guardar cambios
    saveBtn.addEventListener('click', async () => {
        try {
            for (const productSection of modal.querySelectorAll('.product-edit-section')) {
                const productId = productSection.getAttribute('data-product-id');
                const product = products.find(p => p.id === productId);
                
                if (product && product.periods && product.periods[period]) {
                    const initialStock = parseInt(productSection.querySelector('[data-field="initialStock"]').value) || 0;
                    const stockIn = parseInt(productSection.querySelector('[data-field="stockIn"]').value) || 0;
                    const stockOut = parseInt(productSection.querySelector('[data-field="stockOut"]').value) || 0;
                    const unitPrice = parseFloat(productSection.querySelector('[data-field="unitPrice"]').value) || 0;
                    const salePrice = parseFloat(productSection.querySelector('[data-field="salePrice"]').value) || 0;
                    
                    // Recalcular ventas y ganancias basadas en los nuevos valores
                    const saleAmount = stockOut * salePrice;
                    const costAmount = stockOut * unitPrice;
                    const profitAmount = saleAmount - costAmount;
                    
                    // Actualizar el período
                    product.periods[period].initialStock = initialStock;
                    product.periods[period].stockIn = stockIn;
                    product.periods[period].stockOut = stockOut;
                    product.periods[period].unitPrice = unitPrice;
                    product.periods[period].salePrice = salePrice;
                    product.periods[period].sales = saleAmount;
                    product.periods[period].profit = profitAmount;
                    
                    // Si es el último período, actualizar el currentStock y precios actuales del producto
                    const productPeriods = Object.keys(product.periods).filter(p => p !== 'current');
                    const isLastPeriod = productPeriods.length > 0 && period === productPeriods.sort((a, b) => {
                        const [aStart, aEnd] = a.split('_');
                        const [bStart, bEnd] = b.split('_');
                        return new Date(bEnd) - new Date(aEnd);
                    })[0];
                    
                    if (isLastPeriod) {
                        product.currentStock = initialStock + stockIn - stockOut;
                        product.unitPrice = unitPrice;
                        product.salePrice = salePrice;
                        
                        // Guardar stock y precios actuales optimizados
                        await actualizarStockYPreciosActuales(product.id, product.currentStock, product.unitPrice, product.salePrice);
                    }
                    
                    // Guardar solo el período específico
                    await guardarPeriodoProducto(product.id, period, product.periods[period]);
                }
            }
            
            document.body.removeChild(modal);
            showNotification('Período actualizado correctamente', 2000);
            showEditPeriodsModal();
            updateProductList();
            updateStats();
            updatePeriodInfo();
            
        } catch (error) {
            console.error('Error al actualizar período:', error);
            showDialog('Error', 'No se pudieron guardar los cambios del período.');
        }
    });
    
    // Cancelar
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Función para mostrar modal de edición de períodos independiente
function showEditPeriodsModal() {
    console.log('Mostrando modal de edición de períodos...');
    
    // Obtener todos los períodos únicos de todos los productos
    const allPeriods = new Set();
    products.forEach(product => {
        if (product.periods) {
            Object.keys(product.periods).forEach(period => {
                if (period !== 'current') {
                    allPeriods.add(period);
                }
            });
        }
    });
    
    if (allPeriods.size === 0) {
        showDialog('Información', 'No hay períodos para editar. Primero debe crear un período.');
        return;
    }
    
    // Convertir a array y ordenar por fecha (más reciente primero)
    const sortedPeriods = Array.from(allPeriods).sort((a, b) => {
        const [aStart, aEnd] = a.split('_');
        const [bStart, bEnd] = b.split('_');
        return new Date(bEnd) - new Date(aEnd);
    });
    
    // Crear modal de selección de período
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.style.zIndex = '2000';
    
    let modalContent = `
        <div class="modal-content" style="max-width: 500px;">
            <h2>Seleccionar Período para Editar</h2>
            <div class="period-selection-list">
    `;
    
    // Crear lista de períodos disponibles
    sortedPeriods.forEach(period => {
        const [start, end] = period.split('_');
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        modalContent += `
            <div class="period-selection-item" data-period="${period}">
                <div class="period-info">
                    <h3>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</h3>
                    <p>Haga clic para editar este período</p>
                </div>
                <button class="btn-primary select-period-btn" data-period="${period}">Editar</button>
            </div>
        `;
    });
    
    modalContent += `
            </div>
            <div class="modal-buttons">
                <button class="btn-secondary" id="cancelEditPeriods">Cancelar</button>
            </div>
        </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Event listeners para seleccionar período
    modal.querySelectorAll('.select-period-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const period = btn.getAttribute('data-period');
            document.body.removeChild(modal);
            await editPeriodModal(period);
        });
    });
    
    // Cancelar
    modal.querySelector('#cancelEditPeriods').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Función optimizada para guardar solo campos específicos de un producto
async function guardarCampoProducto(productId, campo, valor) {
    try {
        await db.ref(`productos/${productId}/${campo}`).set(valor);
        console.log(`Campo ${campo} actualizado en Firebase para producto ${productId}`);
    } catch (error) {
        console.error(`Error al actualizar campo ${campo} en Firebase:`, error);
        throw error;
    }
}

// Función optimizada para guardar solo un período específico
async function guardarPeriodoProducto(productId, periodo, datosPeriodo) {
    try {
        await db.ref(`productos/${productId}/periods/${periodo}`).set(datosPeriodo);
        console.log(`Período ${periodo} actualizado en Firebase para producto ${productId}`);
    } catch (error) {
        console.error(`Error al actualizar período ${periodo} en Firebase:`, error);
        throw error;
    }
}

// Función optimizada para actualizar stock y precios actuales
async function actualizarStockYPreciosActuales(productId, currentStock, unitPrice, salePrice) {
    try {
        const updates = {};
        if (currentStock !== undefined) updates.currentStock = currentStock;
        if (unitPrice !== undefined) updates.unitPrice = unitPrice;
        if (salePrice !== undefined) updates.salePrice = salePrice;
        
        await db.ref(`productos/${productId}`).update(updates);
        console.log(`Stock y precios actualizados en Firebase para producto ${productId}`);
    } catch (error) {
        console.error('Error al actualizar stock y precios en Firebase:', error);
        throw error;
    }
}

// Función optimizada para actualizar solo las etiquetas
async function actualizarEtiquetasProducto(productId, etiquetas) {
    try {
        await db.ref(`productos/${productId}/tags`).set(etiquetas);
        console.log(`Etiquetas actualizadas en Firebase para producto ${productId}`);
    } catch (error) {
        console.error('Error al actualizar etiquetas en Firebase:', error);
        throw error;
    }
}

// Función para guardar un producto individual
async function saveIndividualProduct(productId) {
    const product = products.find(p => p.id === productId);
    const pendingChanges = pendingChangesByProduct[productId];
    
    if (!product || !pendingChanges || Object.keys(pendingChanges).length === 0) {
        showNotification('No hay cambios pendientes para guardar', 2000);
        return;
    }
    
    try {
        // Guardar cada cambio pendiente
        for (const [field, newValue] of Object.entries(pendingChanges)) {
            switch (field) {
                case 'unitPrice':
                    product.unitPrice = parseFloat(newValue) || 0;
                    await guardarCampoProducto(product.id, 'unitPrice', product.unitPrice);
                    break;
                case 'salePrice':
                    product.salePrice = parseFloat(newValue) || 0;
                    await guardarCampoProducto(product.id, 'salePrice', product.salePrice);
                    break;
                case 'currentStock':
                    product.currentStock = parseInt(newValue) || 0;
                    await actualizarStockYPreciosActuales(product.id, product.currentStock);
                    break;
                case 'initialStock':
                    product.initialStock = parseInt(newValue) || 0;
                    product.currentStock = parseInt(newValue) || 0;
                    if (product.periods && product.periods.current) {
                        product.periods.current.initialStock = parseInt(newValue) || 0;
                        await guardarPeriodoProducto(product.id, 'current', product.periods.current);
                    }
                    await actualizarStockYPreciosActuales(product.id, product.currentStock);
                    await guardarCampoProducto(product.id, 'initialStock', product.initialStock);
                    break;
            }
        }
        
        // Limpiar cambios pendientes para este producto
        delete pendingChangesByProduct[productId];
        delete originalValuesByProduct[productId];
        
        // Actualizar UI
        updateProductList();
        if (selectedProduct === productId) {
            selectProduct(productId);
            updateStats();
        }
        
        // Mostrar notificación
        showNotification(`Producto "${product.name}" actualizado correctamente`, 2000);
        
    } catch (error) {
        console.error('Error al guardar producto individual:', error);
        showDialog('Error', 'No se pudieron guardar los cambios del producto.');
    }
}

// Función para actualizar el botón de guardar de un producto específico
function updateProductSaveButton(productId) {
    const saveBtn = document.querySelector(`.save-product-btn[data-product-id="${productId}"]`);
    const pendingChanges = pendingChangesByProduct[productId];
    
    console.log('Actualizando botón para producto:', productId);
    console.log('Botón encontrado:', saveBtn);
    console.log('Cambios pendientes:', pendingChanges);
    
    if (saveBtn) {
        if (pendingChanges && Object.keys(pendingChanges).length > 0) {
            saveBtn.style.display = 'inline-block';
            saveBtn.title = `Guardar cambios (${Object.keys(pendingChanges).length} campo${Object.keys(pendingChanges).length > 1 ? 's' : ''})`;
            console.log('Botón mostrado para producto:', productId);
        } else {
            saveBtn.style.display = 'none';
            console.log('Botón ocultado para producto:', productId);
        }
    } else {
        console.log('No se encontró el botón para producto:', productId);
    }
}