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
    <h2>📊 Prediction Summary</h2>

    <table class="results-table">
        <tr>
            <th>Parameter</th>
            <th>Value</th>
        </tr>

        <tr>
            <td>Energy Consumption</td>
            <td>${data.energy_consumption} kWh</td>
        </tr>

        <tr>
            <td>Carbon Emissions</td>
            <td>${data.carbon_emissions} kg CO₂</td>
        </tr>

        <tr>
            <td>Cost Estimation</td>
            <td>₹${data.cost_estimation}</td>
        </tr>

        <tr>
            <td>Efficiency Score</td>
            <td>${data.efficiency_score}/100</td>
        </tr>

        <tr>
            <td>Carbon Level</td>
            <td>${data.carbon_level}</td>
        </tr>

        <tr>
            <td>Savings Potential</td>
            <td>${data.savings_potential}%</td>
        </tr>

        <tr>
            <td>Sustainability Score</td>
            <td>${data.sustainability_score}/100</td>
        </tr>
    </table>

    <h3>⚙ Optimization Recommendations</h3>
    <ul>
        ${data.recommendations.map(r => `<li>${r}</li>`).join('')}
    </ul>
`;

    // Chart
    const ctx = document.getElementById('energyChart');

    if (ctx) {
        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [
                    'Energy (kWh)',
                    'Carbon (kg CO₂)',
                    'Cost (₹)'
                ],
                datasets: [{
                    label: 'Industrial Metrics',
                    data: [
                        data.energy_consumption,
                        data.carbon_emissions,
                        data.cost_estimation
                    ],
                    backgroundColor: ['#22d3ee', '#f97316', '#a3e635']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true }
                }
            }
        });
    }
}

// ================= CHATBOT =================
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

// ================= DOWNLOAD REPORT =================
function downloadReport() {
    const dataStr = sessionStorage.getItem('predictionData');
    if (!dataStr) return alert("No prediction data found.");

    const data = JSON.parse(dataStr);

    let text = `Industrial Energy Intelligence Report\n\n`;

    text += `Energy Consumption: ${data.energy_consumption} kWh\n`;
    text += `Carbon Emissions: ${data.carbon_emissions} kg CO₂\n`;
    text += `Cost: ₹${data.cost_estimation}\n`;
    text += `Efficiency: ${data.efficiency_score}/100\n`;
    text += `Carbon Level: ${data.carbon_level}\n`;
    text += `Savings: ${data.savings_potential}%\n`;
    text += `Sustainability: ${data.sustainability_score}/100\n\n`;

    text += `Recommendations:\n`;
    data.recommendations.forEach((r, i) => {
        text += `${i + 1}. ${r}\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Energy_Report.txt';
    a.click();
}

// ================= BACK=================
function goBack() {
    window.location.href = '/input';   // or '/'
}

// Auto-load predictions page
if (window.location.pathname === '/predictions') {
    window.onload = loadPredictions;
}