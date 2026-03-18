const SUPABASE_URL = "https://jjvfilxdnpdywtbhcfrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_lL2I9njAuzNIMsBUD0cHYQ_dSH6uOzm";

// ВАЖНО: используем другое имя
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Инициализация карты
const map = L.map('map').setView([55.7558, 37.6173], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Загрузка складов и ячеек
async function loadWarehouses() {
    const { data: warehouses, error } = await client
        .from('warehouses')
        .select('*');

    if (error) {
        console.error("Ошибка загрузки складов:", error);
        return;
    }

    warehouses.forEach(async warehouse => {
        const marker = L.marker([warehouse.latitude, warehouse.longitude]).addTo(map);

        const { data: cells, error: cellsError } = await client
            .from('cells')
            .select('*')
            .eq('warehouse_id', warehouse.id);

        if (cellsError) {
            console.error("Ошибка загрузки ячеек:", cellsError);
            return;
        }

        let popupContent = `<b>${warehouse.name}</b><br>${warehouse.address}<br><ul>`;

        cells.forEach(cell => {
            popupContent += `<li>${cell.size} — ${cell.price} ₽ — ${cell.occupied ? "Занято" : "Свободно"}</li>`;
        });

        popupContent += `</ul>`;

        marker.bindPopup(popupContent);
    });
}

loadWarehouses();
