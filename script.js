// Global variables
let products = [];
let currentProductIndex = -1;
let currentPeriod = 'current';
let currentProduct = null;
let lastPeriodEndDate = null;

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

// Initialize DOM elements
function initializeDOMElements() {
    productList = document.getElementById('productList');
    productDetails = document.getElementById('productDetails');
    productModal = document.getElementById('productModal');
    productForm = document.getElementById('productForm');
    addProductBtn = document.getElementById('addProductBtn');
    deleteProductBtn = document.getElementById('deleteProductBtn');
    closeModalBtn = document.getElementById('closeModal');
    prevProductBtn = document.getElementById('prevProduct');
    nextProductBtn = document.getElementById('nextProduct');
    periodSelect = document.getElementById('periodSelect');
    newPeriodBtn = document.getElementById('newPeriodBtn');
    stockIn = document.getElementById('stockIn');
    stockOut = document.getElementById('stockOut');
    addStockBtn = document.getElementById('addStockBtn');
    removeStockBtn = document.getElementById('removeStockBtn');
    productName = document.getElementById('productName');
    unitPrice = document.getElementById('unitPrice');
    salePrice = document.getElementById('salePrice');
    currentStock = document.getElementById('currentStock');
    productImage = document.getElementById('productImage');
    totalInventoryValue = document.getElementById('totalInventoryValue');
    totalProducts = document.getElementById('totalProducts');
    totalPotentialProfit = document.getElementById('totalPotentialProfit');
    statsPanel = document.getElementById('statsPanel');
    mainContainer = document.getElementById('mainContainer');
    viewInventoryBtn = document.getElementById('viewInventoryBtn');

    // Verify essential elements
    if (!productList || !productDetails || !productModal || !productForm) {
        throw new Error('Essential DOM elements not found');
    }
}

// Initialize the application
async function init() {
    try {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize DOM elements
        initializeDOMElements();

        // Cargar productos
        await loadProducts();
        
        // Configurar listeners y UI
        setupEventListeners();
        updatePeriodSelect();
        
        // Mostrar el primer producto si existe
        if (products.length > 0) {
            selectProduct(0);
        }
        
        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showDialog('Error', `Hubo un error al inicializar la aplicación: ${error.message}. Por favor, recargue la página.`);
    }
}

// Función para formatear números con comas y sin decimales
function formatNumber(number) {
    return `$${Math.round(number).toLocaleString('es-ES')}`;
}

// Update statistics
function updateStatistics() {
    if (!totalInventoryValue || !totalProducts || !totalPotentialProfit) return;

    const stats = products.reduce((acc, product) => {
        acc.totalValue += product.unitPrice * product.stock;
        acc.totalProducts += 1;
        acc.potentialProfit += (product.salePrice - product.unitPrice) * product.stock;
        return acc;
    }, { totalValue: 0, totalProducts: 0, potentialProfit: 0 });

    totalInventoryValue.textContent = formatNumber(stats.totalValue);
    totalProducts.textContent = stats.totalProducts.toLocaleString('es-ES');
    totalPotentialProfit.textContent = formatNumber(stats.potentialProfit);
}

// Load products from localStorage
async function loadProducts() {
    try {
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
            products = JSON.parse(savedProducts);
            // Asegurarse de que cada producto tenga un objeto periods
            products = products.map(product => ({
                ...product,
                periods: product.periods || { current: { stockIn: 0, stockOut: 0, sales: 0, profit: 0 } }
            }));
            console.log('Productos cargados exitosamente:', products);
            updateProductList();
            updateStatistics();
            
            // Seleccionar el primer producto si existe
            if (products.length > 0) {
                selectProduct(0);
            }
        } else {
            console.log('No hay productos guardados');
            products = [];
            updateProductList();
            updateStatistics();
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showDialog('Error', 'No se pudieron cargar los productos. Por favor, recargue la página.');
    }
}

// Save products to localStorage
async function saveProducts() {
    try {
        localStorage.setItem('products', JSON.stringify(products));
        console.log('Productos guardados exitosamente');
        updateStatistics();
    } catch (error) {
        console.error('Error al guardar productos:', error);
        showDialog('Error', 'No se pudieron guardar los productos. Por favor, intente nuevamente.');
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
    productList.innerHTML = '';
    
    products.forEach((product, index) => {
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        if (index === currentProductIndex) {
            productElement.classList.add('selected');
        }
        
        productElement.innerHTML = `
            <div class="product-info">
                <span class="product-name">${product.name}</span>
                <span class="product-stock">Stock: ${product.stock}</span>
            </div>
            <button class="delete-btn" title="Eliminar producto">🗑️</button>
        `;
        
        // Add click event for selecting the product
        productElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                selectProduct(index);
            }
        });
        
        // Add click event for delete button
        const deleteBtn = productElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('¿Está seguro que desea eliminar este producto?')) {
                await deleteProduct(index);
            }
        });
        
        productList.appendChild(productElement);
    });
}

// Custom dialog functions
function showDialog(title, message) {
    alert(`${title}\n${message}`);
}

function showEditDialog(message, currentValue) {
    const dialog = document.getElementById('editDialog');
    const messageElement = dialog.querySelector('.dialog-message');
    const inputElement = dialog.querySelector('.dialog-input');
    const confirmButton = dialog.querySelector('.dialog-confirm');
    const cancelButton = dialog.querySelector('.dialog-cancel');
    
    messageElement.textContent = message;
    inputElement.value = currentValue;
    dialog.style.display = 'block';
    inputElement.focus();
    inputElement.select();
    
    return new Promise((resolve) => {
        const handleConfirm = () => {
            dialog.style.display = 'none';
            resolve(inputElement.value);
            cleanup();
        };
        
        const handleCancel = () => {
            dialog.style.display = 'none';
            resolve(null);
            cleanup();
        };
        
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        const cleanup = () => {
            confirmButton.removeEventListener('click', handleConfirm);
            cancelButton.removeEventListener('click', handleCancel);
            inputElement.removeEventListener('keydown', handleKeyPress);
        };
        
        confirmButton.addEventListener('click', handleConfirm);
        cancelButton.addEventListener('click', handleCancel);
        inputElement.addEventListener('keydown', handleKeyPress);
    });
}

// Select a product to display its details
function selectProduct(index) {
    currentProductIndex = index;
    const product = products[index];
    
    if (product) {
        // Agregar animación de transición
        productDetails.classList.add('fade-out');
        
        setTimeout(() => {
            productName.textContent = product.name;
            unitPrice.textContent = formatNumber(product.unitPrice);
            salePrice.textContent = formatNumber(product.salePrice);
            currentStock.textContent = product.stock.toLocaleString('es-ES');
            
            // Actualizar la imagen del producto
            const productImage = document.querySelector('#productImage img');
            if (productImage) {
                productImage.src = product.image;
                productImage.onerror = function() {
                    this.src = 'placeholder.svg';
                };
            }

            // Actualizar análisis financiero
            updateFinancialAnalysis(product);
            
            productDetails.style.display = 'block';
            productDetails.classList.remove('fade-out');
            productDetails.classList.add('fade-in');
        }, 300);
    } else {
        productName.textContent = 'Seleccione un producto';
        unitPrice.textContent = '$0';
        salePrice.textContent = '$0';
        currentStock.textContent = '0';
        
        // Resetear la imagen
        const productImage = document.querySelector('#productImage img');
        if (productImage) {
            productImage.src = 'placeholder.svg';
        }
        
        productDetails.style.display = 'none';
    }
    
    // Update selected state in list
    document.querySelectorAll('.product-item').forEach((item, i) => {
        if (i === index) {
            item.classList.add('selected');
            // Scroll al elemento seleccionado
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
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
        const newProduct = {
            id: Date.now().toString(),
            name: productData.name,
            unitPrice: parseFloat(productData.unitPrice),
            salePrice: parseFloat(productData.salePrice),
            stock: parseInt(productData.stock),
            image: 'placeholder.svg',
            periods: {
                current: {
                    stockIn: 0,
                    stockOut: 0,
                    sales: 0,
                    profit: 0
                }
            }
        };
        
        // Handle image if provided
        const imageFile = productData.image;
        if (imageFile && imageFile.size > 0) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                newProduct.image = e.target.result;
                products.push(newProduct);
                await saveProducts();
                updateProductList();
                selectProduct(products.length - 1);
            };
            reader.readAsDataURL(imageFile);
        } else {
            products.push(newProduct);
            await saveProducts();
            updateProductList();
            selectProduct(products.length - 1);
        }
        
        console.log('Producto agregado exitosamente');
    } catch (error) {
        console.error('Error al agregar producto:', error);
        showDialog('Error', 'No se pudo agregar el producto. Por favor, intente nuevamente.');
    }
}

// Update product information
function updateProduct(index, productData) {
    const updatedProduct = {
        ...products[index],
        name: productData.name,
        unitPrice: parseFloat(productData.unitPrice),
        salePrice: parseFloat(productData.salePrice),
        stock: parseInt(productData.stock)
    };
    
    // Handle image if provided
    const imageFile = productData.image;
    if (imageFile && imageFile.size > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            updatedProduct.image = e.target.result;
            products[index] = updatedProduct;
            saveProducts();
            updateProductList();
            selectProduct(index);
        };
        reader.readAsDataURL(imageFile);
    } else {
        products[index] = updatedProduct;
        saveProducts();
        updateProductList();
        selectProduct(index);
    }
}

// Add stock to a product
function addStock(amount) {
    if (currentProductIndex === -1) return;
    
    const product = products[currentProductIndex];
    product.stock += amount;
    
    if (!product.periods[currentPeriod]) {
        product.periods[currentPeriod] = {
            stockIn: 0,
            stockOut: 0,
            sales: 0,
            profit: 0
        };
    }
    
    product.periods[currentPeriod].stockIn += amount;
    saveProducts();
    updateProductList();
    selectProduct(currentProductIndex);
    updateFinancialAnalysis(product);
}

// Remove stock from a product
function removeStock(amount) {
    if (currentProductIndex === -1) return;
    
    const product = products[currentProductIndex];
    if (product.stock < amount) {
        alert('No hay suficiente stock disponible');
        return;
    }
    
    product.stock -= amount;
    
    if (!product.periods[currentPeriod]) {
        product.periods[currentPeriod] = {
            stockIn: 0,
            stockOut: 0,
            sales: 0,
            profit: 0
        };
    }
    
    const saleAmount = amount * product.salePrice;
    const profitAmount = amount * (product.salePrice - product.unitPrice);
    
    product.periods[currentPeriod].stockOut += amount;
    product.periods[currentPeriod].sales += saleAmount;
    product.periods[currentPeriod].profit += profitAmount;
    
    saveProducts();
    updateProductList();
    selectProduct(currentProductIndex);
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
                if (!product.periods[periodName]) {
                    product.periods[periodName] = {
                        stockIn: 0,
                        stockOut: 0,
                        sales: 0,
                        profit: 0,
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString()
                    };
                }
            });
            
            currentPeriod = periodName;
            updatePeriodSelect();
            selectProduct(currentProductIndex);
            saveProducts();
            
            dateRangeModal.style.display = 'none';
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
        // Remove the product from the array
        products.splice(index, 1);
        
        // Save the updated products list
        await saveProducts();
        
        // Handle the current product selection
        if (index === currentProductIndex) {
            currentProductIndex = -1;
            showProductDetails(null);
        } else if (index < currentProductIndex) {
            currentProductIndex--;
        }
        
        // Update the product list
        updateProductList();
        
        console.log('Producto eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        showDialog('Error', 'No se pudo eliminar el producto. Por favor, intente nuevamente.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add product button
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            const productModal = document.getElementById('productModal');
            if (productModal) {
                productModal.style.display = 'block';
            }
        });
    }
    
    // Close modal button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            const productModal = document.getElementById('productModal');
            if (productModal) {
                productModal.style.display = 'none';
            }
        });
    }
    
    // Product form submission
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(productForm);
            const productData = {
                name: formData.get('productName'),
                unitPrice: formData.get('unitPrice'),
                salePrice: formData.get('salePrice'),
                stock: formData.get('initialStock'),
                image: formData.get('productImage')
            };
            
            await addProduct(productData);
            const productModal = document.getElementById('productModal');
            if (productModal) {
                productModal.style.display = 'none';
            }
            productForm.reset();
        });
    }
    
    // Navigation buttons
    if (prevProductBtn) {
        prevProductBtn.addEventListener('click', () => {
            if (currentProductIndex > 0) {
                selectProduct(currentProductIndex - 1);
            }
        });
    }
    
    if (nextProductBtn) {
        nextProductBtn.addEventListener('click', () => {
            if (currentProductIndex < products.length - 1) {
                selectProduct(currentProductIndex + 1);
            }
        });
    }
    
    // Period selection
    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
            currentPeriod = e.target.value;
            selectProduct(currentProductIndex);
        });
    }
    
    // New period button
    if (newPeriodBtn) {
        newPeriodBtn.addEventListener('click', createNewPeriod);
    }
    
    // Stock controls
    if (addStockBtn) {
        addStockBtn.addEventListener('click', () => {
            const stockIn = document.getElementById('stockIn');
            if (stockIn) {
                const amount = parseInt(stockIn.value);
                if (amount > 0) {
                    addStock(amount);
                    stockIn.value = '';
                }
            }
        });
    }
    
    if (removeStockBtn) {
        removeStockBtn.addEventListener('click', () => {
            const stockOut = document.getElementById('stockOut');
            if (stockOut) {
                const amount = parseInt(stockOut.value);
                if (amount > 0) {
                    removeStock(amount);
                    stockOut.value = '';
                }
            }
        });
    }
    
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const field = btn.dataset.field;
            const currentValue = document.getElementById(field)?.textContent;
            if (currentValue !== undefined) {
                const newValue = await showEditDialog(`Ingrese el nuevo valor para ${field}:`, currentValue);
                
                if (newValue !== null) {
                    const product = products[currentProductIndex];
                    if (product) {
                        switch (field) {
                            case 'unitPrice':
                                product.unitPrice = parseFloat(newValue);
                                break;
                            case 'salePrice':
                                product.salePrice = parseFloat(newValue);
                                break;
                            case 'currentStock':
                                product.stock = parseInt(newValue);
                                break;
                        }
                        saveProducts();
                        selectProduct(currentProductIndex);
                    }
                }
            }
        });
    });
    
    // Delete product button
    if (deleteProductBtn) {
        deleteProductBtn.addEventListener('click', () => {
            if (currentProductIndex !== -1) {
                deleteProduct(currentProductIndex);
            }
        });
    }
    
    // Setup keyboard navigation
    setupKeyboardNavigation();
    
    // Setup image edit
    setupImageEdit();

    // Image preview
    const productImageInput = document.getElementById('productImageInput');
    if (productImageInput) {
        productImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.querySelector('#productImage img');
                    if (preview) {
                        preview.src = e.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // View Inventory button
    if (viewInventoryBtn) {
        viewInventoryBtn.addEventListener('click', () => {
            statsPanel.style.display = 'none';
            mainContainer.style.display = 'flex';
            // Asegurarse de que se muestre el primer producto al entrar al inventario
            if (products.length > 0 && currentProductIndex === -1) {
                selectProduct(0);
            }
        });
    }

    // Add button to return to stats
    const addStatsButton = () => {
        const backToStatsBtn = document.createElement('button');
        backToStatsBtn.className = 'btn-secondary back-to-stats';
        backToStatsBtn.innerHTML = '📊 Ver Estadísticas';
        backToStatsBtn.style.position = 'fixed';
        backToStatsBtn.style.top = '20px';
        backToStatsBtn.style.right = '20px';
        backToStatsBtn.style.zIndex = '1000';
        backToStatsBtn.style.padding = '12px 24px';
        backToStatsBtn.style.fontSize = '1.1em';
        backToStatsBtn.style.backgroundColor = 'white';
        backToStatsBtn.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        
        backToStatsBtn.addEventListener('click', () => {
            mainContainer.style.display = 'none';
            statsPanel.style.display = 'flex';
            updateStatistics();
        });
        
        document.body.appendChild(backToStatsBtn);
    };

    addStatsButton();
}

// Setup keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Solo procesar las teclas si estamos en el inventario
        if (mainContainer.style.display === 'none') return;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const items = document.querySelectorAll('.product-item');
            const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
            
            if (currentIndex === -1) {
                if (items.length > 0) {
                    selectProduct(0);
                }
                return;
            }
            
            let newIndex;
            if (e.key === 'ArrowLeft') {
                newIndex = Math.max(0, currentIndex - 1);
                // Agregar efecto visual para la flecha izquierda
                prevProductBtn.classList.add('active');
                setTimeout(() => prevProductBtn.classList.remove('active'), 200);
            } else {
                newIndex = Math.min(items.length - 1, currentIndex + 1);
                // Agregar efecto visual para la flecha derecha
                nextProductBtn.classList.add('active');
                setTimeout(() => nextProductBtn.classList.remove('active'), 200);
            }
            
            selectProduct(newIndex);
            items[newIndex].focus();
            
            // Mostrar indicador de navegación
            showNavigationIndicator(e.key === 'ArrowLeft' ? '←' : '→');
        }
    });
}

// Función para mostrar indicador de navegación
function showNavigationIndicator(direction) {
    // Remover indicador existente si hay uno
    const existingIndicator = document.querySelector('.navigation-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    // Crear nuevo indicador
    const indicator = document.createElement('div');
    indicator.className = 'navigation-indicator';
    indicator.textContent = direction;
    document.body.appendChild(indicator);

    // Animar y remover el indicador
    setTimeout(() => {
        indicator.classList.add('fade-out');
        setTimeout(() => indicator.remove(), 500);
    }, 500);
}

// Edit image
function setupImageEdit() {
    const editImageBtn = document.getElementById('editImageBtn');
    const imageInput = document.getElementById('imageInput');
    
    editImageBtn.addEventListener('click', () => {
        imageInput.click();
    });
    
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const product = products[currentProductIndex];
                product.image = e.target.result;
                saveProducts();
                selectProduct(currentProductIndex);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Función para mostrar detalles del producto
function showProductDetails(product) {
    currentProduct = product;
    if (product) {
        productName.textContent = product.name;
        unitPrice.textContent = formatNumber(product.unitPrice);
        salePrice.textContent = formatNumber(product.salePrice);
        currentStock.textContent = product.stock.toLocaleString('es-ES');
        productImage.src = product.image || 'placeholder.svg';
        productDetails.style.display = 'block';
    } else {
        productName.textContent = 'Seleccione un producto';
        unitPrice.textContent = '$0';
        salePrice.textContent = '$0';
        currentStock.textContent = '0';
        productImage.src = 'placeholder.svg';
        productDetails.style.display = 'none';
    }
}

// Función para actualizar el análisis financiero
function updateFinancialAnalysis(product) {
    // Calcular valores financieros
    const totalCostPrice = product.unitPrice * product.stock;
    const stockValue = product.salePrice * product.stock;
    const potentialProfit = stockValue - totalCostPrice;

    // Actualizar elementos en el DOM
    document.getElementById('totalCostPrice').textContent = formatNumber(totalCostPrice);
    document.getElementById('stockValue').textContent = formatNumber(stockValue);
    document.getElementById('potentialProfit').textContent = formatNumber(potentialProfit);

    // Actualizar resumen de ventas
    const periodData = product.periods[currentPeriod] || {
        stockIn: 0,
        stockOut: 0,
        sales: 0,
        profit: 0
    };

    document.getElementById('totalSalesValue').textContent = formatNumber(periodData.sales);
    document.getElementById('totalProfit').textContent = formatNumber(periodData.profit);

    // Actualizar estadísticas del período
    const initialStock = product.stock - periodData.stockIn + periodData.stockOut;
    const addedStock = periodData.stockIn;
    const soldStock = periodData.stockOut;
    const finalStock = product.stock;
    const totalStockPeriod = initialStock + addedStock; // Cantidad total que ha pasado por el inventario

    document.getElementById('initialStock').textContent = initialStock.toLocaleString('es-ES');
    document.getElementById('addedStock').textContent = addedStock.toLocaleString('es-ES');
    document.getElementById('soldStock').textContent = soldStock.toLocaleString('es-ES');
    document.getElementById('totalStockPeriod').textContent = totalStockPeriod.toLocaleString('es-ES');
    document.getElementById('finalStock').textContent = finalStock.toLocaleString('es-ES');
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init().catch(error => {
        console.error('Error fatal al iniciar la aplicación:', error);
        showDialog('Error Fatal', `La aplicación no pudo iniciarse correctamente: ${error.message}. Por favor, recargue la página.`);
    });
});