import { supabase } from './supabase-client.js';

export async function renderHome() {
  const root = document.getElementById('app');
  root.innerHTML = '<section class="bm-container"><h1>Аренда складских ячеек рядом с вами</h1><p>Загружаем склады...</p><div id="warehouse-list" class="grid"></div></section>';

  const list = document.getElementById('warehouse-list');
  const [{ data: warehouses, error: wErr }, { data: cells, error: cErr }, { data: reservations, error: rErr }] = await Promise.all([
    supabase.from('warehouses').select('id,name,address,photo_url,active'),
    supabase.from('cells').select('id,warehouse_id,price,busy'),
    supabase.from('active_cell_reservations_public').select('cell_id')
  ]);

  if (wErr || cErr || rErr) {
    list.innerHTML = '<p>Не удалось загрузить склады. Обновите страницу или попробуйте позже.</p>';
    console.error(wErr || cErr || rErr);
    return;
  }

  const reserved = new Set((reservations || []).map((r) => r.cell_id));
  list.innerHTML = (warehouses || [])
    .filter((w) => w.active)
    .map((w) => {
      const wc = (cells || []).filter((c) => c.warehouse_id === w.id);
      const free = wc.filter((c) => !c.busy && !reserved.has(c.id));
      const min = free.length ? Math.min(...free.map((c) => Number(c.price) || 0)) : null;
      return `<article class="card"><h3>${w.name}</h3><p>${w.address}</p><p>Свободно: ${free.length}</p><p>${min ? `От ${min} ₽/мес` : 'Нет свободных ячеек'}</p><a href="/sklad/?id=${w.id}">Выбрать ячейку</a></article>`;
    })
    .join('');
}
