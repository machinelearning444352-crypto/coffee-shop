/* =============================================
   REWARDS SYSTEM — Loyalty Points, Tiers,
   Member Management, localStorage Persistence
   ============================================= */

'use strict';

const Rewards = {
    tiers: [
        { name: 'Bronze', min: 0, max: 199, multiplier: 1, color: '#cd7f32', perks: '1x points' },
        { name: 'Silver', min: 200, max: 499, multiplier: 1.5, color: '#c0c0c0', perks: '1.5x points + free size upgrades' },
        { name: 'Gold', min: 500, max: Infinity, multiplier: 2, color: '#ffd700', perks: '2x points + free drinks monthly' }
    ],

    init() {
        Utils.on('#rewards-join-btn', 'click', () => this.joinProgram());
        this.updateCard();
        this.checkExistingMember();
    },

    checkExistingMember() {
        if (AppState.rewardsMember) {
            Utils.$('#rewards-signup').innerHTML = `
                <div style="text-align: center; padding: 12px; background: var(--bg-glass-light); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <p style="color: var(--text-secondary); font-size: 0.85rem;">Welcome back, <strong style="color: var(--color-primary);">${AppState.rewardsMember.name}</strong>!</p>
                    <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 4px;">Member since ${AppState.rewardsMember.joinDate}</p>
                </div>
            `;
        }
    },

    joinProgram() {
        const name = Utils.$('#rewards-name').value.trim();
        const email = Utils.$('#rewards-email').value.trim();

        if (!name) { Toast.error('Please enter your name'); return; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { Toast.error('Please enter a valid email'); return; }

        AppState.rewardsMember = {
            name,
            email,
            joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };

        // Award welcome bonus
        AppState.rewardsPoints += 50;

        Utils.saveToStorage('eb-member', AppState.rewardsMember);
        Utils.saveToStorage('eb-points', AppState.rewardsPoints);

        Toast.success(`Welcome to Ember Club, ${name}! You earned 50 bonus points! 🎉`);

        this.checkExistingMember();
        this.updateCard();
    },

    getCurrentTier() {
        const points = AppState.rewardsPoints;
        return this.tiers.find(t => points >= t.min && points <= t.max) || this.tiers[0];
    },

    getNextTier() {
        const current = this.getCurrentTier();
        const index = this.tiers.indexOf(current);
        return index < this.tiers.length - 1 ? this.tiers[index + 1] : null;
    },

    updateCard() {
        const tier = this.getCurrentTier();
        const nextTier = this.getNextTier();
        const points = AppState.rewardsPoints;

        Utils.$('#rc-tier').textContent = tier.name;
        Utils.$('#rc-tier').style.borderColor = tier.color;
        Utils.$('#rc-tier').style.color = tier.color;
        Utils.$('#rc-points').textContent = points;

        if (AppState.rewardsMember) {
            Utils.$('#rc-member').textContent = AppState.rewardsMember.name;
        }

        if (nextTier) {
            const progress = ((points - tier.min) / (nextTier.min - tier.min)) * 100;
            Utils.$('#rc-progress-bar').style.width = Math.min(progress, 100) + '%';
            Utils.$('#rc-next').textContent = `${nextTier.min - points} pts to ${nextTier.name}`;
        } else {
            Utils.$('#rc-progress-bar').style.width = '100%';
            Utils.$('#rc-progress-bar').style.background = 'linear-gradient(90deg, #ffd700, #ffaa00)';
            Utils.$('#rc-next').textContent = '🏆 Max tier reached!';
        }
    },

    addPoints(amount) {
        const tier = this.getCurrentTier();
        const earned = Math.floor(amount * 10 * tier.multiplier);
        AppState.rewardsPoints += earned;
        Utils.saveToStorage('eb-points', AppState.rewardsPoints);
        this.updateCard();
        return earned;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Rewards.init();
});
