from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app)

# ================= LOAD ENV VARIABLES =================
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Safety check (prevents crash if .env missing)
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

# ================= GOOGLE GEMINI =================
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')
# =======================================================


# ================= AI ENERGY CALCULATION =================
def calculate_predictions(temp, pressure, load, runtime):
    base_power = 500

    energy = (load / 100) * runtime * base_power * \
             (1 + 0.01 * (temp - 25)) * (1 + 0.005 * pressure)

    energy = round(energy, 2)
    carbon = round(energy * 0.45, 2)

    recommendations = []

    if temp > 30:
        recommendations.append("Reduce temperature by 5°C to save ~8% energy")

    if load > 80:
        recommendations.append("Optimize machine load scheduling")

    if carbon > 1000:
        recommendations.append("Consider renewable energy integration")

    if not recommendations:
        recommendations.append("Excellent parameters — maintain current operations")

    return {
        "energy_consumption": energy,
        "carbon_emissions": carbon,
        "recommendations": recommendations
    }


# ================= ROUTES =================

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/input')
def input_page():
    return render_template('input.html')


@app.route('/predictions')
def predictions():
    return render_template('predictions.html')


@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json

    temp = float(data.get('temperature'))
    pressure = float(data.get('pressure'))
    load = float(data.get('machine_load'))
    runtime = float(data.get('runtime'))

    result = calculate_predictions(temp, pressure, load, runtime)
    return jsonify(result)


# ================= GEMINI CHATBOT =================

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')

    try:
        response = model.generate_content(user_message)
        return jsonify({"reply": response.text})
    except Exception as e:
        print("Gemini Error:", str(e))
        return jsonify({"reply": "AI service temporarily unavailable"})


# ================= RUN SERVER =================

if __name__ == '__main__':
    app.run(debug=True)