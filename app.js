import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Настройки Supabase
const SUPABASE_URL = 'https://YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const main = document.getElementById('main-content');

// Навигация
document.getElementById('menu-my-boxes').addEventListener('click', showMyBoxes);
document.getElementById('menu-warehouses').addEventListener('click', showWarehouses);
document.getElementById('menu-cells').addEventListener('click', () => {
  main.innerHTML = '<h3>Ячейки</h3><p>Здесь будет список ячеек.</p>';
});
document.getElementById('menu-my-access').addEventListener('click', () => {
  main.innerHTML = '<h3>Мой доступ</h3><p>Здесь будет информация о вашем доступе.</p>';
});

// Функции
async function showWarehouses() {
  main.innerHTML = '<h3>Склады</h3><p>Загрузка...</p>';
  const { data, error } = await supabase.from('Warehouse').select('*');

  if (error) {
    main.innerHTML = `<p>Ошибка загрузки: ${error.message}</p>`;
    return;
  }

  main.innerHTML = '';
  data.forEach(warehouse => {
    const div = document.createElement('div');
    div.classList.add('warehouse');
    div.innerHTML = `
      <h4>${warehouse.name}</h4>
      <p>Адрес: ${warehouse.address}</p>
      <p>Ячеек: ${warehouse.total_cells}, свободно: ${warehouse.free_cells}</p>
      <p>Стоимость: от ${warehouse.price} ₽</p>
      <img src="${warehouse.photo_url}" alt="${warehouse.name}" width="200">
      <button data-id="${warehouse.id}">Забронировать ячейку</button>
    `;
    div.querySelector('button').addEventListener('click', () => showCells(warehouse.id));
    main.appendChild(div);
  });
}

async function showCells(warehouseId) {
  main.innerHTML = `<h3>Ячейки склада ${warehouseId}</h3><p>Загрузка...</p>`;
  const { data, error } = await supabase.from('Sales').select('*').eq('warehouse_id', warehouseId);

  if (error) {
    main.innerHTML = `<p>Ошибка: ${error.message}</p>`;
    return;
  }

  main.innerHTML = '';
  data.forEach(cell => {
    const div = document.createElement('div');
    div.classList.add('cell');
    div.innerHTML = `
      <p>Ячейка ${cell.name} — ${cell.size} м³ — ${cell.is_free ? 'Свободна' : 'Занята'} — ${cell.price} ₽</p>
      <button ${cell.is_free ? '' : 'disabled'} data-id="${cell.id}">Забронировать</button>
    `;
    if (cell.is_free) {
      div.querySelector('button').addEventListener('click', () => choosePlan(cell.id));
    }
    main.appendChild(div);
  });
}

function choosePlan(cellId) {
  main.innerHTML = `
    <h3>Выберите тарифный план</h3>
    <button data-plan="month">Месяц — 1490 ₽</button>
    <button data-plan="quarter">Квартал — 4200 ₽</button>
    <button data-plan="half">Полгода — 7800 ₽</button>
    <button data-plan="year">Год — 15000 ₽</button>
  `;
  main.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => rentCell(cellId, btn.dataset.plan));
  });
}

async function rentCell(cellId, plan) {
  // Здесь можно добавить интеграцию с оплатой
  const { data, error } = await supabase.from('Sales').update({ is_free: false, plan: plan }).eq('id', cellId);

  if (error) {
    main.innerHTML = `<p>Ошибка аренды: ${error.message}</p>`;
    return;
  }

  alert('Ячейка успешно арендована!');
  showMyBoxes();
}

async function showMyBoxes() {
  main.innerHTML = '<h3>Мои боксы</h3><p>Загрузка...</p>';
  const { data, error } = await supabase.from('Sales').select('*').eq('is_free', false);

  if (error) {
    main.innerHTML = `<p>Ошибка: ${error.message}</p>`;
    return;
  }

  main.innerHTML = '';
  data.forEach(cell => {
    const div = document.createElement('div');
    div.innerHTML = `<p>Ячейка ${cell.name} — ${cell.size} м³ — Тариф: ${cell.plan}</p>`;
    main.appendChild(div);
  });
}
