/* =============================================
   REVIEWS SYSTEM — Leave a Review,
   Star Ratings, Review Submission,
   localStorage Persistence
   ============================================= */

'use strict';

const Reviews = {
    selectedRating: 0,
    userReviews: [],

    init() {
        // Load user reviews from storage
        this.userReviews = Utils.getFromStorage('eb-reviews', []);
        this.render();
        this.bindEvents();
    },

    bindEvents() {
        // Star rating interaction
        Utils.$$('#star-rating .star').forEach(star => {
            star.addEventListener('click', () => {
                this.selectedRating = parseInt(star.getAttribute('data-value'));
                this.updateStars();
            });

            star.addEventListener('mouseenter', () => {
                const val = parseInt(star.getAttribute('data-value'));
                Utils.$$('#star-rating .star').forEach((s, i) => {
                    s.style.color = i < val ? '#fbbf24' : '';
                    s.style.transform = i < val ? 'scale(1.2)' : '';
                });
            });
        });

        Utils.$('#star-rating').addEventListener('mouseleave', () => {
            this.updateStars();
        });

        // Form submission
        Utils.on('#review-form', 'submit', (e) => {
            e.preventDefault();
            this.submitReview();
        });
    },

    updateStars() {
        Utils.$$('#star-rating .star').forEach((star, i) => {
            const isActive = i < this.selectedRating;
            star.classList.toggle('active', isActive);
            star.style.color = isActive ? '#fbbf24' : '';
            star.style.transform = isActive ? 'scale(1.15)' : '';
        });
    },

    submitReview() {
        const name = Utils.$('#review-name').value.trim();
        const email = Utils.$('#review-email').value.trim();
        const text = Utils.$('#review-text').value.trim();

        if (!name) { Toast.error('Please enter your name'); return; }
        if (!email) { Toast.error('Please enter your email'); return; }
        if (this.selectedRating === 0) { Toast.error('Please select a rating'); return; }
        if (!text) { Toast.error('Please write your review'); return; }

        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        const colors = ['#e74c8b', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const review = {
            name,
            avatar: { bg: randomColor, initial: initials },
            rating: this.selectedRating,
            text,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        };

        this.userReviews.unshift(review);
        Utils.saveToStorage('eb-reviews', this.userReviews);

        // Reset form
        Utils.$('#review-form').reset();
        this.selectedRating = 0;
        this.updateStars();

        Toast.success('Thank you for your review! 💕');
        this.render();
    },

    render() {
        const grid = Utils.$('#reviews-grid');

        if (this.userReviews.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <span style="font-size: 3.5rem; display: block; margin-bottom: 16px;">📝</span>
                    <h3 style="font-family: var(--font-display); font-size: 1.4rem; margin-bottom: 8px;">No Reviews Yet</h3>
                    <p style="color: var(--text-muted); font-size: 1rem;">Be the first to share your experience!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.userReviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-avatar" style="background: ${review.avatar.bg};">
                        ${review.avatar.initial}
                    </div>
                    <div class="review-author">
                        <h4>${review.name}</h4>
                    </div>
                </div>
                <div class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                <p class="review-text">${review.text}</p>
                <div class="review-date">${review.date}</div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Reviews.init();
});
