const SUPABASE_URL = "https://jjvfilxdnpdywtbhcfrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_lL2I9njAuzNIMsBUD0cHYQ_dSH6uOzm";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const map = L.map('map').setView([54.7388, 55.9721], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

async function loadWarehouses() {
  const { data: warehouses, error } = await client
    .from('warehouses')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  for (const warehouse of warehouses) {
    const marker = L.marker([warehouse.latitude, warehouse.longitude]).addTo(map);

    const { data: cells } = await client
      .from('cells')
      .select('*')
      .eq('warehouse_id', warehouse.id);

    let popupContent = `<b>${warehouse.name}</b><br>${warehouse.address}<br><ul>`;

    cells.forEach(cell => {
      popupContent += `<li>${cell.size} — ${cell.price} ₽ — ${cell.occupied ? "Занято" : "Свободно"}</li>`;
    });

    popupContent += `</ul>`;

    marker.bindPopup(popupContent);
  }
}

loadWarehouses();
