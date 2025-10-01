import { useState } from 'react';

const useFormData = () => {
  const [formData, setFormData] = useState({
    // Basic Information
    age: '',
    bmi: '',
    gestationalAge: '',
    
    // Medical History
    previousCSection: false,
    previousPreterm: false,
    chronicHypertension: false,
    diabetes: false,
    gestationalDiabetes: false,
    preeclampsiaHistory: false,
    multiplePregnancy: false,
    smokingUse: false,
    alcoholUse: false,
    familyHistoryHTN: false,
    previousMiscarriages: '',
    
    // Vital Signs & Lab Values
    systolicBP: '',
    diastolicBP: '',
    hemoglobin: '',
    urineProtein: '',
    bloodGlucose: '',
    
    // Healthcare Provider Info
    doctorName: '',
    doctorEmail: ''
  });

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleBoolean = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return {
    formData,
    updateField,
    toggleBoolean,
    setFormData
  };
};

export default useFormData;