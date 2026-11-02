const defaultMenuItems = [
    {
        id: 'menu-1', name: 'Seblak Cuanki', category: 'seblak', price: 12000, spicyLevel: 0,
        desc: 'Seblak kuah pedas gurih dengan kencur asli, telur,kerupuk dan kwetaiw .',
        image: 'images/seblak-cuanki.jpeg', isBestSeller: true,
        ingredients: ['Aci cuanki', 'Kerupuk', 'Kwetiau', 'Telur', 'Kencur asli'],
        portion: '1 mangkuk (± 350 gr)', prepTime: '10–15 menit', allowSpicy: true
    },
    {
        id: 'menu-2', name: 'Seblak Makaroni', category: 'seblak', price: 12000, spicyLevel: 0,
        desc: 'Seblak kuah pedas gurih dengan kencur asli, telur,kerupuk dan kwetaiw.',
        image: 'images/seblak-makaroni.jpeg', isBestSeller: false,
        ingredients: ['Makaroni', 'Kerupuk', 'Kwetiau', 'Telur', 'Kencur asli'],
        portion: '1 mangkuk (± 350 gr)', prepTime: '10–15 menit', allowSpicy: true
    },
    {
        id: 'menu-3', name: 'Seblak Mie', category: 'seblak', price: 12000, spicyLevel: 0,
        desc: 'Seblak kuah pedas gurih dengan kencur asli, telur,kerupuk dan kwetaiw..',
        image: 'images/seblak-mie.jpeg', isBestSeller: true,
        ingredients: ['Mie', 'Kerupuk', 'Kwetiau', 'Telur', 'Kencur asli'],
        portion: '1 mangkuk (± 350 gr)', prepTime: '10–15 menit', allowSpicy: true
    },
    {
        id: 'menu-4', name: 'Bakso Aci Original', category: 'baci', price: 13000, spicyLevel: 0,
        desc: 'Bakso aci kenyal dengan kuah kaldu yang di perpadukan sambel dan jeruk limau.',
        image: 'images/bakso-ori.jpeg', isBestSeller: false,
        ingredients: ['Bakso aci', 'Kuah kaldu sapi', 'Sambal', 'Jeruk limau'],
        portion: '1 mangkuk (± 300 gr)', prepTime: '8–10 menit', allowSpicy: true
    },
    {
        id: 'menu-5', name: 'Bakso Aci Cuanki', category: 'baci', price: 16000, spicyLevel: 0,
        desc: 'Bakso aci cuanki dengan kuah kaldu yang di perpadukan sambel dan jeruk limau.',
        image: 'images/bakso-cuanki.jpeg', isBestSeller: true,
        ingredients: ['Bakso aci', 'Cuanki', 'Kuah kaldu sapi', 'Sambal', 'Jeruk limau'],
        portion: '1 mangkuk (± 350 gr)', prepTime: '8–10 menit', allowSpicy: true
    },
    {
        id: 'menu-6', name: 'Bakso Aci Tulangrangu', category: 'baci', price: 16000, spicyLevel: 0,
        desc: 'Bakso aci dengan tulang rangu yang empuk, kuah kaldu gurih berpadu sambel dan jeruk limau.',
        image: 'images/bakso-tulangrangu.jpeg', isBestSeller: false,
        ingredients: ['Bakso aci', 'Tulang rangu', 'Kuah kaldu sapi', 'Sambal', 'Jeruk limau'],
        portion: '1 mangkuk (± 350 gr)', prepTime: '8–10 menit', allowSpicy: true
    },
    {
        id: 'menu-7', name: 'Es Teh Manis Jumbo', category: 'minuman', price: 5000, spicyLevel: 0,
        desc: 'Es teh manis segar pelepas dahaga dari daun teh pilihan.',
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
        isBestSeller: false,
        ingredients: ['Teh pilihan', 'Gula', 'Es batu'],
        portion: '1 gelas jumbo (± 500 ml)', prepTime: '2–3 menit', allowSpicy: false
    },
    {
        id: 'menu-8', name: 'Es Jeruk Peras Jumbo', category: 'minuman', price: 7000, spicyLevel: 0,
        desc: 'Perasan jeruk peras alami manis dan asam netralkan rasa pedas.',
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
        isBestSeller: false,
        ingredients: ['Jeruk peras', 'Gula', 'Es batu'],
        portion: '1 gelas jumbo (± 500 ml)', prepTime: '2–3 menit', allowSpicy: false
    }
];

// Daftar menu aktif (bisa diubah admin, disimpan di localStorage)
let menuItems = defaultMenuItems.map(m => ({ ...m }));

// Stok awal (global, dipakai saat inisialisasi dan saat reset stok)
const defaultStock = {
    'menu-1': 20,
    'menu-2': 20,
    'menu-3': 20,
    'menu-4': 15,
    'menu-5': 15,
    'menu-6': 15,
    'menu-7': 30,
    'menu-8': 30
};
menuItems.forEach(m => m.stock = defaultStock[m.id] ?? 10);

const categoryInfo = {
    seblak:  { label: 'Seblak',               icon: 'fa-fire',         color: 'text-spicy-500' },
    baci:    { label: 'Bakso Aci',            icon: 'fa-circle-dot',   color: 'text-amber-500' },
    minuman: { label: 'Minuman / Sampingan',  icon: 'fa-glass-water',  color: 'text-cyan-500' }
};

const spicyLabels = ['Tanpa pedas', 'Sedikit', 'Sedang', 'Pedas', 'Sangat pedas', 'Extra pedas'];

// Status transaksi (statusStep pada order)
const ORDER_STATUS = {
    1: { label: 'Diterima',       icon: 'fa-file-invoice' },
    2: { label: 'Diproses',       icon: 'fa-fire-burner' },
    3: { label: 'Siap / Diantar', icon: 'fa-circle-check' }
};

// --- UTILS ---
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
}

// --- STORAGE: MENU & STOK ---
function loadMenuFromStorage() {
    try {
        const saved = JSON.parse(localStorage.getItem('seblak_menu'));
        if (Array.isArray(saved)) menuItems = saved;
    } catch (e) {}
}

function saveMenuToStorage() {
    try {
        localStorage.setItem('seblak_menu', JSON.stringify(menuItems));
    } catch (e) {
        alert('Penyimpanan browser penuh. Gunakan gambar yang lebih kecil atau URL gambar.');
    }
}

function loadStockFromStorage() {
    try {
        const saved = JSON.parse(localStorage.getItem('seblak_stock'));
        if (saved) {
            menuItems.forEach(m => {
                if (saved[m.id] !== undefined) m.stock = saved[m.id];
            });
        }
    } catch (e) {}
}

function saveStockToStorage() {
    const map = {};
    menuItems.forEach(m => map[m.id] = m.stock);
    localStorage.setItem('seblak_stock', JSON.stringify(map));
}

function stockBadge(stock) {
    if (stock === 0) return '<span class="px-2 py-1 rounded-lg bg-red-100 text-red-600 text-xs font-bold">Habis</span>';
    if (stock <= 5) return `<span class="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">Menipis (${stock})</span>`;
    return `<span class="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">Tersedia (${stock})</span>`;
}

// --- STORAGE: TRANSAKSI ---
function getOrdersFromStorage() {
    const data = localStorage.getItem('seblak_orders');
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveOrdersToStorage(orders) {
    localStorage.setItem('seblak_orders', JSON.stringify(orders));
}

function saveOrderToStorage(order) {
    const orders = getOrdersFromStorage();
    orders.unshift(order);
    saveOrdersToStorage(orders);
}
