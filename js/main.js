'use strict';

// 1. Categories Mapping
const CATEGORIES = {
    'food-cheap': { label: 'Warteg', icon: 'utensils' },
    'food-restaurant': { label: 'Restoran', icon: 'chef-hat' },
    'food-cafe-wifi': { label: 'Kafe', icon: 'coffee' },
};

// 2. Application State
let allPlaces = [];
let activeCategory = null;
let searchQuery = '';

// 3. Init Function
async function init() {
    try {
        const response = await fetch('data/places.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allPlaces = await response.json();
    } catch (error) {
        console.error('Gagal mengambil data tempat:', error);
        allPlaces = [];
    }

    // Render filter categories
    renderCategoryPills();

    // Initial render (show all)
    filterAndRender();

    // Setup live search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            filterAndRender();
        });
    }
}

// 4. Render Category Pills
function renderCategoryPills() {
    const container = document.getElementById('category-pills');
    if (!container) return;

    container.innerHTML = '';

    for (const [key, cat] of Object.entries(CATEGORIES)) {
        const button = document.createElement('button');
        button.className = 'category-pill';
        button.innerHTML = `<i data-lucide="${cat.icon}" class="icon-xs"></i> <span>${cat.label}</span>`;

        button.addEventListener('click', () => {
            // Toggle active class
            const currentlyActive = button.classList.contains('active');

            // Reset all pills
            document.querySelectorAll('.category-pill').forEach(btn => btn.classList.remove('active'));

            if (currentlyActive) {
                activeCategory = null;
            } else {
                button.classList.add('active');
                activeCategory = key;
            }

            filterAndRender();
        });

        container.appendChild(button);
    }
}

// 5. Filter and Render Loop
function filterAndRender() {
    let filtered = allPlaces;

    // Filter by category
    if (activeCategory) {
        filtered = filtered.filter(p => p.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(p => {
            const nameMatch = p.name ? p.name.toLowerCase().includes(searchQuery) : false;
            const descMatch = p.description ? p.description.toLowerCase().includes(searchQuery) : false;
            const addressMatch = p.address ? p.address.toLowerCase().includes(searchQuery) : false;
            const tagsMatch = p.tags ? p.tags.some(t => t.toLowerCase().includes(searchQuery)) : false;
            return nameMatch || descMatch || addressMatch || tagsMatch;
        });
    }

    renderCards(filtered);
}

// 6. Render Place Cards
function renderCards(places) {
    const grid = document.getElementById('directory-grid');
    if (!grid) return;

    // We make sure the grid is fully visible so the children can animate in properly without double-fading.
    grid.style.opacity = '1';
    grid.style.animation = 'none';

    grid.innerHTML = '';

    if (places.length === 0) {
        grid.innerHTML = `
      <div class="empty-state" style="opacity: 0; animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
        <i data-lucide="info" class="empty-state-icon"></i>
        <h3>Tidak ada tempat ditemukan</h3>
        <p>Coba gunakan kata kunci pencarian lain atau pilih kategori berbeda.</p>
      </div>`;
        lucide.createIcons();
        return;
    }

    places.forEach((place, index) => {
        const cat = CATEGORIES[place.category] || { label: place.category, icon: 'map-pin' };

        // Price range representation
        const priceText = 'Rp'.repeat(place.price_range || 1);

        // HTML detail options
        const hoursHTML = place.hours
            ? `<p class="card-detail"><i data-lucide="clock" class="icon-xs"></i> <span>${escapeHTML(place.hours)}</span></p>`
            : '';
        const phoneHTML = place.phone
            ? `<p class="card-detail"><i data-lucide="phone" class="icon-xs"></i> <span>${escapeHTML(place.phone)}</span></p>`
            : '';

        // Tags HTML
        const tagsHTML = place.tags && place.tags.length > 0
            ? `<div class="card-tags">${place.tags.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}</div>`
            : '';

        // Card Element creation
        const card = document.createElement('div');
        card.className = 'card';

        // Add staggered animation dynamically
        card.style.opacity = '0';
        card.style.animation = 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        card.style.animationDelay = `${index * 0.06}s`;

        card.innerHTML = `
      <div class="card-header">
        <span class="badge badge-category">
          <i data-lucide="${cat.icon}" class="icon-xs"></i> ${escapeHTML(cat.label)}
        </span>
        <span class="badge badge-price">${priceText}</span>
      </div>
      <h3 class="card-title">${escapeHTML(place.name)}</h3>
      <p class="card-description">${escapeHTML(place.description || '')}</p>
      <div class="card-details">
        <p class="card-detail"><i data-lucide="map-pin" class="icon-xs"></i> <span>${escapeHTML(place.address)}</span></p>
        ${hoursHTML}
        ${phoneHTML}
      </div>
      ${tagsHTML}
      <div class="card-footer">
        <a href="${escapeHTML(place.maps_url)}" target="_blank" rel="noopener noreferrer" class="btn-maps">
          <i data-lucide="external-link" class="icon-xs"></i> Buka Peta
        </a>
      </div>
    `;

        grid.appendChild(card);
    });

    // Re-initialize Lucide Icons for dynamic content
    lucide.createIcons();
}

// 7. Security Escape Helper
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// Run bootstrap
document.addEventListener('DOMContentLoaded', init);
