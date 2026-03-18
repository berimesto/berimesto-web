const SUPABASE_URL = "https://jjvfilxdnpdywtbhcfrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_lL2I9njAuzNIMsBUD0cHYQ_dSH6uOzm";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Вкладки
const warehousesTab = document.getElementById('warehouses');
const cellsTab = document.getElementById('cells');
const myAccessTab = document.getElementById('my-access');

function showTab(tab) {
  warehousesTab.style.display = 'none';
  cellsTab.style.display = 'none';
  myAccessTab.style.display = 'none';

  if(tab === 'warehouses') warehousesTab.style.display = 'block';
  if(tab === 'cells') cellsTab.style.display = 'block';
  if(tab === 'my-access') myAccessTab.style.display = 'block';
}

// Загрузка складов
async function loadWarehouses() {
  const { data: warehouses, error: wError } = await client.from('warehouses').select('*');
  const { data: cells, error: cError } = await client.from('cells').select('*');

  if (wError || cError) {
    console.error("Ошибка загрузки данных:", wError || cError);
    return;
  }

  warehousesTab.innerHTML = '';
  warehouses.forEach(w => {
    const warehouseCells = cells.filter(c => c.location_id === w.id);
    const freeCells = warehouseCells.filter(c => c.is_free).length;
    const minPrice = warehouseCells.length ? Math.min(...warehouseCells.map(c => c.price)) : 0;

    const div = document.createElement('div');
    div.className = 'warehouse';
    div.innerHTML = `
      <img src="${w.photo_url || 'https://via.placeholder.com/100x70'}">
      <div>
        <b>${w.name}</b><br>
        ${w.address || ''}<br>
        Ячеек: ${warehouseCells.length}, свободно: ${freeCells}<br>
        От ${minPrice} ₽
      </div>
    `;
    warehousesTab.appendChild(div);
  });
}

// Загрузка всех ячеек
async function loadCells() {
  const { data: warehouses, error: wError } = await client.from('warehouses').select('*');
  const { data: cells, error: cError } = await client.from('cells').select('*');

  if (wError || cError) {
    console.error("Ошибка загрузки данных:", wError || cError);
    return;
  }

  cellsTab.innerHTML = '';
  cells.forEach(c => {
    const warehouse = warehouses.find(w => w.id === c.location_id);
    const div = document.createElement('div');
    div.className = 'cell';
    div.innerHTML = `
      <img src="${c.photo_url || warehouse?.photo_url || 'https://via.placeholder.com/100x70'}">
      <div>
        <b>${warehouse?.name || ''}</b><br>
        ${warehouse?.address || ''}<br>
        Размер: ${c.size}<br>
        Цена: ${c.price} ₽<br>
        ${c.is_free ? 'Свободно' : 'Занято'}
      </div>
    `;
    // Кнопка "Забронировать"
    if(c.is_free){
      const btn = document.createElement('button');
      btn.className = 'book';
      btn.textContent = 'Забронировать';
      btn.onclick = async () => {
        await client.from('cells').update({ is_free: false }).eq('id', c.id);
        div.querySelector('div').innerHTML += '<br>Забронировано';
        btn.remove();
      };
      div.appendChild(btn);
    }
    cellsTab.appendChild(div);
  });
}

// Инициализация
showTab('warehouses');
loadWarehouses();
loadCells();
