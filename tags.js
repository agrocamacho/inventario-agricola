// Sistema de etiquetas
let tags = [];
let selectedTags = new Set();

// Guardar una etiqueta en Firebase
function guardarTagEnFirebase(tag) {
    return db.ref('tags/' + tag.id).set(tag);
}

// Obtener todas las etiquetas desde Firebase
function obtenerTagsDesdeFirebase() {
    return db.ref('tags').once('value').then(snapshot => {
        const tagsObj = snapshot.val() || {};
        return Object.values(tagsObj);
    });
}

// Función para cargar las etiquetas en el selector (desde Firebase)
function loadTags() {
    obtenerTagsDesdeFirebase().then(fetchedTags => {
        tags = fetchedTags;
    const tagSelect = document.getElementById('tagSelect');
    tagSelect.innerHTML = '<option value="">Seleccionar etiqueta...</option>';
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.id;
        option.textContent = tag.name;
        tagSelect.appendChild(option);
        });
    });
}

// Función para mostrar las etiquetas seleccionadas
function updateSelectedTags() {
    const selectedTagsContainer = document.getElementById('selectedTags');
    selectedTagsContainer.innerHTML = '';
    selectedTags.forEach(tagId => {
        const tag = tags.find(t => t.id === tagId);
        if (tag) {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.style.backgroundColor = tag.color;
            tagElement.innerHTML = `
                ${tag.name}
                <span class="remove-tag" data-tag-id="${tag.id}">×</span>
            `;
            selectedTagsContainer.appendChild(tagElement);
        }
    });
}

// Función para agregar una nueva etiqueta (nombre en mayúsculas y sin duplicados)
function addNewTag(name, color) {
    const upperName = name.trim().toUpperCase();
    // No permitir duplicados (ignorando espacios y mayúsculas)
    const normalized = upperName.replace(/\s+/g, '');
    const existing = tags.find(tag => tag.name.replace(/\s+/g, '').toUpperCase() === normalized);
    if (existing) {
        return existing;
    }
    const newTag = {
        id: Date.now().toString(),
        name: upperName,
        color: color
    };
    tags.push(newTag);
    guardarTagEnFirebase(newTag);
    loadTags();
    return newTag;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const tagSelect = document.getElementById('tagSelect');
    const addTagBtn = document.getElementById('addTagBtn');
    const newTagModal = document.getElementById('newTagModal');
    const newTagForm = document.getElementById('newTagForm');
    const closeNewTagModal = document.getElementById('closeNewTagModal');
    
    // Cargar etiquetas al iniciar
    loadTags();
    
    // Manejar selección de etiqueta
    tagSelect.addEventListener('change', (e) => {
        const tagId = e.target.value;
        if (tagId) {
            selectedTags.add(tagId);
            updateSelectedTags();
            tagSelect.value = ''; // Resetear el selector
        }
    });
    
    // Manejar eliminación de etiqueta
    document.getElementById('selectedTags').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-tag')) {
            const tagId = e.target.dataset.tagId;
            selectedTags.delete(tagId);
            updateSelectedTags();
        }
    });
    
    // Abrir modal de nueva etiqueta
    addTagBtn.addEventListener('click', () => {
        newTagModal.style.display = 'block';
    });
    
    // Cerrar modal de nueva etiqueta
    closeNewTagModal.addEventListener('click', () => {
        newTagModal.style.display = 'none';
        newTagForm.reset();
    });
    
    // Manejar creación de nueva etiqueta
    newTagForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newTagName').value;
        const color = document.getElementById('newTagColor').value;
        
        const newTag = addNewTag(name, color);
        selectedTags.add(newTag.id);
        updateSelectedTags();
        
        newTagModal.style.display = 'none';
        newTagForm.reset();
    });
});

// Función para obtener las etiquetas seleccionadas
function getSelectedTags() {
    return Array.from(selectedTags).map(tagId => {
        return tags.find(tag => tag.id === tagId);
    });
}

// Función para limpiar las etiquetas seleccionadas
function clearSelectedTags() {
    selectedTags.clear();
    updateSelectedTags();
}

// Función para cargar etiquetas de un producto
function loadProductTags(productTags) {
    selectedTags.clear();
    if (productTags && Array.isArray(productTags)) {
        productTags.forEach(tag => {
            selectedTags.add(tag.id);
        });
    }
    updateSelectedTags();
} 