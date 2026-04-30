# Teachable Machine Model Files

Place your 3 exported Teachable Machine model files here:

- model.json
- metadata.json
- weights.bin

## How to export from Teachable Machine:

1. Go to https://teachablemachine.withgoogle.com
2. Train your image model
3. Click **Export Model**
4. Choose **TensorFlow.js** tab
5. Click **Download** (NOT "Upload to cloud")
6. Unzip the downloaded file
7. Copy all 3 files into this folder (`public/my_model/`)

The model will be accessible at: http://localhost:5173/my_model/model.json
