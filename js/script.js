const customOptions = {
    soups: [
        { id: 'Kencur', name: 'Original Kencur', price:3000 },
        { id: 'Pedas', name: 'Kuah pedas', price: 3000 },
        { id: 'Original', name: ' Original', price: 3000},
    ],

    
    toppings: [
        { id: 't1', name: 'Sosis Merah', price: 2000 },
        { id: 't2', name: 'Fish Roll', price: 2000 },
        { id: 't3', name: 'Dumpling Ayam', price: 2500 },
        { id: 't4', name: 'Dumpling Cheese', price: 2500 },
        { id: 't5', name: 'Chikuwa', price: 2500 },
        { id: 't6', name: 'Sosis Sapi', price: 3000 },
        { id: 't7', name: 'Telur Ayam', price: 4000 },
        { id: 't8', name: 'Bakso Sapi', price: 3000 },
        { id: 't9', name: 'Jamur Enoki', price: 4000 },
        { id: 't10', name: 'Tetelan Ayam', price: 5000 },
        { id: 't11', name: 'ceker', price: 2000 }
    ]
};


let cart = [];
let customState = {
    soup: 'Original',
    spicy: 1,
    toppings: []
};
let lastCreatedOrderId = '';
let currentCategory = 'all';
let detailState = { id: null, spicy: 1, qty: 1 };

window.addEventListener('DOMContentLoaded', () => {
    loadMenuFromStorage();
    loadStockFromStorage();
    loadCartFromStorage();
    renderHomeBestsellers();
    renderMenuGrid('all');
    renderCustomOptions();
    updateCustomSummary();
    toggleDeliveryAddress();
});


window.addEventListener('storage', e => {
    if (e.key === 'seblak_menu' || e.key === 'seblak_stock') {
        loadMenuFromStorage();
        loadStockFromStorage();
        loadCartFromStorage();
        refreshAll();
    }
    if (e.key === 'seblak_orders') {
        const container = document.getElementById('tracking-result-container');
        const shownId = document.getElementById('res-order-id').innerText.trim();
        if (!container.classList.contains('hidden') && shownId) {
            document.getElementById('track-order-id').value = shownId;
            trackOrder();
        }
    }
});


function toggleDeliveryAddress() {
    const isDelivery = document.getElementById('cust-type').value === 'Delivery';
    document.getElementById('delivery-address-wrap').classList.toggle('hidden', !isDelivery);
    if (isDelivery) document.getElementById('cust-address').focus();
}


function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-skybrand-50', 'text-skybrand-600');
        btn.classList.add('text-slate-600');
    });

    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-skybrand-50', 'text-skybrand-600');
        activeBtn.classList.remove('text-slate-600');
    }


    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}


function stockText(item) {
    const color = item.stock === 0 ? 'text-spicy-600' : item.stock <= 5 ? 'text-amber-600' : 'text-green-600';
    return `<p class="text-xs mt-2 font-semibold ${color}">
        <i class="fa-solid fa-box"></i> ${item.stock === 0 ? 'Stok habis' : 'Sisa stok: ' + item.stock}
    </p>`;
}

function renderHomeBestsellers() {
    const container = document.getElementById('home-bestsellers');
    const bestSellers = menuItems.filter(item => item.isBestSeller);

    container.innerHTML = bestSellers.map(item => `
        <div onclick="openMenuDetail('${item.id}')" class="menu-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
                <div class="relative mb-3">
                    <img src="${item.image}" alt="${escapeHtml(item.name)}" class="w-full aspect-square object-cover rounded-xl">
                    <span class="absolute top-2 right-2 bg-spicy-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase">
                        <i class="fa-solid fa-fire"></i> Best Seller
                    </span>
                </div>
                <h3 class="font-bold text-slate-800 text-base">${escapeHtml(item.name)}</h3>
                <p class="text-xs text-slate-500 mt-1 line-clamp-2">${escapeHtml(item.desc)}</p>
                ${stockText(item)}
                <p class="menu-card-hint text-[11px] text-slate-400 mt-1 transition-colors"><i class="fa-solid fa-circle-info"></i> Klik untuk lihat detail</p>
            </div>
            <div class="mt-4 flex items-center justify-between pt-3 border-t border-slate-50">
                <span class="font-extrabold text-skybrand-600 text-base">${formatRupiah(item.price)}</span>
                <button onclick="event.stopPropagation(); addToCart('${item.id}')" ${item.stock === 0 ? 'disabled' : ''} class="px-3.5 py-2 rounded-xl bg-skybrand-100 text-skybrand-600 hover:bg-skybrand-500 hover:text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-bold text-xs transition-all flex items-center gap-1">
                    <i class="fa-solid fa-plus"></i> ${item.stock === 0 ? 'Habis' : 'Keranjang'}
                </button>
            </div>
        </div>
    `).join('');
}

function filterCategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('bg-skybrand-500', 'text-white', 'shadow-md');
        btn.classList.add('bg-white', 'text-slate-600');
    });

    const activeBtn = document.getElementById(`filter-${category}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-skybrand-500', 'text-white', 'shadow-md');
        activeBtn.classList.remove('bg-white', 'text-slate-600');
    }

    renderMenuGrid(category);
}

function renderMenuGrid(category) {
    currentCategory = category;
    const container = document.getElementById('menu-grid');
    const filtered = category === 'all' ? menuItems : menuItems.filter(i => i.category === category);

    if (filtered.length === 0) {
        container.innerHTML = `<p class="col-span-full text-center text-sm text-slate-400 py-12">Belum ada menu di kategori ini.</p>`;
        return;
    }

    container.innerHTML = filtered.map(item => `
        <div onclick="openMenuDetail('${item.id}')" class="menu-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
                <div class="relative mb-3">
                    <img src="${item.image}" alt="${escapeHtml(item.name)}" class="w-full aspect-square object-cover rounded-xl ${item.stock === 0 ? 'grayscale opacity-60' : ''}">
                    ${item.spicyLevel > 0 ? `
                        <span class="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-1 rounded-lg">
                            🌶️ Level ${item.spicyLevel}
                        </span>
                    ` : ''}
                </div>
                <h3 class="font-bold text-slate-800 text-lg">${escapeHtml(item.name)}</h3>
                <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">${escapeHtml(item.desc)}</p>
                ${stockText(item)}
                <p class="menu-card-hint text-[11px] text-slate-400 mt-1 transition-colors"><i class="fa-solid fa-circle-info"></i> Klik untuk lihat detail</p>
            </div>
            <div class="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                    <span class="text-[10px] text-slate-400 block font-medium">Harga</span>
                    <span class="font-extrabold text-skybrand-600 text-lg">${formatRupiah(item.price)}</span>
                </div>
                <button onclick="event.stopPropagation(); addToCart('${item.id}')" ${item.stock === 0 ? 'disabled' : ''} class="px-4 py-2.5 rounded-xl bg-skybrand-500 hover:bg-skybrand-600 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none text-white font-bold text-xs transition-all shadow-md shadow-skybrand-200 flex items-center gap-1.5">
                    <i class="fa-solid fa-cart-plus"></i> ${item.stock === 0 ? 'Habis' : '+ Keranjang'}
                </button>
            </div>
        </div>
    `).join('');
}

// --- DETAIL MENU (modal saat kartu menu diklik) ---
function openMenuDetail(menuId) {
    const item = menuItems.find(m => m.id === menuId);
    if (!item) return;
    detailState = { id: menuId, spicy: 1, qty: 1 };
    renderMenuDetail();
    document.getElementById('menu-detail-modal').classList.remove('hidden');
}

function closeMenuDetail() {
    document.getElementById('menu-detail-modal').classList.add('hidden');
}

function renderMenuDetail() {
    const item = menuItems.find(m => m.id === detailState.id);
    if (!item) return;
    const cat = categoryInfo[item.category] || { label: item.category, icon: 'fa-tag', color: 'text-slate-500' };
    const maxQty = Math.max(0, item.stock - qtyInCart(item.id));
    if (detailState.qty > maxQty) detailState.qty = Math.max(1, maxQty);

    const ingredients = (item.ingredients || []).map(i => `<span class="chip">${escapeHtml(i)}</span>`).join('');
    const spicyButtons = item.allowSpicy ? `
        <div>
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Level Pedas</h4>
            <div class="grid grid-cols-6 gap-1.5">
                ${spicyLabels.map((_, i) => `
                    <button onclick="setDetailSpicy(${i})" class="spicy-pick ${detailState.spicy === i ? 'active' : ''}">${i}</button>
                `).join('')}
            </div>
            <p class="text-xs text-spicy-600 font-semibold mt-2">🌶️ Level ${detailState.spicy} — ${spicyLabels[detailState.spicy]}</p>
        </div>` : '';

    const total = item.price * detailState.qty;

    document.getElementById('menu-detail-content').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2">
            <div class="p-4 md:p-5">
                <img src="${item.image}" alt="${escapeHtml(item.name)}" class="w-full aspect-square object-cover rounded-2xl ${item.stock === 0 ? 'grayscale opacity-60' : ''}">
            </div>
            <div class="p-5 md:pl-1 md:pr-6 md:py-6 space-y-4">
                <div>
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        <i class="fa-solid ${cat.icon} ${cat.color}"></i> ${cat.label}
                    </span>
                    ${item.isBestSeller ? '<span class="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-spicy-500/10 text-xs font-bold text-spicy-600"><i class="fa-solid fa-fire"></i> Best Seller</span>' : ''}
                    <h3 class="text-2xl font-extrabold font-heading text-slate-900 mt-2">${escapeHtml(item.name)}</h3>
                    <p class="text-2xl font-extrabold text-skybrand-600 mt-1">${formatRupiah(item.price)}</p>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deskripsi</h4>
                    <p class="text-sm text-slate-600 leading-relaxed">${escapeHtml(item.desc)}</p>
                </div>

                ${ingredients ? `
                <div>
                    <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Komposisi</h4>
                    <div class="flex flex-wrap gap-1.5">${ingredients}</div>
                </div>` : ''}

                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <i class="fa-solid fa-bowl-food text-skybrand-500 text-sm"></i>
                        <p class="text-[10px] text-slate-400 mt-1">Porsi</p>
                        <p class="text-[11px] font-bold text-slate-700 leading-tight">${escapeHtml(item.portion || '-')}</p>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <i class="fa-solid fa-clock text-skybrand-500 text-sm"></i>
                        <p class="text-[10px] text-slate-400 mt-1">Penyajian</p>
                        <p class="text-[11px] font-bold text-slate-700 leading-tight">${escapeHtml(item.prepTime || '-')}</p>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <i class="fa-solid fa-box text-skybrand-500 text-sm"></i>
                        <p class="text-[10px] text-slate-400 mt-1">Stok</p>
                        <p class="text-[11px] font-bold ${item.stock === 0 ? 'text-spicy-600' : item.stock <= 5 ? 'text-amber-600' : 'text-green-600'}">${item.stock === 0 ? 'Habis' : item.stock + ' tersisa'}</p>
                    </div>
                </div>

                ${spicyButtons}

                <div class="pt-3 border-t border-slate-100 space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah</span>
                        <div class="flex items-center gap-2">
                            <button onclick="changeDetailQty(-1)" class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold">-</button>
                            <span class="w-6 text-center font-bold text-slate-800">${detailState.qty}</span>
                            <button onclick="changeDetailQty(1)" class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold">+</button>
                        </div>
                    </div>
                    <button onclick="addDetailToCart()" ${maxQty === 0 ? 'disabled' : ''} class="w-full py-3.5 rounded-xl bg-gradient-to-r from-spicy-600 to-chili disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-spicy-500/20 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-cart-plus"></i>
                        ${maxQty === 0 ? (item.stock === 0 ? 'Stok Habis' : 'Sudah maksimal di keranjang') : `Tambah ke Keranjang • ${formatRupiah(total)}`}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function setDetailSpicy(level) {
    detailState.spicy = level;
    renderMenuDetail();
}

function changeDetailQty(change) {
    const item = menuItems.find(m => m.id === detailState.id);
    if (!item) return;
    const maxQty = Math.max(1, item.stock - qtyInCart(item.id));
    detailState.qty = Math.min(maxQty, Math.max(1, detailState.qty + change));
    renderMenuDetail();
}

function addDetailToCart() {
    const item = menuItems.find(m => m.id === detailState.id);
    if (!item) return;
    const added = addToCart(item.id, { spicy: item.allowSpicy ? detailState.spicy : null, qty: detailState.qty });
    if (added) closeMenuDetail();
}

// --- CUSTOM PRASMANAN GENERATOR ---
function renderCustomOptions() {
    // Soups
    const soupContainer = document.getElementById('soup-options');
    soupContainer.innerHTML = customOptions.soups.map(s => `
        <button onclick="selectSoup('${s.id}')" id="soup-btn-${s.id}" class="soup-btn p-3 rounded-xl border text-center transition-all text-xs font-semibold ${customState.soup === s.id ? 'border-skybrand-500 bg-skybrand-50 text-skybrand-600 font-bold' : 'border-slate-200 text-slate-600'}">
            ${s.name}
        </button>
    `).join('');

    // Spicy levels (0 to 5)
    const spicyContainer = document.getElementById('spicy-options');
    let spicyHTML = '';
    for (let i = 0; i <= 5; i++) {
        spicyHTML += `
            <button onclick="selectSpicy(${i})" id="spicy-btn-${i}" class="spicy-btn py-2.5 rounded-xl border text-center transition-all text-xs font-bold ${customState.spicy === i ? 'border-spicy-500 bg-spicy-50 text-spicy-600' : 'border-slate-200 text-slate-600'}">
                Lvl ${i}
            </button>
        `;
    }
    spicyContainer.innerHTML = spicyHTML;

    // Toppings
    const toppingContainer = document.getElementById('topping-options');
    toppingContainer.innerHTML = customOptions.toppings.map(t => {
        const isSelected = customState.toppings.some(item => item.id === t.id);
        return `
            <div onclick="toggleTopping('${t.id}')" class="p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'border-skybrand-500 bg-skybrand-50' : 'border-slate-200 bg-white hover:border-slate-300'}">
                <div class="flex items-center gap-2.5">
                    <div class="w-5 h-5 rounded-md border flex items-center justify-center text-xs ${isSelected ? 'bg-skybrand-500 border-skybrand-500 text-white' : 'border-slate-300'}">
                        ${isSelected ? '<i class="fa-solid fa-check"></i>' : ''}
                    </div>
                    <span class="text-xs font-semibold text-slate-700">${t.name}</span>
                </div>
                <span class="text-xs font-bold text-skybrand-600">+${formatRupiah(t.price)}</span>
            </div>
        `;
    }).join('');
}

function selectSoup(soupId) {
    customState.soup = soupId;
    renderCustomOptions();
    updateCustomSummary();
}

function selectSpicy(level) {
    customState.spicy = level;
    renderCustomOptions();
    updateCustomSummary();
}

function toggleTopping(toppingId) {
    const index = customState.toppings.findIndex(t => t.id === toppingId);
    if (index > -1) {
        customState.toppings.splice(index, 1);
    } else {
        const item = customOptions.toppings.find(t => t.id === toppingId);
        customState.toppings.push(item);
    }
    renderCustomOptions();
    updateCustomSummary();
}

function calculateCustomPrice() {
    const basePrice = 0; // Base harga wadah/bumbu seblak
    const toppingsPrice = customState.toppings.reduce((acc, curr) => acc + curr.price, 0);
    return basePrice + toppingsPrice;
}

function updateCustomSummary() {
    document.getElementById('summary-soup').innerText = customState.soup;
    document.getElementById('summary-spicy').innerText = `Level ${customState.spicy}`;

    const toppingsDiv = document.getElementById('summary-toppings');
    if (customState.toppings.length === 0) {
        toppingsDiv.innerHTML = `<span class="text-xs text-slate-400 italic">Belum ada topping dipilih</span>`;
    } else {
        toppingsDiv.innerHTML = customState.toppings.map(t => `
            <span class="px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700">${t.name}</span>
        `).join('');
    }

    const totalPrice = calculateCustomPrice();
    document.getElementById('custom-total-price').innerText = formatRupiah(totalPrice);
}

function addCustomToCart() {
    if (customState.toppings.length === 0) {
        alert('Pilih minimal 1 topping untuk membuat Seblak Prasmanan!');
        return;
    }

    const toppingsListStr = customState.toppings.map(t => t.name).join(', ');
    const customItem = {
        id: 'custom-' + Date.now(),
        name: `Seblak Custom (Kuah ${customState.soup}, Pedas Lvl ${customState.spicy})`,
        desc: `Topping: ${toppingsListStr}`,
        price: calculateCustomPrice(),
        qty: 1
    };

    cart.push(customItem);
    saveCartToStorage();
    updateCartUI();
    toggleCartModal(true);
}

// --- CART MANAGEMENT ---
// Total qty satu menu di keranjang (semua varian level pedas dihitung)
function qtyInCart(menuId, excludeCartId = null) {
    return cart
        .filter(c => (c.menuId || c.id) === menuId && c.id !== excludeCartId)
        .reduce((acc, c) => acc + c.qty, 0);
}

function addToCart(menuId, opts = {}) {
    const item = menuItems.find(m => m.id === menuId);
    if (!item) return false;

    const qty = opts.qty || 1;
    const spicy = item.allowSpicy ? (opts.spicy ?? 1) : null;

    if (qtyInCart(menuId) + qty > item.stock) {
        alert(`Stok ${item.name} tidak cukup! Sisa stok: ${item.stock}`);
        return false;
    }

    const cartId = spicy === null ? menuId : `${menuId}__L${spicy}`;
    const existing = cart.find(c => c.id === cartId);

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({
            id: cartId,
            menuId: menuId,
            name: spicy === null ? item.name : `${item.name} (Pedas Lvl ${spicy})`,
            desc: item.desc,
            price: item.price,
            qty: qty
        });
    }

    saveCartToStorage();
    updateCartUI();
    toggleCartModal(true);
    return true;
}

function updateQty(itemId, change) {
    const index = cart.findIndex(c => c.id === itemId);
    if (index > -1) {
        if (change > 0) {
            const menuId = cart[index].menuId || cart[index].id;
            const menu = menuItems.find(m => m.id === menuId);
            if (menu && qtyInCart(menuId) >= menu.stock) {
                alert(`Stok ${menu.name} hanya tersisa ${menu.stock}!`);
                return;
            }
        }
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
    }
    saveCartToStorage();
    updateCartUI();
}

function removeFromCart(itemId) {
    cart = cart.filter(c => c.id !== itemId);
    saveCartToStorage();
    updateCartUI();
}

function calculateCartTotal() {
    return cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const totalCount = cart.reduce((acc, c) => acc + c.qty, 0);

    if (totalCount > 0) {
        badge.innerText = totalCount;
        badge.classList.remove('hidden');
        badge.classList.add('flex');
    } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
    }

    // Render Items inside Modal
    const itemsContainer = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('cart-empty-state');
    const btnCheckout = document.getElementById('btn-to-checkout');

    if (cart.length === 0) {
        itemsContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        btnCheckout.disabled = true;
    } else {
        emptyState.classList.add('hidden');
        btnCheckout.disabled = false;
        itemsContainer.innerHTML = cart.map(item => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div class="flex-1 pr-3">
                    <h4 class="font-bold text-slate-800 text-sm leading-snug">${escapeHtml(item.name)}</h4>
                    <span class="text-xs font-bold text-skybrand-600 block mt-0.5">${formatRupiah(item.price)}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="updateQty('${item.id}', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs font-bold">-</button>
                    <span class="text-xs font-bold text-slate-800 w-4 text-center">${item.qty}</span>
                    <button onclick="updateQty('${item.id}', 1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs font-bold">+</button>
                    <button onclick="removeFromCart('${item.id}')" class="p-1.5 text-slate-400 hover:text-spicy-600 text-xs ml-1">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('cart-total-price').innerText = formatRupiah(calculateCartTotal());
}

function toggleCartModal(show) {
    const modal = document.getElementById('cart-modal');
    if (show) {
        showCartStep('items');
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function showCartStep(step) {
    const stepItems = document.getElementById('cart-step-items');
    const stepCheckout = document.getElementById('cart-step-checkout');
    const btnItems = document.getElementById('cart-footer-items-btn');
    const btnCheckout = document.getElementById('cart-footer-checkout-btn');

    if (step === 'items') {
        stepItems.classList.remove('hidden');
        stepCheckout.classList.add('hidden');
        btnItems.classList.remove('hidden');
        btnCheckout.classList.add('hidden');
    } else {
        stepItems.classList.add('hidden');
        stepCheckout.classList.remove('hidden');
        btnItems.classList.add('hidden');
        btnCheckout.classList.remove('hidden');
    }
}

// --- CHECKOUT & RECEIPT LOGIC ---
function processCheckout() {
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const type = document.getElementById('cust-type').value;
    const payment = document.getElementById('cust-payment').value;
    const address = document.getElementById('cust-address').value.trim();
    const landmark = document.getElementById('cust-landmark').value.trim();

    if (!name || !phone) {
        alert('Harap isi Nama dan Nomor WhatsApp Anda!');
        return;
    }

    if (type === 'Delivery' && !address) {
        alert('Pesanan Delivery wajib mengisi alamat pengantaran!');
        document.getElementById('cust-address').focus();
        return;
    }

    // Validasi stok per menu (varian level pedas digabung)
    const qtyPerMenu = {};
    cart.forEach(c => {
        const mid = c.menuId || c.id;
        qtyPerMenu[mid] = (qtyPerMenu[mid] || 0) + c.qty;
    });
    for (const mid in qtyPerMenu) {
        const m = menuItems.find(x => x.id === mid);
        if (m && qtyPerMenu[mid] > m.stock) {
            alert(`Stok ${m.name} tinggal ${m.stock}. Kurangi jumlah pesanan Anda.`);
            return;
        }
    }

    const orderId = 'SBK-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    const orderObject = {
        id: orderId,
        name: name,
        phone: phone,
        type: type,
        payment: payment,
        notes: document.getElementById('cust-notes').value.trim(),
        address: type === 'Delivery' ? address : '',
        landmark: type === 'Delivery' ? landmark : '',
        time: now,
        items: [...cart],
        total: calculateCartTotal(),
        statusStep: 1 // 1: Diterima, 2: Diproses, 3: Siap
    };

    
    saveOrderToStorage(orderObject);
    lastCreatedOrderId = orderId;

    
    renderReceipt(orderObject);

    
    for (const mid in qtyPerMenu) {
        const m = menuItems.find(x => x.id === mid);
        if (m) m.stock = Math.max(0, m.stock - qtyPerMenu[mid]);
    }
    saveStockToStorage();
    refreshAll();

    
    cart = [];
    saveCartToStorage();
    updateCartUI();

    
    ['cust-name', 'cust-phone', 'cust-notes', 'cust-address', 'cust-landmark'].forEach(id => document.getElementById(id).value = '');

    toggleCartModal(false);
    document.getElementById('receipt-modal').classList.remove('hidden');
}

function renderReceipt(order) {
    document.getElementById('rec-id').innerText = order.id;
    document.getElementById('rec-name').innerText = order.name;
    document.getElementById('rec-type-pay').innerText = `${order.type} / ${order.payment}`;
    document.getElementById('rec-time').innerText = order.time;

    const recAddrRow = document.getElementById('rec-address-row');
    if (order.type === 'Delivery' && order.address) {
        document.getElementById('rec-address').innerText = order.address + (order.landmark ? ` (Patokan: ${order.landmark})` : '');
        recAddrRow.classList.remove('hidden');
    } else {
        recAddrRow.classList.add('hidden');
    }

    const itemsContainer = document.getElementById('rec-items-list');
    itemsContainer.innerHTML = order.items.map(i => `
        <div class="flex justify-between">
            <span>${i.qty}x ${escapeHtml(i.name)}</span>
            <span>${formatRupiah(i.price * i.qty)}</span>
        </div>
    `).join('');

    document.getElementById('rec-total').innerText = formatRupiah(order.total);
}

function closeReceiptModal() {
    document.getElementById('receipt-modal').classList.add('hidden');
}

function copyOrderIdAndTrack() {
    closeReceiptModal();
    switchTab('status');
    document.getElementById('track-order-id').value = lastCreatedOrderId;
    trackOrder();
}


function trackOrder() {
    const inputId = document.getElementById('track-order-id').value.trim().toUpperCase();
    const resultContainer = document.getElementById('tracking-result-container');
    const emptyState = document.getElementById('tracking-empty');

    if (!inputId) {
        alert('Masukkan ID Pesanan!');
        return;
    }

    const orders = getOrdersFromStorage();
    const order = orders.find(o => o.id === inputId);

    if (!order) {
        alert('ID Pesanan tidak ditemukan!');
        resultContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    let currentStep = order.statusStep || 1;

    resultContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    document.getElementById('res-order-id').innerText = order.id;
    document.getElementById('res-order-time').innerText = order.time;

    const addrBox = document.getElementById('res-address-box');
    if (order.type === 'Delivery' && order.address) {
        document.getElementById('res-address').innerText = order.address + (order.landmark ? ` (Patokan: ${order.landmark})` : '');
        addrBox.classList.remove('hidden');
    } else {
        addrBox.classList.add('hidden');
    }

  
    const itemsContainer = document.getElementById('res-items-list');
    itemsContainer.innerHTML = order.items.map(i => `
        <li class="flex justify-between py-1">
            <span>${i.qty}x ${escapeHtml(i.name)}</span>
            <span class="font-semibold text-slate-700">${formatRupiah(i.price * i.qty)}</span>
        </li>
    `).join('');

    document.getElementById('res-total-price').innerText = formatRupiah(order.total);

   
    const progressBar = document.getElementById('timeline-progress-bar');
    const s1 = document.getElementById('step-1-icon');
    const s2 = document.getElementById('step-2-icon');
    const s3 = document.getElementById('step-3-icon');

   
    [s1, s2, s3].forEach(el => {
        el.className = "w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm mb-2 transition-all";
    });

    if (currentStep === 1) {
        progressBar.style.width = '0%';
        s1.className = "w-10 h-10 rounded-full bg-skybrand-500 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-md shadow-skybrand-200 animate-bounce";
    } else if (currentStep === 2) {
        progressBar.style.width = '50%';
        s1.className = "w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm mb-2";
        s2.className = "w-10 h-10 rounded-full bg-spicy-500 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-md shadow-spicy-200 animate-bounce";
    } else {
        progressBar.style.width = '100%';
        s1.className = "w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm mb-2";
        s2.className = "w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm mb-2";
        s3.className = "w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-md shadow-green-200";
    }
}


function saveCartToStorage() {
    localStorage.setItem('seblak_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const data = localStorage.getItem('seblak_cart');
    if (data) {
        try {
            cart = JSON.parse(data);
        } catch (e) {
            cart = [];
        }
    } else {
        cart = [];
    }
    updateCartUI();
}


function refreshAll() {
    renderMenuGrid(currentCategory);
    renderHomeBestsellers();
    if (!document.getElementById('menu-detail-modal').classList.contains('hidden')) renderMenuDetail();
}
