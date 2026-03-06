/* =============================================
   MENU DATA — Complete Product Catalog
   ============================================= */

const MENU_DATA = [
    // ===== ESPRESSO DRINKS =====
    {
        id: 'esp-001', name: 'Classic Espresso', category: 'espresso',
        description: 'Double shot of our signature house blend, pulled to perfection with rich crema.',
        emoji: '☕', rating: 4.9, reviews: 234, popular: true,
        tags: ['Hot', 'Classic', 'Vegan'],
        sizes: { S: 2.95, M: 3.95, L: 4.95 },
        background: 'linear-gradient(135deg, #3c2415, #6b4226)'
    },
    {
        id: 'esp-002', name: 'Vanilla Oat Latte', category: 'espresso',
        description: 'Silky oat milk steamed with Madagascar vanilla and a double espresso shot.',
        emoji: '🥛', rating: 4.8, reviews: 312, popular: true,
        tags: ['Hot', 'Dairy-Free', 'Sweet'],
        sizes: { S: 4.50, M: 5.50, L: 6.50 },
        background: 'linear-gradient(135deg, #d4a574, #8b6f47)'
    },
    {
        id: 'esp-003', name: 'Caramel Macchiato', category: 'espresso',
        description: 'Layers of vanilla, steamed milk, espresso, and house-made caramel drizzle.',
        emoji: '🍯', rating: 4.7, reviews: 289,
        tags: ['Hot', 'Sweet', 'Signature'],
        sizes: { S: 4.75, M: 5.75, L: 6.75 },
        background: 'linear-gradient(135deg, #c8915a, #8b5e3c)'
    },
    {
        id: 'esp-004', name: 'Mocha Supreme', category: 'espresso',
        description: 'Belgian dark chocolate blended with espresso, topped with cocoa whipped cream.',
        emoji: '🍫', rating: 4.9, reviews: 278, popular: true,
        tags: ['Hot', 'Chocolate', 'Rich'],
        sizes: { S: 5.25, M: 6.25, L: 7.25 },
        background: 'linear-gradient(135deg, #4a2c17, #2c1810)'
    },
    {
        id: 'esp-005', name: 'Hazelnut Cappuccino', category: 'espresso',
        description: 'Thick micro-foam cap over a rich espresso with Piedmont hazelnut syrup.',
        emoji: '🌰', rating: 4.6, reviews: 198,
        tags: ['Hot', 'Nutty', 'Classic'],
        sizes: { S: 4.50, M: 5.50, L: 6.50 },
        background: 'linear-gradient(135deg, #8b6914, #5c4a28)'
    },
    {
        id: 'esp-006', name: 'Flat White', category: 'espresso',
        description: 'Velvety micro-foam over a ristretto double shot. Smooth and bold.',
        emoji: '☁️', rating: 4.8, reviews: 256,
        tags: ['Hot', 'Bold', 'Classic'],
        sizes: { S: 4.25, M: 5.25, L: 6.25 },
        background: 'linear-gradient(135deg, #f5f0eb, #c8b89a)'
    },
    {
        id: 'esp-007', name: 'Honey Cinnamon Latte', category: 'espresso',
        description: 'Wildflower honey and Ceylon cinnamon stirred into steamed milk and espresso.',
        emoji: '🍯', rating: 4.7, reviews: 167,
        tags: ['Hot', 'Sweet', 'Spiced'],
        sizes: { S: 5.00, M: 6.00, L: 7.00 },
        background: 'linear-gradient(135deg, #e8a946, #b8860b)'
    },
    {
        id: 'esp-008', name: 'Americano', category: 'espresso',
        description: 'Double espresso diluted with hot water for a clean, bold coffee experience.',
        emoji: '🏴', rating: 4.5, reviews: 189,
        tags: ['Hot', 'Bold', 'Vegan'],
        sizes: { S: 3.25, M: 4.25, L: 5.25 },
        background: 'linear-gradient(135deg, #1a1210, #3c2a1e)'
    },

    // ===== COLD BREW & ICED =====
    {
        id: 'cold-001', name: 'Signature Cold Brew', category: 'cold',
        description: '24-hour steeped single-origin cold brew. Smooth, low-acid, deeply satisfying.',
        emoji: '🧊', rating: 4.9, reviews: 345, popular: true,
        tags: ['Cold', 'Smooth', 'Vegan'],
        sizes: { S: 4.50, M: 5.50, L: 6.50 },
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)'
    },
    {
        id: 'cold-002', name: 'Iced Caramel Latte', category: 'cold',
        description: 'Chilled espresso layered over ice with milk and house-made salted caramel.',
        emoji: '🥤', rating: 4.7, reviews: 267,
        tags: ['Cold', 'Sweet', 'Popular'],
        sizes: { S: 5.25, M: 6.25, L: 7.25 },
        background: 'linear-gradient(135deg, #c8915a, #a06b35)'
    },
    {
        id: 'cold-003', name: 'Nitro Cold Brew', category: 'cold',
        description: 'Nitrogen-infused cold brew creating a creamy, Guinness-like cascade effect.',
        emoji: '🍺', rating: 4.8, reviews: 234, popular: true,
        tags: ['Cold', 'Creamy', 'Vegan'],
        sizes: { S: 5.50, M: 6.50, L: 7.50 },
        background: 'linear-gradient(135deg, #0f0f23, #1a1a3e)'
    },
    {
        id: 'cold-004', name: 'Vanilla Sweet Cream Cold Brew', category: 'cold',
        description: 'Slow-steeped cold brew topped with a float of vanilla sweet cream.',
        emoji: '🍦', rating: 4.8, reviews: 301,
        tags: ['Cold', 'Sweet', 'Creamy'],
        sizes: { S: 5.50, M: 6.50, L: 7.50 },
        background: 'linear-gradient(135deg, #f5e6d0, #c8a882)'
    },
    {
        id: 'cold-005', name: 'Iced Mocha Frappe', category: 'cold',
        description: 'Blended ice, espresso, chocolate, and whipped cream. An indulgent treat.',
        emoji: '🥤', rating: 4.6, reviews: 198,
        tags: ['Cold', 'Blended', 'Sweet'],
        sizes: { S: 5.75, M: 6.75, L: 7.75 },
        background: 'linear-gradient(135deg, #4a2c17, #8b5e3c)'
    },
    {
        id: 'cold-006', name: 'Cold Brew Tonic', category: 'cold',
        description: 'Sparkling tonic water meets cold brew concentrate with a citrus twist.',
        emoji: '🍋', rating: 4.5, reviews: 145,
        tags: ['Cold', 'Refreshing', 'Unique'],
        sizes: { S: 5.25, M: 6.25, L: 7.25 },
        background: 'linear-gradient(135deg, #667eea, #764ba2)'
    },

    // ===== TEAS =====
    {
        id: 'tea-001', name: 'Ceremonial Matcha Latte', category: 'tea',
        description: 'Ceremonial grade Uji matcha whisked with oat milk and a touch of honey.',
        emoji: '🍵', rating: 4.8, reviews: 267, popular: true,
        tags: ['Hot', 'Japanese', 'Antioxidant'],
        sizes: { S: 5.00, M: 6.00, L: 7.00 },
        background: 'linear-gradient(135deg, #56ab2f, #a8e063)'
    },
    {
        id: 'tea-002', name: 'London Fog', category: 'tea',
        description: 'Earl Grey tea steamed with vanilla and lavender-infused milk foam.',
        emoji: '🫖', rating: 4.7, reviews: 189,
        tags: ['Hot', 'Floral', 'Classic'],
        sizes: { S: 4.50, M: 5.50, L: 6.50 },
        background: 'linear-gradient(135deg, #667eea, #9b88cc)'
    },
    {
        id: 'tea-003', name: 'Chai Spice Latte', category: 'tea',
        description: 'House-blended masala chai with cardamom, ginger, clove, and steamed milk.',
        emoji: '🫚', rating: 4.9, reviews: 312,
        tags: ['Hot', 'Spiced', 'Warming'],
        sizes: { S: 4.75, M: 5.75, L: 6.75 },
        background: 'linear-gradient(135deg, #ff6b35, #f7931e)'
    },
    {
        id: 'tea-004', name: 'Jasmine Pearl Green Tea', category: 'tea',
        description: 'Hand-rolled jasmine pearl green tea that unfurls as it steeps. Delicate and fragrant.',
        emoji: '🌸', rating: 4.6, reviews: 134,
        tags: ['Hot', 'Floral', 'Light'],
        sizes: { S: 3.75, M: 4.75, L: 5.75 },
        background: 'linear-gradient(135deg, #e74c8b, #f8a4c8)'
    },
    {
        id: 'tea-005', name: 'Iced Thai Tea', category: 'tea',
        description: 'Strong black tea with star anise, sweetened condensed milk, over crushed ice.',
        emoji: '🧡', rating: 4.7, reviews: 223,
        tags: ['Cold', 'Sweet', 'Creamy'],
        sizes: { S: 4.75, M: 5.75, L: 6.75 },
        background: 'linear-gradient(135deg, #ff8c00, #ff6347)'
    },

    // ===== PASTRIES =====
    {
        id: 'pas-001', name: 'Butter Croissant', category: 'pastry',
        description: 'Flaky, golden-brown layers of French butter pastry. Baked fresh every morning.',
        emoji: '🥐', rating: 4.9, reviews: 389, popular: true,
        tags: ['Fresh', 'Classic', 'Buttery'],
        sizes: { Regular: 3.95 },
        background: 'linear-gradient(135deg, #deb887, #c8915a)'
    },
    {
        id: 'pas-002', name: 'Pain au Chocolat', category: 'pastry',
        description: 'Delicate croissant dough wrapped around two bars of premium dark chocolate.',
        emoji: '🍫', rating: 4.8, reviews: 256,
        tags: ['Fresh', 'Chocolate', 'Indulgent'],
        sizes: { Regular: 4.50 },
        background: 'linear-gradient(135deg, #3c1f0c, #6b4226)'
    },
    {
        id: 'pas-003', name: 'Blueberry Muffin', category: 'pastry',
        description: 'Moist vanilla muffin studded with wild blueberries and a crumble streusel top.',
        emoji: '🫐', rating: 4.6, reviews: 198,
        tags: ['Fresh', 'Fruity', 'Classic'],
        sizes: { Regular: 3.75 },
        background: 'linear-gradient(135deg, #4b0082, #6a5acd)'
    },
    {
        id: 'pas-004', name: 'Almond Biscotti', category: 'pastry',
        description: 'Twice-baked Italian cookie with toasted Marcona almonds. Perfect for dipping.',
        emoji: '🍪', rating: 4.5, reviews: 145,
        tags: ['Crunchy', 'Nutty', 'Italian'],
        sizes: { Regular: 2.95 },
        background: 'linear-gradient(135deg, #d2b48c, #a0785a)'
    },
    {
        id: 'pas-005', name: 'Cinnamon Roll', category: 'pastry',
        description: 'Soft, pillowy roll swirled with cinnamon-brown sugar and cream cheese glaze.',
        emoji: '🧁', rating: 4.9, reviews: 334, popular: true,
        tags: ['Fresh', 'Sweet', 'Signature'],
        sizes: { Regular: 4.95 },
        background: 'linear-gradient(135deg, #d2691e, #8b4513)'
    },
    {
        id: 'pas-006', name: 'Avocado Toast', category: 'pastry',
        description: 'Sourdough toast with smashed avocado, chili flakes, radish, and hemp seeds.',
        emoji: '🥑', rating: 4.7, reviews: 267,
        tags: ['Savory', 'Healthy', 'Vegan'],
        sizes: { Regular: 8.50 },
        background: 'linear-gradient(135deg, #56ab2f, #2e7d32)'
    },
    {
        id: 'pas-007', name: 'Banana Bread', category: 'pastry',
        description: 'Dense, moist banana bread with walnuts and a drizzle of salted caramel.',
        emoji: '🍌', rating: 4.7, reviews: 201,
        tags: ['Fresh', 'Nutty', 'Moist'],
        sizes: { Regular: 4.25 },
        background: 'linear-gradient(135deg, #daa520, #cd853f)'
    },

    // ===== SEASONAL =====
    {
        id: 'sea-001', name: 'Pumpkin Spice Latte', category: 'seasonal',
        description: 'Real pumpkin purée, warm spices, espresso, and steamed milk with whip.',
        emoji: '🎃', rating: 4.8, reviews: 456, popular: true,
        tags: ['Hot', 'Seasonal', 'Fall'],
        sizes: { S: 5.50, M: 6.50, L: 7.50 },
        background: 'linear-gradient(135deg, #ff6b35, #c04000)'
    },
    {
        id: 'sea-002', name: 'Peppermint Mocha', category: 'seasonal',
        description: 'Rich mocha with peppermint syrup, topped with whipped cream and candy cane dust.',
        emoji: '🍬', rating: 4.7, reviews: 289,
        tags: ['Hot', 'Seasonal', 'Winter'],
        sizes: { S: 5.75, M: 6.75, L: 7.75 },
        background: 'linear-gradient(135deg, #c0392b, #27ae60)'
    },
    {
        id: 'sea-003', name: 'Gingerbread Latte', category: 'seasonal',
        description: 'Warming gingerbread spices with espresso and steamed milk. Holiday in a cup.',
        emoji: '🍪', rating: 4.6, reviews: 178,
        tags: ['Hot', 'Seasonal', 'Spiced'],
        sizes: { S: 5.50, M: 6.50, L: 7.50 },
        background: 'linear-gradient(135deg, #8b4513, #d2691e)'
    },
    {
        id: 'sea-004', name: 'Iced Cherry Blossom Latte', category: 'seasonal',
        description: 'Sakura-inspired latte with cherry blossom syrup and oat milk over ice.',
        emoji: '🌸', rating: 4.9, reviews: 198,
        tags: ['Cold', 'Seasonal', 'Spring'],
        sizes: { S: 5.75, M: 6.75, L: 7.75 },
        background: 'linear-gradient(135deg, #ffb7c5, #e74c8b)'
    },
];

// Freeze to prevent mutations
Object.freeze(MENU_DATA);
MENU_DATA.forEach(item => Object.freeze(item));
