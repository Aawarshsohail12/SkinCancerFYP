from tensorflow.keras.models import load_model

# Use a raw string for the file path
model = load_model(r'F:\skin-cancer-detection\api\skin-cancer-detection-backend\models\skin_cancer_model.h5')
model.summary()
print("Input shape:", model.input_shape)
print("Output shape:", model.output_shape)