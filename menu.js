/* =============================================
   MENU SYSTEM — Product Rendering, Filtering,
   Search, Size Selection, Cart Integration
   ============================================= */

'use strict';

const MenuSystem = {
    currentFilter: 'all',
    searchTerm: '',
    selectedSizes: {},

    init() {
        // Initialize default sizes
        MENU_DATA.forEach(item => {
            const sizes = Object.keys(item.sizes);
            this.selectedSizes[item.id] = sizes.includes('M') ? 'M' : sizes[0];
        });

        this.render();
        this.bindEvents();
    },

    bindEvents() {
        // Filter buttons
        Utils.$$('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                Utils.$$('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.getAttribute('data-filter');
                this.render();
            });
        });

        // Search input
        Utils.on('#menu-search', 'input', Utils.debounce((e) => {
            this.searchTerm = e.target.value.toLowerCase().trim();
            this.render();
        }, 200));
    },

    getFilteredItems() {
        return MENU_DATA.filter(item => {
            const matchesFilter = this.currentFilter === 'all' || item.category === this.currentFilter;
            const matchesSearch = !this.searchTerm ||
                item.name.toLowerCase().includes(this.searchTerm) ||
                item.description.toLowerCase().includes(this.searchTerm) ||
                item.tags.some(tag => tag.toLowerCase().includes(this.searchTerm));
            return matchesFilter && matchesSearch;
        });
    },

    getPrice(item) {
        const size = this.selectedSizes[item.id];
        return item.sizes[size];
    },

    render() {
        const grid = Utils.$('#menu-grid');
        const items = this.getFilteredItems();

        if (items.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 0;">
                    <span style="font-size: 3rem; display: block; margin-bottom: 16px;">🔍</span>
                    <p style="color: var(--text-muted); font-size: 1.1rem;">No items found. Try a different search or filter.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = items.map(item => this.renderCard(item)).join('');

        // Re-bind size buttons
        Utils.$$('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.getAttribute('data-item-id');
                const size = btn.getAttribute('data-size');
                this.selectedSizes[itemId] = size;

                // Update active state
                btn.closest('.size-options').querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update price display
                const item = MENU_DATA.find(m => m.id === itemId);
                const priceEl = btn.closest('.menu-card-content').querySelector('.menu-card-price');
                priceEl.textContent = Utils.formatCurrency(item.sizes[size]);
            });
        });

        // Re-bind add to cart buttons
        Utils.$$('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.getAttribute('data-item-id');
                const item = MENU_DATA.find(m => m.id === itemId);
                const size = this.selectedSizes[itemId];

                Cart.addItem({
                    id: item.id,
                    name: item.name,
                    emoji: item.emoji,
                    size: size,
                    price: item.sizes[size]
                });

                // Button animation
                btn.textContent = '✓ Added';
                btn.classList.add('added');
                setTimeout(() => {
                    btn.textContent = 'Add to Cart';
                    btn.classList.remove('added');
                }, 1200);
            });
        });

        // Animate cards in
        grid.querySelectorAll('.menu-card').forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 60);
        });
    },

    renderCard(item) {
        const currentSize = this.selectedSizes[item.id];
        const currentPrice = item.sizes[currentSize];
        const sizes = Object.entries(item.sizes);
        const stars = '★'.repeat(Math.floor(item.rating)) + (item.rating % 1 >= 0.5 ? '½' : '');

        const sizeButtons = sizes.length > 1 ? `
            <div class="size-options">
                ${sizes.map(([size, price]) => `
                    <button class="size-btn ${size === currentSize ? 'active' : ''}"
                            data-item-id="${item.id}" data-size="${size}">
                        ${size} ${Utils.formatCurrency(price)}
                    </button>
                `).join('')}
            </div>
        ` : '';

        return `
            <div class="menu-card" data-category="${item.category}">
                <div class="menu-card-image" style="background: ${item.background};">
                    <span>${item.emoji}</span>
                    ${item.popular ? '<span class="menu-card-badge">Popular</span>' : ''}
                </div>
                <div class="menu-card-content">
                    <div class="menu-card-header">
                        <h3 class="menu-card-title">${item.name}</h3>
                        <span class="menu-card-price">${Utils.formatCurrency(currentPrice)}</span>
                    </div>
                    <p class="menu-card-desc">${item.description}</p>
                    <div class="menu-card-meta">
                        ${item.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('')}
                    </div>
                    ${sizeButtons}
                    <div class="menu-card-footer">
                        <div class="menu-card-rating">
                            <span>${stars}</span>
                            <span style="color: var(--text-muted); margin-left: 4px;">${item.rating} (${item.reviews})</span>
                        </div>
                        <button class="add-to-cart-btn" data-item-id="${item.id}">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    MenuSystem.init();
});
