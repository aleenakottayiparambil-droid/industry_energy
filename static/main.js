// Go to Input Page
function goToInputPage() {
    window.location.href = '/input';
}

// Form Submission (Input Page)
const batchForm = document.getElementById('batch-form');
if (batchForm) {
    batchForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const data = {
            temperature: parseFloat(document.getElementById('temp').value),
            pressure: parseFloat(document.getElementById('pressure').value),
            machine_load: parseFloat(document.getElementById('load').value),
            runtime: parseFloat(document.getElementById('runtime').value)
        };

        try {
            const res = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            sessionStorage.setItem('predictionData', JSON.stringify(result));
            window.location.href = '/predictions';
        } catch (err) {
            alert("Error getting AI predictions. Please try again.");
        }
    });
}

// Predictions Page Functions
let chartInstance = null;

function loadPredictions() {
    const dataStr = sessionStorage.getItem('predictionData');
    if (!dataStr) {
        window.location.href = '/';
        return;
    }

    const data = JSON.parse(dataStr);
    const resultsDiv = document.getElementById('results');

    resultsDiv.innerHTML = `
        <h2>Prediction Summary</h2>
        <p><strong>Energy Consumption:</strong> ${data.energy_consumption} kWh</p>
        <p><strong>Carbon Emissions:</strong> ${data.carbon_emissions} kg CO₂</p>
        <h3>Optimization Recommendations</h3>
        <ul>${data.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
    `;

    // Chart
    const ctx = document.getElementById('energyChart');
    if (ctx) {
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Energy Consumption (kWh)', 'Carbon Emissions (kg CO₂)'],
                datasets: [{
                    label: 'Batch Metrics',
                    data: [data.energy_consumption, data.carbon_emissions],
                    backgroundColor: ['#22d3ee', '#f97316']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: true } }
            }
        });
    }
}

async function sendChat() {
    const input = document.getElementById('chat-msg');
    const chatWindow = document.getElementById('chat-window');
    if (!input || !chatWindow) return;

    const message = input.value.trim();
    if (!message) return;

    chatWindow.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
    input.value = "";

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await res.json();
        chatWindow.innerHTML += `<p><strong>AI Assistant:</strong> ${data.reply}</p>`;
        chatWindow.scrollTop = chatWindow.scrollHeight;
    } catch (err) {
        chatWindow.innerHTML += `<p><strong>AI Assistant:</strong> Sorry, I couldn't respond.</p>`;
    }
}

function downloadReport() {
    const dataStr = sessionStorage.getItem('predictionData');
    if (!dataStr) return alert("No prediction data found.");
    const data = JSON.parse(dataStr);

    let text = `Industrial Energy Intelligence Report\n\n`;
    text += `Energy Consumption : ${data.energy_consumption} kWh\n`;
    text += `Carbon Emissions   : ${data.carbon_emissions} kg CO₂\n\n`;
    text += `Recommendations:\n`;
    data.recommendations.forEach((r, i) => text += `${i+1}. ${r}\n`);

    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Energy_Prediction_Report.txt';
    a.click();
}

function logout() {
    if (confirm("Logout?")) {
        sessionStorage.clear();
        window.location.href = '/';
    }
}

// Auto-load predictions when on predictions page
if (window.location.pathname === '/predictions') {
    window.onload = loadPredictions;
}