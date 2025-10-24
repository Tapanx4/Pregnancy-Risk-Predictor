import React, { useState } from 'react';
import { Heart, User, Activity, FlaskConical, Stethoscope, Check, X, Loader2, FileText, ArrowLeft } from 'lucide-react';

// --- Reusable Components ---
const CheckboxItem = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
        checked ? 'bg-teal-600' : 'bg-gray-300'
      }`}
      aria-checked={checked}
    >
      <span className="sr-only">Toggle {label}</span>
      <span
        className={`inline-flex items-center justify-center w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      >
        {checked ? <Check className="w-3 h-3 text-teal-600" /> : <X className="w-3 h-3 text-gray-500" />}
      </span>
    </button>
  </div>
);

const initialFormData = {
    patientName: '', age: '', bmi: '', gestationalAge: '', previousCSection: false, previousPreterm: false, chronicHypertension: false, diabetes: false, gestationalDiabetes: false, preeclampsiaHistory: false, multiplePregnancy: false, smokingUse: false, alcoholUse: false, familyHistoryHTN: false, previousMiscarriages: '', systolicBP: '', diastolicBP: '', hemoglobin: '', urineProtein: '', bloodGlucose: '', doctorName: '', doctorEmail: ''
};

// --- Prediction Result Page Component ---
const PredictionResultPage = ({ resultData, onBack }) => {
    const { prediction_text, risk_level } = resultData.prediction;
    const { patientName, age, bmi, gestationalAge, doctorName, systolicBP, diastolicBP, hemoglobin, bloodGlucose } = resultData.patientInfo;
    
    // Define border and text colors based on risk level
    let riskBorderColor = "border-gray-500";
    let riskTextColor = "text-gray-600";
    if (risk_level === "High Risk") {
        riskBorderColor = "border-red-500";
        riskTextColor = "text-red-600";
    } else if (risk_level === "Moderate Risk") {
        riskBorderColor = "border-yellow-500";
        riskTextColor = "text-yellow-600";
    } else if (risk_level === "Low Risk") {
        riskBorderColor = "border-green-500";
        riskTextColor = "text-green-600";
    }

    return (
        <div className="bg-white shadow-lg rounded-b-xl animate-fade-in">
            <header className="bg-gray-50 p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-teal-600" />
                        <h2 className="text-xl font-bold text-gray-800">Prediction Report</h2>
                    </div>
                    <button onClick={onBack} className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span>New Assessment</span>
                    </button>
                </div>
            </header>

            <main className="p-6 md:p-8">
                <div className={`p-6 border-l-4 ${riskBorderColor} bg-gray-50 rounded-lg mb-8`}>
                    <h3 className="text-lg font-semibold text-gray-800">Overall Assessment</h3>
                    <p className={`text-2xl font-bold mt-2 ${riskTextColor}`}>{risk_level}</p>
                    <p className="text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: prediction_text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-700 border-b pb-2">Patient Information</h4>
                        <div className="text-sm space-y-3">
                            <p><strong>Name:</strong> {patientName || 'N/A'}</p>
                            <p><strong>Age:</strong> {age} years</p>
                            <p><strong>BMI:</strong> {bmi} kg/m²</p>
                            <p><strong>Gestational Age:</strong> {gestationalAge} weeks</p>
                            <p><strong>Referring Physician:</strong> {doctorName || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                         <h4 className="text-md font-semibold text-gray-700 border-b pb-2">Key Vitals at Assessment</h4>
                         <div className="text-sm space-y-3">
                            <p><strong>Blood Pressure:</strong> {systolicBP} / {diastolicBP} mmHg</p>
                            <p><strong>Hemoglobin:</strong> {hemoglobin} g/dL</p>
                            <p><strong>Blood Glucose:</strong> {bloodGlucose} mg/dL</p>
                         </div>
                    </div>
                </div>

                <div className="mt-8 text-xs text-gray-500 text-center">
                    <p>This is an AI-generated prediction based on the provided data and should not be used as a sole diagnostic tool. Please consult with a qualified healthcare professional for medical advice.</p>
                </div>
            </main>
        </div>
    );
};

// --- Main Application Component ---
const MedicalRiskPredictor = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [predictionResult, setPredictionResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [view, setView] = useState('form'); // 'form' or 'result'

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCheckboxChange = (field) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleNewAssessment = () => {
        setFormData(initialFormData);
        setPredictionResult(null);
        setErrorMessage('');
        setView('form');
    };

    const generatePrediction = async () => {
        setIsLoading(true);
        setErrorMessage('');

        const payload = {
            patientInfo: formData,
            modelInputs: {
                'age': Number(formData.age), 'bmi': Number(formData.bmi), 'gestational_age': Number(formData.gestationalAge), 'previous_c_section': formData.previousCSection ? 1 : 0, 'previous_miscarriages': Number(formData.previousMiscarriages), 'previous_preterm_birth': formData.previousPreterm ? 1 : 0, 'chronic_hypertension': formData.chronicHypertension ? 1 : 0, 'diabetes': formData.diabetes ? 1 : 0, 'gestational_diabetes': formData.gestationalDiabetes ? 1 : 0, 'preeclampsia_history': formData.preeclampsiaHistory ? 1 : 0, 'multiple_pregnancy': formData.multiplePregnancy ? 1 : 0, 'smoking': formData.smokingUse ? 1 : 0, 'alcohol_use': formData.alcoholUse ? 1 : 0, 'family_history': formData.familyHistoryHTN ? 1 : 0, 'hb_level': Number(formData.hemoglobin), 'urine_protein': Number(formData.urineProtein), 'blood_glucose': Number(formData.bloodGlucose), 'Systolic_BP': Number(formData.systolicBP), 'Diastolic_BP': Number(formData.diastolicBP),
            }
        };

        try {
            const apiUrl = process.env.REACT_APP_API_URL;
            const response = await fetch(`${apiUrl}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Prediction request failed');
            }
            const result = await response.json();
            setPredictionResult(result);
            setView('result');
        } catch (error) {
            console.error("Error calling prediction API:", error);
            setErrorMessage(`Prediction failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="bg-white rounded-t-xl shadow-lg p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center shadow-md">
                            <Heart className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Medical Risk Predictor</h1>
                            <p className="text-sm text-gray-600">AI-Powered Maternal Health Assessment</p>
                        </div>
                    </div>
                </header>
                
                {view === 'form' ? (
                    <main className="bg-white shadow-lg rounded-b-xl">
                        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-6">
                            <div className="flex items-center space-x-3">
                                <Activity className="w-6 h-6" />
                                <div>
                                    <h2 className="text-lg font-semibold">Maternal Health Risk Assessment</h2>
                                    <p className="text-sm text-teal-100">Complete patient information for AI-powered risk analysis</p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); generatePrediction(); }}>
                            <section className="p-6 border-b border-gray-200">
                                 <div className="flex items-center space-x-3 mb-5">
                                    <User className="w-5 h-5 text-teal-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Patient Name</label>
                                        <input type="text" placeholder="Enter full name" value={formData.patientName} onChange={(e) => handleInputChange('patientName', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Age (years)</label>
                                        <input type="number" placeholder="e.g., 32" value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">BMI (kg/m²)</label>
                                        <input type="number" step="0.1" placeholder="e.g., 24.5" value={formData.bmi} onChange={(e) => handleInputChange('bmi', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Gestational Age (weeks)</label>
                                        <input type="number" placeholder="e.g., 28" value={formData.gestationalAge} onChange={(e) => handleInputChange('gestationalAge', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"/>
                                    </div>
                                </div>
                            </section>

                            <section className="p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3 mb-5">
                                    <Activity className="w-5 h-5 text-teal-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Medical History</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    <CheckboxItem label="Previous C-Section" checked={formData.previousCSection} onChange={() => handleCheckboxChange('previousCSection')} />
                                    <CheckboxItem label="Previous Preterm Birth" checked={formData.previousPreterm} onChange={() => handleCheckboxChange('previousPreterm')} />
                                    <CheckboxItem label="Chronic Hypertension" checked={formData.chronicHypertension} onChange={() => handleCheckboxChange('chronicHypertension')} />
                                    <CheckboxItem label="Diabetes" checked={formData.diabetes} onChange={() => handleCheckboxChange('diabetes')} />
                                    <CheckboxItem label="Gestational Diabetes" checked={formData.gestationalDiabetes} onChange={() => handleCheckboxChange('gestationalDiabetes')} />
                                    <CheckboxItem label="Preeclampsia History" checked={formData.preeclampsiaHistory} onChange={() => handleCheckboxChange('preeclampsiaHistory')} />
                                    <CheckboxItem label="Multiple Pregnancy" checked={formData.multiplePregnancy} onChange={() => handleCheckboxChange('multiplePregnancy')} />
                                    <CheckboxItem label="Smoking Use" checked={formData.smokingUse} onChange={() => handleCheckboxChange('smokingUse')} />
                                    <CheckboxItem label="Alcohol Use" checked={formData.alcoholUse} onChange={() => handleCheckboxChange('alcoholUse')} />
                                    <CheckboxItem label="Family History (HTN/DM)" checked={formData.familyHistoryHTN} onChange={() => handleCheckboxChange('familyHistoryHTN')} />
                                </div>
                                <div className="max-w-xs">
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Previous Miscarriages</label>
                                    <input type="number" placeholder="Enter count" value={formData.previousMiscarriages} onChange={(e) => handleInputChange('previousMiscarriages', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"/>
                                </div>
                            </section>
                            
                             <section className="p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3 mb-5">
                                    <FlaskConical className="w-5 h-5 text-pink-500" />
                                    <h3 className="text-lg font-semibold text-gray-800">Vital Signs & Laboratory Values</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Systolic BP (mmHg)</label>
                                        <input type="number" placeholder="e.g., 120" value={formData.systolicBP} onChange={(e) => handleInputChange('systolicBP', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Diastolic BP (mmHg)</label>
                                        <input type="number" placeholder="e.g., 80" value={formData.diastolicBP} onChange={(e) => handleInputChange('diastolicBP', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Hemoglobin (g/dL)</label>
                                        <input type="number" step="0.1" placeholder="e.g., 13.5" value={formData.hemoglobin} onChange={(e) => handleInputChange('hemoglobin', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Urine Protein (mg/dL)</label>
                                        <input type="number" placeholder="e.g., 150" value={formData.urineProtein} onChange={(e) => handleInputChange('urineProtein', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Blood Glucose (mg/dL)</label>
                                        <input type="number" placeholder="e.g., 90" value={formData.bloodGlucose} onChange={(e) => handleInputChange('bloodGlucose', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                                    </div>
                                </div>
                            </section>

                             <section className="p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3 mb-5">
                                    <Stethoscope className="w-5 h-5 text-emerald-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Healthcare Provider Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Doctor's Name</label>
                                        <input type="text" placeholder="Enter doctor's full name" value={formData.doctorName} onChange={(e) => handleInputChange('doctorName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Doctor's Email</label>
                                        <input type="email" placeholder="doctor@hospital.com" value={formData.doctorEmail} onChange={(e) => handleInputChange('doctorEmail', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                </div>
                            </section>

                            <section className="p-6">
                                <div className="flex justify-center">
                                    <button type="submit" className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                                      {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Analyzing...</span></>) : (<><Activity className="w-5 h-5" /><span>Generate AI Prediction</span></>)}
                                    </button>
                                </div>
                                {errorMessage && <p className="text-center text-red-500 mt-4">{errorMessage}</p>}
                            </section>
                        </form>
                    </main>
                ) : (
                    <PredictionResultPage 
                        resultData={{ prediction: predictionResult, patientInfo: formData }} 
                        onBack={handleNewAssessment} 
                    />
                )}
            </div>
        </div>
    );
};

export default MedicalRiskPredictor;

