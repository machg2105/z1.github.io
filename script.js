// Constantes
const HOURLY_RATE = 1.75;
const LUNCH_BREAK = 1; // hora
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Variables globales
let currentWeek = new Date();
let weeklyData = {};

// Funciones auxiliares
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// Manejo de datos
function saveData() {
    localStorage.setItem('weeklyData', JSON.stringify(weeklyData));
}

function loadData() {
    const data = localStorage.getItem('weeklyData');
    if (data) {
        weeklyData = JSON.parse(data);
    }
}

// Lógica principal
function addDailyRecord(event) {
    event.preventDefault();
    
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const discounts = parseFloat(document.getElementById('discounts').value) || 0;
    const extras = parseFloat(document.getElementById('extras').value) || 0;

    // Validaciones
    if (new Date(`${date} ${startTime}`) >= new Date(`${date} ${endTime}`)) {
        alert('La hora de entrada debe ser anterior a la hora de salida.');
        return;
    }

    const weekNum = getWeekNumber(new Date(date));
    if (!weeklyData[weekNum]) {
        weeklyData[weekNum] = [];
    }

    if (weeklyData[weekNum].some(record => record.date === date)) {
        alert('Ya existe un registro para esta fecha.');
        return;
    }

    // Cálculos
    const start = new Date(`${date} ${startTime}`);
    const end = new Date(`${date} ${endTime}`);
    let hours = (end - start) / 3600000;
    
    if (hours > 8) {
        hours -= LUNCH_BREAK;
    }

    const earnings = hours * HOURLY_RATE;

    weeklyData[weekNum].push({
        date,
        day: DAYS[new Date(date).getDay()],
        startTime,
        endTime,
        earnings,
        discounts,
        extras
    });

    saveData();
    updateWeeklyView();
    event.target.reset();
}

function updateWeeklyView() {
    const weekNum = getWeekNumber(currentWeek);
    const weekData = weeklyData[weekNum] || [];
    
    // Actualizar tabla de registros
    const tbody = document.getElementById('records-body');
    tbody.innerHTML = '';
    weekData.forEach((record, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${record.date}</td>
            <td>${record.day}</td>
            <td>${record.startTime}</td>
            <td>${record.endTime}</td>
            <td>$${record.earnings.toFixed(2)}</td>
            <td>$${record.discounts.toFixed(2)}</td>
            <td>$${record.extras.toFixed(2)}</td>
            <td>
                <button onclick="editRecord(${index})">Editar</button>
                <button onclick="deleteRecord(${index})">Eliminar</button>
            </td>
        `;
    });

    // Actualizar resumen semanal
    const totalEarnings = weekData.reduce((sum, record) => sum + record.earnings, 0);
    const totalDiscounts = weekData.reduce((sum, record) => sum + record.discounts, 0);
    const totalExtras = weekData.reduce((sum, record) => sum + record.extras, 0);
    const finalCash = totalEarnings - totalDiscounts + totalExtras;

    document.getElementById('summary-data').innerHTML = `
        <p>Total ganado: $${totalEarnings.toFixed(2)}</p>
        <p>Total descuentos: $${totalDiscounts.toFixed(2)}</p>
        <p>Total extras: $${totalExtras.toFixed(2)}</p>
        <p>Ganado - Descuentos: $${(totalEarnings - totalDiscounts).toFixed(2)}</p>
        <p>Ganado + Extras: $${(totalEarnings + totalExtras).toFixed(2)}</p>
        <p>Efectivo final: $${finalCash.toFixed(2)}</p>
    `;

    // Actualizar navegación de semanas
    const weekStart = getWeekStart(currentWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    document.getElementById('current-week').textContent = 
        `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;

    updateCharts();
}

function editRecord(index) {
    const weekNum = getWeekNumber(currentWeek);
    const record = weeklyData[weekNum][index];
    
    document.getElementById('date').value = record.date;
    document.getElementById('start-time').value = record.startTime;
    document.getElementById('end-time').value = record.endTime;
    document.getElementById('discounts').value = record.discounts;
    document.getElementById('extras').value = record.extras;

    weeklyData[weekNum].splice(index, 1);
    saveData();
    updateWeeklyView();
}

function deleteRecord(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
        const weekNum = getWeekNumber(currentWeek);
        weeklyData[weekNum].splice(index, 1);
        saveData();
        updateWeeklyView();
    }
}

function changeWeek(direction) {
    currentWeek.setDate(currentWeek.getDate() + direction * 7);
    updateWeeklyView();
}

function updateCharts() {
    const weekNum = getWeekNumber(currentWeek);
    const weekData = weeklyData[weekNum] || [];

    // Gráfico de ganancias semanales
    const earningsCtx = document.getElementById('weekly-earnings-chart').getContext('2d');
    new Chart(earningsCtx, {
        type: 'bar',
        data: {
            labels: weekData.map(record => record.day),
            datasets: [{
                label: 'Ganancias diarias',
                data: weekData.map(record => record.earnings),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Gráfico de descuentos y extras
    const discountsExtrasCtx = document.getElementById('discounts-extras-chart').getContext('2d');
    new Chart(discountsExtrasCtx, {
        type: 'pie',
        data: {
            labels: ['Descuentos', 'Extras'],
            datasets: [{
                data: [
                    weekData.reduce((sum, record) => sum + record.discounts, 0),
                    weekData.reduce((sum, record) => sum + record.extras, 0)
                ],
                backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)']
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Event Listeners
document.getElementById('daily-form').addEventListener('submit', addDailyRecord);
document.getElementById('prev-week').addEventListener('click', () => changeWeek(-1));
document.getElementById('next-week').addEventListener('click', () => changeWeek(1));

// Inicialización
loadData();
updateWeeklyView();