const SUPABASE_URL = "https://jjvfilxdnpdywtbhcfrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_lL2I9njAuzNIMsBUD0cHYQ_dSH6uOzm";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Инициализация карты на Уфу
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

// Загружаем склады
async function loadWarehouses() {
  const { data: warehouses, error } = await client.from('warehouses').select('*');
  if (error) {
    console.error("Ошибка загрузки складов:", error);
    return;
  }
  console.log("Склады:", warehouses);

  warehouses.forEach(async warehouse => {
    const marker = L.marker([warehouse.latitude, warehouse.longitude]).addTo(map);

    marker.on('click', async () => {
      // Получаем ячейки этого склада
      const { data: cells, error: cellsError } = await client
        .from('cells')
        .select('*')
        .eq('warehouse_id', warehouse.id);

      if (cellsError) {
        console.error("Ошибка загрузки ячеек:", cellsError);
        return;
      }

      const minPrice = Math.min(...cells.map(c => c.price));

      // Заполняем popup
      popupImg.src = warehouse.photo_url || 'https://via.placeholder.com/400x150';
      popupName.textContent = warehouse.name;
      popupAddress.textContent = warehouse.address;
      popupMinPrice.textContent = `от ${minPrice} ₽`;
      popup.style.display = 'block';

      popupSelect.onclick = () => showCellsScreen(warehouse.id);
    });
  });
}

// Показать экран ячеек
function showCellsScreen(warehouseId) {
  popup.style.display = 'none';
  cellsScreen.style.display = 'block';
  cellsUl.innerHTML = '';

  client.from('cells')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .then(({ data: cells }) => {
      cells.forEach(cell => {
        const li = document.createElement('li');
        li.textContent = `${cell.size} — ${cell.price} ₽ — ${cell.occupied ? "Занято" : "Свободно"}`;

        if (!cell.occupied) {
          const btn = document.createElement('button');
          btn.textContent = 'Забронировать';
          btn.onclick = async () => {
            await client.from('cells').update({ occupied: true }).eq('id', cell.id);
            li.textContent = `${cell.size} — ${cell.price} ₽ — Занято`;
            btn.remove();
          };
          li.appendChild(btn);
        }

        cellsUl.appendChild(li);
      });
    });
}

// Navbar заглушка
function showTab(tab) {
  alert("Пока заглушка: " + tab);
}

loadWarehouses();
