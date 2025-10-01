from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- MongoDB Connection ---
try:
    MONGO_URI = os.getenv("MONGO_URI")
    if not MONGO_URI:
        raise ValueError("MONGO_URI not found in environment variables.")
    
    client = MongoClient(MONGO_URI)
    db = client.medical_risk_predictor # Database name
    collection = db.assessments # Collection name
    # Test the connection
    client.admin.command('ping')
    print("Successfully connected to MongoDB!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    client = None


# --- Load the saved ML models ---
try:
    # Use joblib to load the models directly
    scaler = joblib.load('models/scaler.pkl')
    stacking_model = joblib.load('models/stacking_model.pkl') # FIXED: Renamed 'model' to 'stacking_model'
    print("Successfully loaded ML models.")
except FileNotFoundError as e:
    print(f"Error loading model files: {e}")
    scaler = None
    stacking_model = None

@app.route('/')
def home():
    return "Medical Risk Prediction API is running!"

@app.route('/predict', methods=['POST'])
def predict():
    # This check now correctly references 'stacking_model'
    if not client or not scaler or not stacking_model:
        return jsonify({'error': 'Server configuration error. Check connections and model files.'}), 500

    try:
        data = request.get_json()
        
        # --- 1. Save complete patient data to MongoDB ---
        patient_document = {
            **data['patientInfo'],
            'predictionInput': data['modelInputs'],
            'createdAt': datetime.utcnow()
        }
        collection.insert_one(patient_document)
        print("Successfully saved patient data to MongoDB.")

        # --- 2. Prepare data for ML model prediction ---
        model_features_order = [
            'age', 'bmi', 'gestational_age', 'previous_c_section', 
            'previous_miscarriages', 'previous_preterm_birth', 
            'chronic_hypertension', 'diabetes', 'gestational_diabetes', 
            'preeclampsia_history', 'multiple_pregnancy', 'smoking', 
            'alcohol_use', 'family_history', 'hb_level', 'urine_protein', 
            'blood_glucose', 'Systolic_BP', 'Diastolic_BP'
        ]
        
        model_inputs = data['modelInputs']
        features = [model_inputs[feature] for feature in model_features_order]
        
        final_features = np.array(features).reshape(1, -1)
        scaled_features = scaler.transform(final_features)
        
        # --- 3. Make prediction ---
        prediction = stacking_model.predict(scaled_features)
        prediction_proba = stacking_model.predict_proba(scaled_features)

        output = prediction[0]
        confidence = prediction_proba[0][output]
        
        # CHANGED: New risk level mapping
        risk_mapping = {0: "Low Risk", 1: "Moderate Risk", 2: "High Risk"}
        risk_level = risk_mapping.get(output, "Unknown") # Safely get the risk level
        
        result_text = f"The model predicts a status of **{risk_level}** with **{confidence:.2%}** confidence."
        
        return jsonify({
            'prediction': int(output), 
            'confidence': float(confidence),
            'prediction_text': result_text,
            'risk_level': risk_level
        })

    except KeyError as e:
        return jsonify({'error': f'Missing feature in request: {e}'}), 400
    except Exception as e:
        print(f"An error occurred during prediction: {e}")
        return jsonify({'error': 'An unexpected error occurred during prediction.'}), 500


if __name__ == '__main__':
    app.run(debug=True)

