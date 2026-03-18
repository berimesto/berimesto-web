import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jjvfilxdnpdywtbhcfrq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lL2I9njAuzNIMsBUD0cHYQ_dSH6uOzm';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const state = {
  activeTab: 'warehouses',
  loading: false,
  warehouses: [],
  cells: [],
  bookingId: null,
};

const elements = {
  tabs: Array.from(document.querySelectorAll('[data-tab]')),
  content: document.getElementById('tab-content'),
  title: document.getElementById('section-title'),
  subtitle: document.getElementById('section-subtitle'),
  refreshButton: document.getElementById('refresh-button'),
  statusRegion: document.getElementById('status-region'),
  stats: {
    warehouses: document.querySelector('[data-stat="warehouses"]'),
    cells: document.querySelector('[data-stat="cells"]'),
    freeCells: document.querySelector('[data-stat="free-cells"]'),
  },
};

const tabMeta = {
  warehouses: {
    title: 'Склады',
    subtitle: 'Все склады с количеством ячеек, свободными местами и минимальной ценой.',
  },
  cells: {
    title: 'Ячейки',
    subtitle: 'Список всех ячеек с актуальным статусом и возможностью бронирования.',
  },
  access: {
    title: 'Мой доступ',
    subtitle: 'Раздел для будущей интеграции с TT-Lock.',
  },
};

const rubles = new Intl.NumberFormat('ru-RU');

function createPlaceholder(label) {
  const safeLabel = String(label ?? '').replace(/[&<>"']/g, (symbol) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[symbol]));

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#315efb" />
          <stop offset="100%" stop-color="#7be0ff" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#g)" />
      <rect x="90" y="110" width="1020" height="500" rx="40" fill="rgba(255,255,255,0.16)" />
      <text x="600" y="360" font-family="Arial, sans-serif" font-size="72" fill="#ffffff" text-anchor="middle">${safeLabel}</text>
    </svg>
  `.replace(/\s+/g, ' ');

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatPrice(price) {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) ? `${rubles.format(numericPrice)} ₽` : 'Цена по запросу';
}

function announce(message) {
  elements.statusRegion.textContent = message;
}

function warehouseMap() {
  return new Map(state.warehouses.map((warehouse) => [warehouse.id, warehouse]));
}

function getWarehouseStats(warehouseId) {
  const relatedCells = state.cells.filter((cell) => cell.warehouse_id === warehouseId);
  const freeCells = relatedCells.filter((cell) => Boolean(cell.is_free));
  const minPrice = relatedCells.reduce((currentMin, cell) => {
    const price = Number(cell.price);
    if (!Number.isFinite(price)) {
      return currentMin;
    }
    if (currentMin === null || price < currentMin) {
      return price;
    }
    return currentMin;
  }, null);

  return {
    total: relatedCells.length,
    free: freeCells.length,
    minPrice,
  };
}

function updateStats() {
  const freeCellsCount = state.cells.filter((cell) => Boolean(cell.is_free)).length;

  elements.stats.warehouses.textContent = String(state.warehouses.length);
  elements.stats.cells.textContent = String(state.cells.length);
  elements.stats.freeCells.textContent = String(freeCellsCount);
}

function setLoading(isLoading, message = 'Загрузка данных из Supabase…') {
  state.loading = isLoading;
  elements.refreshButton.disabled = isLoading;

  if (isLoading) {
    elements.content.innerHTML = `<div class="loader">${escapeHtml(message)}</div>`;
  }
}

function renderError(message) {
  elements.content.innerHTML = `
    <div class="error-state">
      <h3>Не удалось загрузить данные</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function renderEmpty(title, text) {
  elements.content.innerHTML = `
    <div class="empty-state">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function renderWarehouses() {
  if (state.warehouses.length === 0) {
    renderEmpty('Склады пока не добавлены', 'После появления записей в таблице warehouses они будут отображаться здесь.');
    return;
  }

  const cards = state.warehouses.map((warehouse) => {
    const stats = getWarehouseStats(warehouse.id);
    const photoUrl = warehouse.photo_url || createPlaceholder(warehouse.name || 'Склад');
    const address = warehouse.address || 'Адрес пока не указан';
    const minPriceText = stats.minPrice === null ? 'Цена по запросу' : `от ${formatPrice(stats.minPrice)}`;

    return `
      <article class="card">
        <img class="card__media" src="${escapeHtml(photoUrl)}" alt="${escapeHtml(warehouse.name || 'Склад')}" loading="lazy" />
        <div class="card__body">
          <div>
            <div class="card__title-row">
              <div>
                <h3 class="card__title">${escapeHtml(warehouse.name || 'Без названия')}</h3>
                <p class="card__subtitle">${escapeHtml(address)}</p>
              </div>
              <span class="pill pill--muted">ID ${escapeHtml(warehouse.id)}</span>
            </div>
          </div>

          <div class="meta-list">
            <div class="meta-item"><span>Количество ячеек</span><strong>${stats.total}</strong></div>
            <div class="meta-item"><span>Свободные ячейки</span><strong>${stats.free}</strong></div>
            <div class="meta-item"><span>Минимальная цена</span><strong>${escapeHtml(minPriceText)}</strong></div>
          </div>

          <div class="card__actions">
            <span class="pill ${stats.free > 0 ? 'pill--success' : 'pill--danger'}">${stats.free > 0 ? 'Есть свободные места' : 'Свободных мест нет'}</span>
            <button class="button button--secondary" type="button" data-tab-jump="cells">Смотреть ячейки</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  elements.content.innerHTML = `<div class="grid">${cards}</div>`;

  elements.content.querySelectorAll('[data-tab-jump="cells"]').forEach((button) => {
    button.addEventListener('click', () => switchTab('cells'));
  });
}

function renderCells() {
  if (state.cells.length === 0) {
    renderEmpty('Ячейки пока не добавлены', 'Когда записи появятся в таблице cells, они будут показаны в этом разделе.');
    return;
  }

  const warehousesById = warehouseMap();

  const cards = state.cells.map((cell) => {
    const warehouse = warehousesById.get(cell.warehouse_id) || {};
    const photoUrl = cell.photo_url || warehouse.photo_url || createPlaceholder(cell.size || 'Ячейка');
    const warehouseName = warehouse.name || 'Склад не найден';
    const warehouseAddress = warehouse.address || 'Адрес склада недоступен';
    const statusClass = cell.is_free ? 'pill--success' : 'pill--danger';
    const statusText = cell.is_free ? 'Свободно' : 'Занято';
    const buttonDisabled = !cell.is_free || state.bookingId === cell.id;
    const buttonText = state.bookingId === cell.id ? 'Бронирование…' : 'Забронировать';

    return `
      <article class="card">
        <img class="card__media" src="${escapeHtml(photoUrl)}" alt="${escapeHtml(cell.size || 'Ячейка')}" loading="lazy" />
        <div class="card__body">
          <div>
            <div class="card__title-row">
              <div>
                <h3 class="card__title">${escapeHtml(warehouseName)}</h3>
                <p class="card__subtitle">${escapeHtml(warehouseAddress)}</p>
              </div>
              <span class="pill ${statusClass}">${statusText}</span>
            </div>
          </div>

          <div class="meta-list">
            <div class="meta-item"><span>Размер</span><strong>${escapeHtml(cell.size || 'Не указан')}</strong></div>
            <div class="meta-item"><span>Цена</span><strong>${escapeHtml(formatPrice(cell.price))}</strong></div>
            <div class="meta-item"><span>ID ячейки</span><strong>${escapeHtml(cell.id)}</strong></div>
          </div>

          <div class="card__actions">
            <span class="pill pill--muted">${escapeHtml(cell.photo_url ? 'Фото ячейки' : warehouse.photo_url ? 'Фото склада' : 'Графическая заглушка')}</span>
            <button class="button" type="button" data-book-cell="${escapeHtml(cell.id)}" ${buttonDisabled ? 'disabled' : ''}>${buttonText}</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  elements.content.innerHTML = `<div class="grid">${cards}</div>`;

  elements.content.querySelectorAll('[data-book-cell]').forEach((button) => {
    button.addEventListener('click', () => {
      const cellId = button.getAttribute('data-book-cell');
      if (cellId) {
        bookCell(cellId);
      }
    });
  });
}

function renderAccess() {
  elements.content.innerHTML = `
    <div class="notice">
      <h2>Мой доступ</h2>
      <p>Интеграция с TT-Lock будет здесь.</p>
    </div>
  `;
}

function renderActiveTab() {
  const meta = tabMeta[state.activeTab];
  elements.title.textContent = meta.title;
  elements.subtitle.textContent = meta.subtitle;

  if (state.activeTab === 'warehouses') {
    renderWarehouses();
    return;
  }

  if (state.activeTab === 'cells') {
    renderCells();
    return;
  }

  renderAccess();
}

function switchTab(nextTab) {
  state.activeTab = nextTab;
  elements.tabs.forEach((tabButton) => {
    const isActive = tabButton.dataset.tab === nextTab;
    tabButton.setAttribute('aria-selected', String(isActive));
  });
  renderActiveTab();
}

async function loadData() {
  setLoading(true);

  const [{ data: warehouses, error: warehousesError }, { data: cells, error: cellsError }] = await Promise.all([
    supabase.from('warehouses').select('*').order('name', { ascending: true }),
    supabase.from('cells').select('*').order('id', { ascending: true }),
  ]);

  if (warehousesError || cellsError) {
    const message = warehousesError?.message || cellsError?.message || 'Неизвестная ошибка Supabase.';
    setLoading(false);
    renderError(message);
    announce(`Ошибка загрузки данных: ${message}`);
    return;
  }

  state.warehouses = Array.isArray(warehouses) ? warehouses : [];
  state.cells = Array.isArray(cells) ? cells : [];
  setLoading(false);
  updateStats();
  renderActiveTab();
  announce('Данные успешно загружены.');
}

async function bookCell(cellId) {
  state.bookingId = cellId;
  renderActiveTab();
  announce(`Бронируем ячейку ${cellId}.`);

  const { error } = await supabase
    .from('cells')
    .update({ is_free: false })
    .eq('id', cellId)
    .eq('is_free', true);

  if (error) {
    state.bookingId = null;
    renderActiveTab();
    announce(`Не удалось забронировать ячейку ${cellId}.`);
    window.alert(`Не удалось забронировать ячейку: ${error.message}`);
    return;
  }

  const targetCell = state.cells.find((cell) => String(cell.id) === String(cellId));
  if (targetCell) {
    targetCell.is_free = false;
  }

  state.bookingId = null;
  updateStats();
  renderActiveTab();
  announce(`Ячейка ${cellId} успешно забронирована.`);
  window.alert('Ячейка успешно забронирована.');
}

elements.tabs.forEach((tabButton) => {
  tabButton.addEventListener('click', () => switchTab(tabButton.dataset.tab));
});

elements.refreshButton.addEventListener('click', () => {
  loadData();
});

loadData();
