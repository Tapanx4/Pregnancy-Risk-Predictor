# 1. Install packages
!pip install xgboost lightgbm imbalanced-learn joblib

import pandas as pd
import numpy as np
from google.colab import drive
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, precision_score, recall_score, log_loss
from imblearn.over_sampling import SMOTE
import lightgbm as lgb
import xgboost as xgb
import joblib

# 2. Mount drive and load dataset
drive.mount('/content/drive')
file_path = '/content/drive/MyDrive/cleaned_maternaldataset2.0.csv'
df = pd.read_csv(file_path)

print("Dataset loaded:", df.shape)

# 3. Encode target
mapping = {'low': 0, 'moderate': 1, 'high': 2}
df['risk_level_encoded'] = df['risk_level'].map(mapping)

# 4. Features/target
num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
exclude = ['risk_level_encoded', 'risk_level']
features = [col for col in num_cols if col not in exclude]
X = df[features].fillna(df[features].mean())
y = df['risk_level_encoded']

# 5. Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

# 6. Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 7. Apply SMOTE
sm = SMOTE(random_state=42)
X_train_sm, y_train_sm = sm.fit_resample(X_train_scaled, y_train)

# 8. Define base models for stacking
base_models = [
    ('lr', LogisticRegression(max_iter=1000, random_state=42)),
    ('ann', MLPClassifier(hidden_layer_sizes=(100,50), max_iter=500, random_state=42)),
    ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
    ('xgb', xgb.XGBClassifier(random_state=42, eval_metric='mlogloss')),
    ('lgbm', lgb.LGBMClassifier(random_state=42, verbose=-1))
]

meta = LogisticRegression(max_iter=1000, random_state=42)

# 9. Stacking ensemble
stacking_model = StackingClassifier(
    estimators=base_models,
    final_estimator=meta,
    cv=5,
    n_jobs=-1
)

# 10. Train model
print("\nTraining Stacking Ensemble...")
stacking_model.fit(X_train_sm, y_train_sm)

# 11. Evaluate model
y_pred = stacking_model.predict(X_test_scaled)
y_proba = stacking_model.predict_proba(X_test_scaled)

metrics = {
    'Accuracy': accuracy_score(y_test, y_pred),
    'AUC-ROC': roc_auc_score(y_test, y_proba, multi_class='ovr', average='weighted'),
    'F1-Score (Weighted)': f1_score(y_test, y_pred, average='weighted'),
    'Precision (Weighted)': precision_score(y_test, y_pred, average='weighted'),
    'Recall (Weighted)': recall_score(y_test, y_pred, average='weighted'),
    'Log Loss': log_loss(y_test, y_proba)
}

print("\n=== STACKING ENSEMBLE RESULTS ===")
for k,v in metrics.items():
    print(f"{k}: {v:.4f}")

# 12. Save model and scaler to Drive
model_path = '/content/drive/MyDrive/stacking_model.pkl'
scaler_path = '/content/drive/MyDrive/scaler.pkl'

joblib.dump(stacking_model, model_path)
joblib.dump(scaler, scaler_path)

print(f"\nModel saved to: {model_path}")
print(f"Scaler saved to: {scaler_path}")
