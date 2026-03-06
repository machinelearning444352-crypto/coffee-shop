/* =============================================
   ADVANCED ANIMATIONS ENGINE v2
   Scroll Reveals, Parallax, Magnetic Fields,
   3D Tilt, Ripple FX, Text Reveals,
   Counter Animations, Stagger Effects,
   Morphing Shapes, Smooth Scrolling
   ============================================= */

'use strict';

const Animations = {
    observer: null,
    countersAnimated: false,
    rafId: null,

    init() {
        this.setupScrollAnimations();
        this.setupParallax();
        this.setupHoverEffects();
        this.setupCounterAnimation();
        this.setupSmoothAnchorScroll();
        this.setupNavbarTransform();
        this.injectKeyframes();
    },

    // ==========================================
    // INJECT DYNAMIC KEYFRAMES
    // ==========================================
    injectKeyframes() {
        if (document.getElementById('anim-keyframes')) return;
        const style = document.createElement('style');
        style.id = 'anim-keyframes';
        style.textContent = `
            @keyframes rippleEffect { to { transform: scale(3); opacity: 0; } }
            @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 40% { transform: translateX(10px); } 60% { transform: translateX(-10px); } 80% { transform: translateX(10px); } }
            @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px rgba(200,145,90,0.15); } 50% { box-shadow: 0 0 40px rgba(200,145,90,0.3); } }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(40px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeInScale {
                from { opacity: 0; transform: scale(0.92); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes textRevealClip {
                from { clip-path: inset(0 100% 0 0); }
                to { clip-path: inset(0 0 0 0); }
            }
            @keyframes borderGlow {
                0%, 100% { border-color: rgba(200,145,90,0.1); }
                50% { border-color: rgba(200,145,90,0.35); }
            }
            @keyframes morphBlob {
                0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
                25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
                50% { border-radius: 50% 60% 30% 60% / 40% 70% 50% 60%; }
                75% { border-radius: 40% 30% 60% 50% / 60% 40% 60% 30%; }
            }
        `;
        document.head.appendChild(style);
    },

    // ==========================================
    // SCROLL-TRIGGERED ANIMATIONS
    // ==========================================
    setupScrollAnimations() {
        const options = {
            root: null,
            rootMargin: '0px 0px -60px 0px',
            threshold: [0, 0.1, 0.3]
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.05) {
                    const el = entry.target;
                    const delay = parseInt(el.getAttribute('data-delay')) || 0;

                    // Stagger children if it's a grid/stagger container
                    if (el.hasAttribute('data-stagger')) {
                        const children = el.children;
                        Array.from(children).forEach((child, i) => {
                            setTimeout(() => {
                                child.style.animation = `slideUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards`;
                                child.style.opacity = '1';
                            }, delay + i * 100);
                        });
                    } else {
                        setTimeout(() => el.classList.add('animated'), delay);
                    }
                    this.observer.unobserve(el);
                }
            });
        }, options);

        Utils.$$('[data-animate]:not(#hero [data-animate])').forEach(el => {
            this.observer.observe(el);
        });
    },

    // ==========================================
    // PARALLAX LAYERS
    // ==========================================
    setupParallax() {
        const hero = Utils.$('.hero');
        const aboutImages = Utils.$('.about-images');

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    const wh = window.innerHeight;

                    // Hero parallax layers
                    if (hero && scrollY < wh * 1.2) {
                        const overlay = Utils.$('.hero-overlay');
                        const content = Utils.$('.hero-content');
                        const progress = scrollY / wh;

                        if (overlay) overlay.style.transform = `translateY(${scrollY * 0.25}px)`;
                        if (content) {
                            content.style.transform = `translateY(${scrollY * 0.12}px)`;
                            content.style.opacity = 1 - progress * 0.8;
                        }
                    }

                    // About images parallax
                    if (aboutImages) {
                        const rect = aboutImages.getBoundingClientRect();
                        if (rect.top < wh && rect.bottom > 0) {
                            const progress = (wh - rect.top) / (wh + rect.height);
                            const main = aboutImages.querySelector('.about-img-main');
                            const secondary = aboutImages.querySelector('.about-img-secondary');
                            if (main) main.style.transform = `translateY(${(progress - 0.5) * -25}px)`;
                            if (secondary) secondary.style.transform = `translateY(${(progress - 0.5) * 25}px)`;
                        }
                    }

                    ticking = false;
                });
                ticking = true;
            }
        });
    },

    // ==========================================
    // ADVANCED NAVBAR TRANSFORM
    // ==========================================
    setupNavbarTransform() {
        const nav = Utils.$('.navbar');
        if (!nav) return;

        let lastScroll = 0;
        let isHidden = false;

        window.addEventListener('scroll', Utils.throttle(() => {
            const current = window.scrollY;

            // Add scrolled class
            if (current > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            // Hide on scroll down, show on up (beyond hero)
            if (current > window.innerHeight * 0.5) {
                if (current > lastScroll && !isHidden && current - lastScroll > 10) {
                    nav.style.transform = 'translateY(-100%)';
                    isHidden = true;
                } else if (current < lastScroll && isHidden) {
                    nav.style.transform = 'translateY(0)';
                    isHidden = false;
                }
            } else {
                nav.style.transform = 'translateY(0)';
                isHidden = false;
            }

            lastScroll = current;
        }, 16));
    },

    // ==========================================
    // HOVER FX — Magnetic, Tilt, Ripple
    // ==========================================
    setupHoverEffects() {
        // Magnetic buttons
        Utils.$$('.btn-primary, .btn-outline').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
                btn.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
                setTimeout(() => btn.style.transition = '', 400);
            });
        });

        // 3D Tilt on cards
        if (window.innerWidth > 768) {
            Utils.$$('.menu-card, .special-card, .review-card').forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width;
                    const y = (e.clientY - rect.top) / rect.height;
                    const rotateX = (y - 0.5) * -10;
                    const rotateY = (x - 0.5) * 10;

                    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;

                    // Dynamic light reflection
                    const glareX = x * 100;
                    const glareY = y * 100;
                    card.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(200,145,90,0.03), transparent 50%), var(--bg-card)`;
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                    card.style.background = '';
                    card.style.transition = 'transform 0.5s ease, background 0.5s ease';
                    setTimeout(() => card.style.transition = '', 500);
                });
            });
        }

        // Ripple on all buttons
        Utils.$$('.btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height) * 2;
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute; width: ${size}px; height: ${size}px;
                    left: ${x}px; top: ${y}px; border-radius: 50%;
                    background: rgba(255,255,255,0.15); transform: scale(0);
                    animation: rippleEffect 0.7s ease-out; pointer-events: none;
                `;

                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 700);
            });
        });

        // Typewriter on section tags
        this.setupTypewriter();

        // Glow pulse on featured elements
        this.setupGlowPulse();
    },

    // ==========================================
    // TYPEWRITER EFFECT ON SCROLL
    // ==========================================
    setupTypewriter() {
        const tags = Utils.$$('.section-tag');
        const typeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.typed) {
                    entry.target.dataset.typed = 'true';
                    const text = entry.target.textContent;
                    entry.target.textContent = '';
                    entry.target.style.visibility = 'visible';

                    let i = 0;
                    const interval = setInterval(() => {
                        entry.target.textContent += text[i];
                        i++;
                        if (i >= text.length) clearInterval(interval);
                    }, 35);

                    typeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        tags.forEach(tag => typeObserver.observe(tag));
    },

    // ==========================================
    // ANIMATED COUNTERS (Hero Stats)
    // ==========================================
    setupCounterAnimation() {
        const counters = Utils.$$('.stat-number[data-count]');
        if (!counters.length) return;

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.countersAnimated) {
                    this.countersAnimated = true;
                    counters.forEach(counter => {
                        const target = parseFloat(counter.getAttribute('data-count'));
                        const isFloat = target % 1 !== 0;
                        const duration = 2200;
                        let start = null;

                        const animate = (timestamp) => {
                            if (!start) start = timestamp;
                            const elapsed = timestamp - start;
                            const progress = Math.min(elapsed / duration, 1);
                            // Ease out cubic
                            const eased = 1 - Math.pow(1 - progress, 3);
                            const current = eased * target;

                            counter.textContent = isFloat ? current.toFixed(1) : Math.floor(current);

                            if (progress < 1) {
                                requestAnimationFrame(animate);
                            } else {
                                counter.textContent = isFloat ? target.toFixed(1) : target;
                            }
                        };
                        requestAnimationFrame(animate);
                    });
                    counterObserver.disconnect();
                }
            });
        }, { threshold: 0.3 });

        const statsContainer = Utils.$('.hero-stats');
        if (statsContainer) counterObserver.observe(statsContainer);
    },

    // ==========================================
    // GLOW PULSE ON FEATURED ELEMENTS
    // ==========================================
    setupGlowPulse() {
        Utils.$$('.about-experience-badge, .special-badge').forEach(el => {
            el.style.animation = (el.style.animation ? el.style.animation + ', ' : '') + 'glowPulse 3s ease infinite';
        });
    },

    // ==========================================
    // SMOOTH ANCHOR SCROLLING
    // ==========================================
    setupSmoothAnchorScroll() {
        Utils.$$('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId === '#') return;
                const target = document.querySelector(targetId);
                if (!target) return;

                e.preventDefault();
                const navHeight = Utils.$('.navbar')?.offsetHeight || 0;
                const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

                window.scrollTo({
                    top: targetPos,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                Utils.$('#nav-links')?.classList.remove('show');
                Utils.$('#mobile-menu-toggle')?.classList.remove('active');
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => Animations.init(), 150);
});
