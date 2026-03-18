const SUPABASE_URL = "https://jjvfilxdnpdywtbhcfrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_lL2I9njAuzNIMsBUD0cHYQ_dSH6uOzm";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Карта Уфа
const map = L.map('map').setView([54.7749, 56.0376], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Popup элементы
const popup = document.getElementById('warehouse-popup');
const popupImg = document.getElementById('popup-img');
const popupName = document.getElementById('popup-name');
const popupAddress = document.getElementById('popup-address');
const popupMinPrice = document.getElementById('popup-min-price');
const popupSelect = document.getElementById('popup-select');

// Экран ячеек
const cellsScreen = document.getElementById('cells-list');
const cellsUl = document.getElementById('cells-ul');

function closeCellsScreen() {
  cellsScreen.style.display = 'none';
}

// Загрузка складов
async function loadWarehouses() {
  const { data: warehouses, error } = await client.from('warehouses').select('*');
  if (error) {
    console.error("Ошибка загрузки складов:", error);
    return;
  }

  warehouses.forEach(warehouse => {
    const marker = L.marker([warehouse.lat, warehouse.lng]).addTo(map);

    marker.on('click', async () => {
      const { data: cells, error: cellsError } = await client
        .from('cells')
        .select('*')
        .eq('location_id', warehouse.id);

      if (cellsError) {
        console.error("Ошибка загрузки ячеек:", cellsError);
        return;
      }

      const minPrice = Math.min(...cells.map(c => c.price));

      // Заполняем popup
      popupImg.src = warehouse.photo_url || 'https://via.placeholder.com/400x150';
      popupName.textContent = warehouse.name;
      popupAddress.textContent = warehouse.address || '';
      popupMinPrice.textContent = `от ${minPrice} ₽`;
      popup.style.display = 'block';

      popupSelect.onclick = () => showCellsScreen(warehouse.id, false);
    });
  });
}

// Показать экран ячеек
function showCellsScreen(locationId = null, onlyOccupied = false) {
  popup.style.display = 'none';
  cellsScreen.style.display = 'block';
  cellsUl.innerHTML = '';

  let query = client.from('cells').select('*');

  if (onlyOccupied) {
    query = query.eq('is_free', false); // показываем только занятые
  } else if (locationId) {
    query = query.eq('location_id', locationId); // все ячейки выбранного склада
  }

  query.then(({ data: cells }) => {
    if (!cells) return;

    cells.forEach(cell => {
      const li = document.createElement('li');
      li.textContent = `${cell.size} — ${cell.price} ₽ — ${cell.is_free ? "Свободно" : "Занято"}`;

      // Кнопка "Забронировать" только для свободных ячеек
      if (cell.is_free && !onlyOccupied) {
        const btn = document.createElement('button');
        btn.textContent = 'Забронировать';
        btn.onclick = async () => {
          await client.from('cells').update({ is_free: false }).eq('id', cell.id);
          li.textContent = `${cell.size} — ${cell.price} ₽ — Занято`;
          btn.remove();
        };
        li.appendChild(btn);
      }

      cellsUl.appendChild(li);
    });
  });
}

// Navbar
function showTab(tab) {
  if (tab === 'map') {
    cellsScreen.style.display = 'none';
    popup.style.display = 'none';
    map.invalidateSize();
  } else if (tab === 'cells') {
    showCellsScreen(null, true); // показываем только забронированные
  } else {
    alert("Доступ пока заглушка");
  }
}

loadWarehouses();
