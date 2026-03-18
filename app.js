const SUPABASE_URL = "https://jjvfilxdnpdywtbhcfrq.supabase.co; // вставь свой URL
const SUPABASE_KEY = "sb_publishable_lL2I9njAuzNIMsBUD0cHYQ_dSH6uOzm"; // вставь свой anon key

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Инициализация карты
const map = L.map('map').setView([55.7558, 37.6173], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Загрузка складов и ячеек
async function loadWarehouses() {
    let { data: warehouses, error } = await supabase
        .from('warehouses')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    warehouses.forEach(async warehouse => {
        const marker = L.marker([warehouse.latitude, warehouse.longitude]).addTo(map);

        let { data: cells } = await supabase
            .from('cells')
            .select('*')
            .eq('warehouse_id', warehouse.id);

        let popupContent = `<b>${warehouse.name}</b><br>${warehouse.address}<br><ul>`;
        cells.forEach(cell => {
            popupContent += `<li>${cell.size} — ${cell.price} ₽ — ${cell.occupied ? "Занято" : "Свободно"}</li>`;
        });
        popupContent += `</ul>`;

        marker.bindPopup(popupContent);
    });
}

loadWarehouses();
