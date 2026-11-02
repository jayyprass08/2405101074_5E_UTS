const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

let menuFormImage = '';
let currentAdminTab = 'orders';

window.addEventListener('DOMContentLoaded', () => {
    loadMenuFromStorage();
    loadStockFromStorage();
    if (isAdmin()) showAdminApp();
    else showLogin();
});


window.addEventListener('storage', e => {
    if (!isAdmin()) return;
    if (['seblak_orders', 'seblak_menu', 'seblak_stock'].includes(e.key)) {
        loadMenuFromStorage();
        loadStockFromStorage();
        renderAdminPanel();
    }
});


function isAdmin() {
    return sessionStorage.getItem('seblak_admin') === '1';
}

function showLogin() {
    document.getElementById('admin-app').classList.add('hidden');
    document.getElementById('admin-login-screen').classList.remove('hidden');
    document.getElementById('admin-login-error').classList.add('hidden');
    document.getElementById('admin-username').value = '';
    document.getElementById('admin-password').value = '';
    setTimeout(() => document.getElementById('admin-username').focus(), 50);
}

function showAdminApp() {
    document.getElementById('admin-login-screen').classList.add('hidden');
    document.getElementById('admin-app').classList.remove('hidden');
    renderAdminPanel();
}

function submitAdminLogin() {
    const u = document.getElementById('admin-username').value.trim();
    const p = document.getElementById('admin-password').value;

    if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('seblak_admin', '1');
        showAdminApp();
    } else {
        document.getElementById('admin-login-error').classList.remove('hidden');
    }
}

function adminLogout() {
    sessionStorage.removeItem('seblak_admin');
    showLogin();
}

// --- DASHBOARD ---
function renderAdminPanel() {
    renderAdminSummary();
    renderTransactionTable();
    renderAdminMenuTable();
    renderStockTable();
    switchAdminTab(currentAdminTab);
}

function switchAdminTab(tab) {
    currentAdminTab = tab;
    ['orders', 'menu', 'stock'].forEach(t => {
        document.getElementById(`admin-sub-${t}`).classList.toggle('hidden', t !== tab);
        document.getElementById(`admin-sub-btn-${t}`).classList.toggle('active', t === tab);
    });
}

function refreshAll() {
    renderAdminMenuTable();
    renderStockTable();
}


function syncStoredCartWithMenu() {
    try {
        const stored = JSON.parse(localStorage.getItem('seblak_cart')) || [];
        const synced = stored
            .filter(c => String(c.id).startsWith('custom-') || menuItems.some(m => m.id === (c.menuId || c.id)))
            .map(c => {
                const m = menuItems.find(x => x.id === (c.menuId || c.id));
                return m ? { ...c, price: m.price } : c;
            });
        localStorage.setItem('seblak_cart', JSON.stringify(synced));
    } catch (e) {}
}

function renderAdminSummary() {
    const orders = getOrdersFromStorage();
    const count = step => orders.filter(o => (o.statusStep || 1) === step).length;
    const totalValue = orders.reduce((acc, o) => acc + o.total, 0);

    const cards = [
        { label: 'Total Transaksi', value: orders.length, icon: 'fa-receipt', color: 'text-skybrand-600 bg-skybrand-100' },
        { label: 'Total Nilai', value: formatRupiah(totalValue), icon: 'fa-wallet', color: 'text-emerald-600 bg-emerald-100' },
        { label: 'Diterima', value: count(1), icon: ORDER_STATUS[1].icon, color: 'text-sky-600 bg-sky-100' },
        { label: 'Diproses', value: count(2), icon: ORDER_STATUS[2].icon, color: 'text-orange-600 bg-orange-100' },
        { label: 'Siap / Diantar', value: count(3), icon: ORDER_STATUS[3].icon, color: 'text-green-600 bg-green-100' }
    ];

    document.getElementById('admin-summary').innerHTML = cards.map(c => `
        <div class="stat-card">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center ${c.color}"><i class="fa-solid ${c.icon}"></i></div>
                <div class="min-w-0">
                    <p class="text-[11px] text-slate-400 font-semibold">${c.label}</p>
                    <p class="text-lg font-extrabold text-slate-800 truncate">${c.value}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function renderStockTable() {
    const body = document.getElementById('stock-table-body');
    if (!body) return;
    body.innerHTML = menuItems.map(m => `
        <tr>
            <td class="font-semibold text-slate-800">${escapeHtml(m.name)}</td>
            <td class="text-xs text-slate-500">${(categoryInfo[m.category] || {}).label || escapeHtml(m.category)}</td>
            <td>${stockBadge(m.stock)}</td>
            <td>
                <div class="flex items-center justify-end gap-1.5">
                    <button onclick="adjustStock('${m.id}', -1)" class="icon-btn">-</button>
                    <input type="number" min="0" value="${m.stock}" onchange="setStock('${m.id}', this.value)" class="w-16 text-center py-1 rounded-lg border border-slate-200 text-sm">
                    <button onclick="adjustStock('${m.id}', 1)" class="icon-btn">+</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function setStock(id, value) {
    const m = menuItems.find(x => x.id === id);
    if (!m) return;
    m.stock = Math.max(0, parseInt(value) || 0);
    saveStockToStorage();
    refreshAll();
}

function adjustStock(id, change) {
    const m = menuItems.find(x => x.id === id);
    if (m) setStock(id, m.stock + change);
}

function resetStock() {
    if (!confirm('Kembalikan semua stok ke angka awal?')) return;
    menuItems.forEach(m => m.stock = defaultStock[m.id] ?? 10);
    saveStockToStorage();
    saveMenuToStorage();
    refreshAll();
}

function statusBadge(step) {
    const st = ORDER_STATUS[step] || ORDER_STATUS[1];
    const key = ORDER_STATUS[step] ? step : 1;
    return `<span class="status-badge status-${key}"><i class="fa-solid ${st.icon}"></i> ${st.label}</span>`;
}

function renderTransactionTable() {
    const body = document.getElementById('tx-table-body');
    if (!body) return;

    const filter = document.getElementById('tx-filter-status').value;
    const q = document.getElementById('tx-search').value.trim().toLowerCase();

    const orders = getOrdersFromStorage().filter(o => {
        const step = o.statusStep || 1;
        if (filter !== 'all' && String(step) !== filter) return false;
        if (!q) return true;
        return [o.id, o.name, o.phone].some(v => String(v || '').toLowerCase().includes(q));
    });

    if (orders.length === 0) {
        body.innerHTML = `<tr><td colspan="9" class="text-center py-12 text-slate-400">
            <i class="fa-solid fa-inbox text-3xl block mb-2 text-slate-300"></i>
            ${getOrdersFromStorage().length === 0 ? 'Belum ada transaksi.' : 'Tidak ada transaksi yang cocok.'}
        </td></tr>`;
        return;
    }

    body.innerHTML = orders.map((o, i) => {
        const step = o.statusStep || 1;
        const itemCount = o.items.reduce((a, c) => a + c.qty, 0);
        return `
        <tr>
            <td class="text-slate-400">${i + 1}</td>
            <td class="font-mono font-bold text-skybrand-600 whitespace-nowrap">${escapeHtml(o.id)}</td>
            <td class="text-xs text-slate-500 whitespace-nowrap">${escapeHtml(o.time)}</td>
            <td>
                <p class="font-semibold text-slate-800">${escapeHtml(o.name)}</p>
                <p class="text-xs text-slate-400">${escapeHtml(o.phone)}</p>
            </td>
            <td class="text-xs">
                <p class="font-semibold text-slate-700">${escapeHtml(o.type)}</p>
                <p class="text-slate-400">${escapeHtml(o.payment)}</p>
                ${o.type === 'Delivery' && o.address ? `<p class="text-slate-500 mt-1 max-w-[180px] truncate" title="${escapeHtml(o.address)}"><i class="fa-solid fa-location-dot text-spicy-500"></i> ${escapeHtml(o.address)}</p>` : ''}
            </td>
            <td class="text-center font-semibold">${itemCount}</td>
            <td class="text-right font-bold text-slate-800 whitespace-nowrap">${formatRupiah(o.total)}</td>
            <td>
                <div class="flex flex-col gap-1.5 items-start">
                    ${statusBadge(step)}
                    <select class="status-select" onchange="changeOrderStatus('${o.id}', this.value)" aria-label="Ubah status ${escapeHtml(o.id)}">
                        ${Object.keys(ORDER_STATUS).map(k => `<option value="${k}" ${String(step) === k ? 'selected' : ''}>${ORDER_STATUS[k].label}</option>`).join('')}
                    </select>
                </div>
            </td>
            <td>
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="openOrderDetail('${o.id}')" class="icon-btn" title="Lihat detail"><i class="fa-solid fa-eye"></i></button>
                    <button onclick="deleteOrder('${o.id}')" class="icon-btn danger" title="Hapus transaksi"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function changeOrderStatus(orderId, step) {
    if (!isAdmin()) return;
    const orders = getOrdersFromStorage();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    order.statusStep = parseInt(step);
    saveOrdersToStorage(orders);

    renderAdminSummary();
    renderTransactionTable();

    
    if (!document.getElementById('order-detail-modal').classList.contains('hidden')) openOrderDetail(orderId);
}

function deleteOrder(orderId) {
    if (!isAdmin()) return;
    if (!confirm(`Hapus transaksi ${orderId}? Tindakan ini tidak bisa dibatalkan.`)) return;
    saveOrdersToStorage(getOrdersFromStorage().filter(o => o.id !== orderId));
    renderAdminSummary();
    renderTransactionTable();
}

function openOrderDetail(orderId) {
    const o = getOrdersFromStorage().find(x => x.id === orderId);
    if (!o) return;
    const step = o.statusStep || 1;

    document.getElementById('order-detail-content').innerHTML = `
        <div class="text-center mb-4">
            <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Detail Transaksi</span>
            <h3 class="text-xl font-bold font-mono text-skybrand-600">${escapeHtml(o.id)}</h3>
            <div class="mt-2">${statusBadge(step)}</div>
        </div>
        <div class="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 text-xs font-mono space-y-2">
            <div class="flex justify-between"><span class="text-slate-400">Pemesan</span><span class="text-slate-700">${escapeHtml(o.name)}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">WhatsApp</span><span class="text-slate-700">${escapeHtml(o.phone)}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Tipe / Bayar</span><span class="text-slate-700">${escapeHtml(o.type)} / ${escapeHtml(o.payment)}</span></div>
            ${o.type === 'Delivery' && o.address ? `<div class="pb-1"><span class="text-slate-400 block">Alamat Antar</span><span class="text-slate-700 break-words">${escapeHtml(o.address)}${o.landmark ? ' (Patokan: ' + escapeHtml(o.landmark) + ')' : ''}</span></div>` : ''}
            <div class="flex justify-between border-b border-slate-200 pb-2"><span class="text-slate-400">Waktu</span><span class="text-slate-700">${escapeHtml(o.time)}</span></div>
            <div class="py-1 space-y-1">
                ${o.items.map(i => `<div class="flex justify-between gap-3"><span>${i.qty}x ${escapeHtml(i.name)}</span><span class="shrink-0">${formatRupiah(i.price * i.qty)}</span></div>
                ${i.desc && String(i.id).startsWith('custom-') ? `<p class="text-[10px] text-slate-400 -mt-0.5">${escapeHtml(i.desc)}</p>` : ''}`).join('')}
            </div>
            <div class="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm text-slate-900">
                <span>TOTAL</span><span class="text-spicy-600">${formatRupiah(o.total)}</span>
            </div>
        </div>
        ${o.notes ? `<p class="mt-3 text-xs text-slate-600"><b>Catatan:</b> ${escapeHtml(o.notes)}</p>` : ''}
        <div class="mt-4">
            <label class="block text-xs font-semibold text-slate-600 mb-1">Ubah Status</label>
            <select class="status-select w-full !py-2 !text-sm" onchange="changeOrderStatus('${o.id}', this.value)">
                ${Object.keys(ORDER_STATUS).map(k => `<option value="${k}" ${String(step) === k ? 'selected' : ''}>${ORDER_STATUS[k].label}</option>`).join('')}
            </select>
        </div>
    `;
    document.getElementById('order-detail-modal').classList.remove('hidden');
}

function closeOrderDetail() {
    document.getElementById('order-detail-modal').classList.add('hidden');
}


function renderAdminMenuTable() {
    const body = document.getElementById('admin-menu-body');
    if (!body) return;

    if (menuItems.length === 0) {
        body.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-slate-400">Belum ada menu. Klik "Tambah Menu".</td></tr>`;
        return;
    }

    body.innerHTML = menuItems.map(m => `
        <tr>
            <td>
                <div class="flex items-center gap-3">
                    <img src="${m.image}" alt="" class="w-11 h-11 rounded-lg object-cover border border-slate-100 shrink-0">
                    <span class="font-semibold text-slate-800">${escapeHtml(m.name)}</span>
                </div>
            </td>
            <td class="text-xs text-slate-500">${(categoryInfo[m.category] || {}).label || escapeHtml(m.category)}</td>
            <td class="text-right font-semibold whitespace-nowrap">${formatRupiah(m.price)}</td>
            <td class="text-center">${stockBadge(m.stock)}</td>
            <td class="text-center">${m.isBestSeller ? '<i class="fa-solid fa-fire text-spicy-500"></i>' : '<span class="text-slate-300">-</span>'}</td>
            <td>
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="openMenuForm('${m.id}')" class="icon-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteMenu('${m.id}')" class="icon-btn danger" title="Hapus"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openMenuForm(menuId = null) {
    const m = menuId ? menuItems.find(x => x.id === menuId) : null;
    document.getElementById('menu-form-title').innerText = m ? 'Edit Menu' : 'Tambah Menu';
    document.getElementById('mf-id').value = m ? m.id : '';
    document.getElementById('mf-name').value = m ? m.name : '';
    document.getElementById('mf-category').value = m ? m.category : 'seblak';
    document.getElementById('mf-price').value = m ? m.price : '';
    document.getElementById('mf-stock').value = m ? m.stock : 10;
    document.getElementById('mf-desc').value = m ? m.desc : '';
    document.getElementById('mf-ingredients').value = m ? (m.ingredients || []).join(', ') : '';
    document.getElementById('mf-portion').value = m ? (m.portion || '') : '';
    document.getElementById('mf-prep').value = m ? (m.prepTime || '') : '';
    document.getElementById('mf-bestseller').checked = m ? !!m.isBestSeller : false;
    document.getElementById('mf-spicy').checked = m ? !!m.allowSpicy : true;
    document.getElementById('mf-image-file').value = '';
    document.getElementById('mf-image-url').value = '';
    menuFormImage = m ? m.image : '';
    document.getElementById('mf-image-preview').src = menuFormImage || 'images/logo.jpg';
    document.getElementById('menu-form-modal').classList.remove('hidden');
}

function closeMenuForm() {
    document.getElementById('menu-form-modal').classList.add('hidden');
}

function previewMenuImageUrl(url) {
    url = url.trim();
    if (url) {
        menuFormImage = url;
        document.getElementById('mf-image-preview').src = url;
    }
}


function handleMenuImageFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, 600 / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            menuFormImage = canvas.toDataURL('image/jpeg', 0.8);
            document.getElementById('mf-image-preview').src = menuFormImage;
            document.getElementById('mf-image-url').value = '';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function saveMenuForm() {
    const id = document.getElementById('mf-id').value;
    const name = document.getElementById('mf-name').value.trim();
    const price = parseInt(document.getElementById('mf-price').value);
    const stock = Math.max(0, parseInt(document.getElementById('mf-stock').value) || 0);

    if (!name) { alert('Nama menu wajib diisi!'); return; }
    if (!(price > 0)) { alert('Harga harus lebih dari 0!'); return; }

    const data = {
        name,
        category: document.getElementById('mf-category').value,
        price,
        stock,
        desc: document.getElementById('mf-desc').value.trim(),
        ingredients: document.getElementById('mf-ingredients').value.split(',').map(x => x.trim()).filter(Boolean),
        portion: document.getElementById('mf-portion').value.trim(),
        prepTime: document.getElementById('mf-prep').value.trim(),
        isBestSeller: document.getElementById('mf-bestseller').checked,
        allowSpicy: document.getElementById('mf-spicy').checked,
        image: menuFormImage || 'images/logo.jpg'
    };

    if (id) {
        const m = menuItems.find(x => x.id === id);
        if (m) Object.assign(m, data);
    } else {
        menuItems.push({ id: 'menu-' + Date.now(), spicyLevel: 0, ...data });
    }

    saveMenuToStorage();
    saveStockToStorage();
    syncStoredCartWithMenu();
    closeMenuForm();
    refreshAll();
    renderAdminSummary();
}

function deleteMenu(menuId) {
    const m = menuItems.find(x => x.id === menuId);
    if (!m) return;
    if (!confirm(`Hapus menu "${m.name}" dari katalog?`)) return;

    menuItems = menuItems.filter(x => x.id !== menuId);

    saveMenuToStorage();
    saveStockToStorage();
    syncStoredCartWithMenu();
    refreshAll();
    renderAdminSummary();
}
