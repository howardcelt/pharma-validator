/* Pharma GMP Validator - Dashboard JS */

let statusChart, complianceChart;

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    loadStats();
    loadBatches();
    initCharts();
});

function updateClock() {
    document.getElementById('clock').textContent = new Date().toLocaleTimeString();
}

// Load stats
async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        document.getElementById('statTotal').textContent = data.total_batches;
        document.getElementById('statApproved').textContent = data.approved;
        document.getElementById('statRejected').textContent = data.rejected;
        document.getElementById('statDeviations').textContent = data.open_deviations;
        document.getElementById('statCompliance').textContent = data.compliance_rate + '%';
    } catch (e) { console.error('Stats error:', e); }
}

// Load batches
async function loadBatches() {
    try {
        const res = await fetch('/api/batches');
        const data = await res.json();
        const tbody = document.getElementById('batchTableBody');

        if (!data.batches || data.batches.length === 0) {
            tbody.innerHTML = '<tr class="empty"><td colspan="8">No batches found. Create one or generate demo data.</td></tr>';
            return;
        }

        tbody.innerHTML = data.batches.map(b => {
            const statusClass = 'status-' + (b.status || 'progress').toLowerCase().replace(' ', '-');
            const devCount = b.data && b.data.deviations ? b.data.deviations.length : 0;
            return `
                <tr>
                    <td><strong>${b.batch_id}</strong></td>
                    <td>${b.product_name}</td>
                    <td>${b.strength}</td>
                    <td>${b.current_stage}</td>
                    <td><span class="status-badge ${statusClass}">${b.status}</span></td>
                    <td>${devCount}</td>
                    <td>${new Date(b.created_at).toLocaleDateString()}</td>
                    <td>
                        <a href="/batch/${b.batch_id}" class="btn btn-secondary" style="padding:6px 12px;font-size:12px;">View</a>
                        <a href="/ebr/${b.batch_id}" class="btn btn-secondary" style="padding:6px 12px;font-size:12px;">EBR</a>
                    </td>
                </tr>
            `;
        }).join('');

        updateCharts(data.batches);
    } catch (e) { console.error('Batches error:', e); }
}

// Create batch
async function createBatch() {
    const product = prompt('Product name:', 'Paracetamol 500mg');
    if (!product) return;

    try {
        const res = await fetch('/api/batch/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product, strength: '500mg', dosage_form: 'Tablet', batch_size: 100000 })
        });
        const data = await res.json();
        if (data.success) {
            alert('Batch created: ' + data.batch_id);
            loadBatches();
            loadStats();
        }
    } catch (e) { alert('Error creating batch'); }
}

// Generate demo
async function generateDemo() {
    try {
        const res = await fetch('/api/demo/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: 5 })
        });
        const data = await res.json();
        if (data.success) {
            alert(`Generated ${data.count} demo batches`);
            loadBatches();
            loadStats();
        }
    } catch (e) { alert('Error generating demo'); }
}

// Charts
function initCharts() {
    const ctx1 = document.getElementById('statusChart').getContext('2d');
    const ctx2 = document.getElementById('complianceChart').getContext('2d');

    Chart.defaults.color = '#9fa8da';
    Chart.defaults.borderColor = '#283593';

    statusChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Rejected', 'In Progress', 'Deviation'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#00c853', '#ff1744', '#00b0ff', '#ffd600'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
        }
    });

    complianceChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Compliance %',
                data: [98, 95, 97, 99],
                backgroundColor: '#2962ff',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { min: 80, max: 100, grid: { color: '#283593' } } },
            plugins: { legend: { display: false } }
        }
    });
}

function updateCharts(batches) {
    if (!statusChart) return;
    const counts = { 'Approved': 0, 'Rejected': 0, 'In Progress': 0, 'Deviation': 0 };
    batches.forEach(b => {
        const s = b.status || 'In Progress';
        if (counts[s] !== undefined) counts[s]++;
    });
    statusChart.data.datasets[0].data = [counts['Approved'], counts['Rejected'], counts['In Progress'], counts['Deviation']];
    statusChart.update();
}
