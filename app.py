from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from google import genai
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# ================= LOAD ENV =================
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

# ================= GEMINI CLIENT =================
client = genai.Client(api_key=GEMINI_API_KEY)

# ================= AI CALCULATION =================
def calculate_predictions(temp, pressure, load, runtime):
    base_power = 500

    energy = (load / 100) * runtime * base_power * \
             (1 + 0.01 * (temp - 25)) * (1 + 0.005 * pressure)

    energy = round(energy, 2)
    carbon = round(energy * 0.45, 2)

    # 💰 Cost
    cost = round(energy * 8, 2)

    # 🧠 Efficiency
    efficiency = max(0, 100 - (energy / 10))

    # 🌍 Carbon level
    if carbon < 300:
        carbon_level = "Low"
    elif carbon < 700:
        carbon_level = "Medium"
    else:
        carbon_level = "High"

    # 🔋 Savings
    savings = round(max(5, (100 - efficiency) * 0.2), 2)

    # 🌱 Sustainability
    sustainability = max(0, 100 - carbon / 20)

    recommendations = []

    if temp > 30:
        recommendations.append("Reduce temperature by 5°C to save energy")

    if load > 80:
        recommendations.append("Optimize machine load scheduling")

    if carbon > 1000:
        recommendations.append("Consider renewable energy integration")

    if not recommendations:
        recommendations.append("Excellent parameters — maintain current operations")

    return {
        "energy_consumption": energy,
        "carbon_emissions": carbon,
        "cost_estimation": cost,
        "efficiency_score": round(efficiency, 2),
        "carbon_level": carbon_level,
        "savings_potential": savings,
        "sustainability_score": round(sustainability, 2),
        "recommendations": recommendations
    }

# ================= ROUTES =================

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/input")
def input_page():
    return render_template("input.html")

@app.route("/predictions")
def predictions():
    return render_template("predictions.html")

# ================= PREDICT API =================
@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.json

    temp = float(data.get("temperature"))
    pressure = float(data.get("pressure"))
    load = float(data.get("machine_load"))
    runtime = float(data.get("runtime"))

    result = calculate_predictions(temp, pressure, load, runtime)
    return jsonify(result)

# ================= CHATBOT =================
@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message")

        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=user_message
        )

        return jsonify({"reply": response.text})

    except Exception as e:
        print("ERROR:", repr(e))
        return jsonify({"reply": "AI error: check API key or quota"})

# ================= OPTIONAL MODEL DEBUG =================
@app.route("/models")
def list_models():
    try:
        models = genai.list_models()
        return {"models": [m.name for m in models]}
    except Exception as e:
        return {"error": str(e)}

# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True)