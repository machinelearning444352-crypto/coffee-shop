/* =============================================
   EMBER & BREW — Core Application
   Navigation, Theme, Cart, Preloader, 
   Toast System, Utility Functions
   ============================================= */

'use strict';

// ==========================================
// GLOBAL STATE
// ==========================================
const AppState = {
    cart: [],
    theme: localStorage.getItem('eb-theme') || 'dark',
    menuOpen: false,
    cartOpen: false,
    scrollY: 0,
    rewardsPoints: parseInt(localStorage.getItem('eb-points')) || 0,
    rewardsMember: JSON.parse(localStorage.getItem('eb-member')) || null,
    orderHistory: JSON.parse(localStorage.getItem('eb-orders')) || [],
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const Utils = {
    $(selector) { return document.querySelector(selector); },
    $$(selector) { return document.querySelectorAll(selector); },

    on(el, event, handler, options) {
        if (typeof el === 'string') el = document.querySelector(el);
        if (el) el.addEventListener(event, handler, options);
    },

    onAll(selector, event, handler) {
        document.querySelectorAll(selector).forEach(el => el.addEventListener(event, handler));
    },

    create(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([key, val]) => {
            if (key === 'className') el.className = val;
            else if (key === 'innerHTML') el.innerHTML = val;
            else if (key === 'textContent') el.textContent = val;
            else if (key.startsWith('data')) el.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), val);
            else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
            else el.setAttribute(key, val);
        });
        children.forEach(child => {
            if (typeof child === 'string') el.appendChild(document.createTextNode(child));
            else if (child) el.appendChild(child);
        });
        return el;
    },

    formatCurrency(amount) {
        return '$' + parseFloat(amount).toFixed(2);
    },

    generateId() {
        return 'EB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    },

    debounce(fn, delay = 250) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    },

    throttle(fn, limit = 100) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    },

    saveToStorage(key, value) {
        try { localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value); }
        catch (e) { console.warn('Storage save failed:', e); }
    },

    getFromStorage(key, fallback = null) {
        try {
            const val = localStorage.getItem(key);
            if (val === null) return fallback;
            try { return JSON.parse(val); } catch { return val; }
        } catch { return fallback; }
    }
};

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
const Toast = {
    container: null,

    init() {
        this.container = Utils.$('#toast-container');
    },

    show(message, type = 'info', duration = 3500) {
        const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
        const toast = Utils.create('div', { className: `toast ${type}` });
        toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
        this.container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    info(msg) { this.show(msg, 'info'); },
    warning(msg) { this.show(msg, 'warning'); }
};

// ==========================================
// THEME SYSTEM
// ==========================================
const ThemeManager = {
    init() {
        document.documentElement.setAttribute('data-theme', AppState.theme);
        Utils.on('#theme-toggle', 'click', () => this.toggle());
    },

    toggle() {
        AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', AppState.theme);
        Utils.saveToStorage('eb-theme', AppState.theme);
        Toast.info(`Switched to ${AppState.theme} mode`);
    }
};

// ==========================================
// NAVIGATION
// ==========================================
const Navigation = {
    navbar: null,
    links: null,
    sections: null,

    init() {
        this.navbar = Utils.$('#main-nav');
        this.links = Utils.$$('.nav-link');
        this.sections = Utils.$$('section[id]');

        // Scroll handler
        window.addEventListener('scroll', Utils.throttle(() => this.onScroll(), 50));

        // Mobile menu
        Utils.on('#mobile-menu-toggle', 'click', () => this.toggleMobile());

        // Smooth scroll for nav links
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    this.closeMobile();
                }
            });
        });

        // Close mobile on overlay click
        document.addEventListener('click', (e) => {
            if (AppState.menuOpen && !e.target.closest('.nav-links') && !e.target.closest('#mobile-menu-toggle')) {
                this.closeMobile();
            }
        });

        this.onScroll();
    },

    onScroll() {
        AppState.scrollY = window.scrollY;

        // Navbar background
        if (AppState.scrollY > 60) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }

        // Active section detection
        let current = '';
        this.sections.forEach(section => {
            const top = section.offsetTop - 150;
            if (AppState.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });

        this.links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === current) {
                link.classList.add('active');
            }
        });
    },

    toggleMobile() {
        AppState.menuOpen = !AppState.menuOpen;
        Utils.$('#mobile-menu-toggle').classList.toggle('active');
        Utils.$('#nav-links').classList.toggle('show');
    },

    closeMobile() {
        AppState.menuOpen = false;
        Utils.$('#mobile-menu-toggle')?.classList.remove('active');
        Utils.$('#nav-links')?.classList.remove('show');
    }
};

// ==========================================
// CART SYSTEM
// ==========================================
const Cart = {
    init() {
        Utils.on('#cart-toggle', 'click', () => this.toggle());
        Utils.on('#cart-close', 'click', () => this.close());
        Utils.on('#cart-overlay', 'click', () => this.close());
        Utils.on('#checkout-btn', 'click', () => {
            this.close();
            Payment.open();
        });

        // Load cart from storage
        const savedCart = Utils.getFromStorage('eb-cart', []);
        if (savedCart.length) {
            AppState.cart = savedCart;
            this.render();
        }
    },

    toggle() {
        AppState.cartOpen = !AppState.cartOpen;
        Utils.$('#cart-sidebar').classList.toggle('show');
        Utils.$('#cart-overlay').classList.toggle('show');
        if (AppState.cartOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
    },

    close() {
        AppState.cartOpen = false;
        Utils.$('#cart-sidebar').classList.remove('show');
        Utils.$('#cart-overlay').classList.remove('show');
        document.body.style.overflow = '';
    },

    addItem(item) {
        const existingIndex = AppState.cart.findIndex(
            ci => ci.id === item.id && ci.size === item.size
        );

        if (existingIndex > -1) {
            AppState.cart[existingIndex].quantity += 1;
        } else {
            AppState.cart.push({
                id: item.id,
                name: item.name,
                emoji: item.emoji,
                size: item.size,
                price: item.price,
                quantity: 1
            });
        }

        this.render();
        this.save();
        Toast.success(`${item.name} added to cart!`);
        this.animateCartIcon();
    },

    removeItem(index) {
        AppState.cart.splice(index, 1);
        this.render();
        this.save();
    },

    updateQuantity(index, delta) {
        const item = AppState.cart[index];
        item.quantity += delta;
        if (item.quantity <= 0) {
            this.removeItem(index);
            return;
        }
        this.render();
        this.save();
    },

    getSubtotal() {
        return AppState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    getTax() {
        return this.getSubtotal() * 0.085;
    },

    getTotal() {
        return this.getSubtotal() + this.getTax();
    },

    getItemCount() {
        return AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
    },

    clear() {
        AppState.cart = [];
        this.render();
        this.save();
    },

    save() {
        Utils.saveToStorage('eb-cart', AppState.cart);
    },

    animateCartIcon() {
        const cartBtn = Utils.$('#cart-toggle');
        cartBtn.style.transform = 'scale(1.3)';
        setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);
    },

    render() {
        const cartItems = Utils.$('#cart-items');
        const cartFooter = Utils.$('#cart-footer');
        const cartCount = Utils.$('#cart-count');
        const itemCount = this.getItemCount();

        // Update badge
        cartCount.textContent = itemCount;
        if (itemCount > 0) {
            cartCount.classList.add('show');
        } else {
            cartCount.classList.remove('show');
        }

        if (AppState.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="cart-empty">
                    <span style="font-size: 3rem;">🛒</span>
                    <p>Your cart is empty</p>
                    <a href="#menu" class="btn btn-outline btn-sm" onclick="Cart.close()">Browse Menu</a>
                </div>
            `;
            cartFooter.style.display = 'none';
            return;
        }

        cartFooter.style.display = 'block';

        let html = '';
        AppState.cart.forEach((item, index) => {
            html += `
                <div class="cart-item">
                    <span class="cart-item-emoji">${item.emoji}</span>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-size">${item.size}</div>
                        <div class="cart-item-price">${Utils.formatCurrency(item.price * item.quantity)}</div>
                        <div class="cart-item-actions">
                            <button class="qty-btn" onclick="Cart.updateQuantity(${index}, -1)">−</button>
                            <span class="cart-item-qty">${item.quantity}</span>
                            <button class="qty-btn" onclick="Cart.updateQuantity(${index}, 1)">+</button>
                            <button class="cart-item-remove" onclick="Cart.removeItem(${index})">Remove</button>
                        </div>
                    </div>
                </div>
            `;
        });

        cartItems.innerHTML = html;
        Utils.$('#cart-subtotal').textContent = Utils.formatCurrency(this.getSubtotal());
        Utils.$('#cart-tax').textContent = Utils.formatCurrency(this.getTax());
        Utils.$('#cart-total').textContent = Utils.formatCurrency(this.getTotal());
    }
};

// ==========================================
// PRELOADER
// ==========================================
const Preloader = {
    init() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                Utils.$('#preloader').classList.add('hidden');
                document.body.style.overflow = '';
                // Trigger hero animations
                Utils.$$('#hero [data-animate]').forEach((el, i) => {
                    setTimeout(() => el.classList.add('animated'), i * 150);
                });
                // Start counter animations
                this.startCounters();
            }, 1500);
        });
    },

    startCounters() {
        Utils.$$('.stat-number[data-count]').forEach(el => {
            const target = parseFloat(el.getAttribute('data-count'));
            const isDecimal = target % 1 !== 0;
            const duration = 2000;
            const startTime = performance.now();

            const animate = (time) => {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

                const current = target * eased;
                el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);

                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        });
    }
};

// ==========================================
// CUSTOM CURSOR
// ==========================================
const CustomCursor = {
    follower: null,
    dot: null,
    mouseX: 0,
    mouseY: 0,
    followerX: 0,
    followerY: 0,

    init() {
        if (window.innerWidth < 768) return;

        this.follower = Utils.$('#cursor-follower');
        this.dot = Utils.$('#cursor-dot');

        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.dot.style.left = e.clientX - 3 + 'px';
            this.dot.style.top = e.clientY - 3 + 'px';
        });

        document.addEventListener('mouseenter', () => {
            this.follower.classList.add('visible');
            this.dot.classList.add('visible');
        });

        document.addEventListener('mouseleave', () => {
            this.follower.classList.remove('visible');
            this.dot.classList.remove('visible');
        });

        // Hover effect on interactive elements
        const hoverEls = 'a, button, input, textarea, .menu-card, .special-card, .review-card, .tier';
        Utils.$$(hoverEls).forEach(el => {
            el.addEventListener('mouseenter', () => this.follower.classList.add('hovering'));
            el.addEventListener('mouseleave', () => this.follower.classList.remove('hovering'));
        });

        this.animate();
    },

    animate() {
        this.followerX = Utils.lerp(this.followerX, this.mouseX, 0.12);
        this.followerY = Utils.lerp(this.followerY, this.mouseY, 0.12);
        this.follower.style.left = this.followerX - 18 + 'px';
        this.follower.style.top = this.followerY - 18 + 'px';
        requestAnimationFrame(() => this.animate());
    }
};

// ==========================================
// HERO PARTICLES
// ==========================================
const HeroParticles = {
    init() {
        const container = Utils.$('#hero-particles');
        if (!container) return;

        for (let i = 0; i < 25; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Utils.randomBetween(3, 8);
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = Utils.randomBetween(0, 100) + '%';
            particle.style.animationDuration = Utils.randomBetween(15, 30) + 's';
            particle.style.animationDelay = Utils.randomBetween(0, 15) + 's';
            container.appendChild(particle);
        }
    }
};

// ==========================================
// CONTACT & NEWSLETTER FORMS
// ==========================================
const Forms = {
    init() {
        Utils.on('#contact-form', 'submit', (e) => {
            e.preventDefault();
            const name = Utils.$('#contact-name').value;
            Toast.success(`Thanks ${name}! We'll get back to you soon.`);
            e.target.reset();
        });

        Utils.on('#newsletter-form', 'submit', (e) => {
            e.preventDefault();
            Toast.success('Subscribed! Check your inbox for a welcome discount.');
            e.target.reset();
        });
    }
};

// ==========================================
// SPECIALS CAROUSEL
// ==========================================
const SpecialsCarousel = {
    currentIndex: 0,
    track: null,
    cards: null,
    dotsContainer: null,
    autoPlayInterval: null,

    init() {
        this.track = Utils.$('#specials-track');
        if (!this.track) return;
        this.cards = this.track.children;
        this.dotsContainer = Utils.$('#specials-dots');

        // Create dots
        const numSlides = Math.max(1, this.cards.length - this.getVisibleCount() + 1);
        for (let i = 0; i < numSlides; i++) {
            const dot = document.createElement('button');
            dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Slide ${i + 1}`);
            dot.addEventListener('click', () => this.goTo(i));
            this.dotsContainer.appendChild(dot);
        }

        Utils.on('#specials-prev', 'click', () => this.prev());
        Utils.on('#specials-next', 'click', () => this.next());

        // Add special buttons
        Utils.$$('.add-special').forEach(btn => {
            btn.addEventListener('click', () => {
                Cart.addItem({
                    id: 'special-' + btn.getAttribute('data-name').toLowerCase().replace(/\s+/g, '-'),
                    name: btn.getAttribute('data-name'),
                    emoji: '⭐',
                    size: 'Regular',
                    price: parseFloat(btn.getAttribute('data-price'))
                });
            });
        });

        this.autoPlay();

        // Pause on hover
        this.track.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.track.addEventListener('mouseleave', () => this.autoPlay());
    },

    getVisibleCount() {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    },

    getSlideWidth() {
        if (this.cards.length === 0) return 0;
        return this.cards[0].offsetWidth + parseInt(getComputedStyle(this.track).gap || 24);
    },

    goTo(index) {
        const maxIndex = Math.max(0, this.cards.length - this.getVisibleCount());
        this.currentIndex = Utils.clamp(index, 0, maxIndex);
        this.track.style.transform = `translateX(-${this.currentIndex * this.getSlideWidth()}px)`;
        this.updateDots();
    },

    next() { this.goTo(this.currentIndex + 1); },
    prev() { this.goTo(this.currentIndex - 1); },

    updateDots() {
        this.dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    },

    autoPlay() {
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => {
            const maxIndex = Math.max(0, this.cards.length - this.getVisibleCount());
            if (this.currentIndex >= maxIndex) this.goTo(0);
            else this.next();
        }, 5000);
    },

    stopAutoPlay() {
        if (this.autoPlayInterval) clearInterval(this.autoPlayInterval);
    }
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    Toast.init();
    ThemeManager.init();
    Navigation.init();
    Preloader.init();
    Cart.init();
    HeroParticles.init();
    CustomCursor.init();
    Forms.init();
    SpecialsCarousel.init();
});
