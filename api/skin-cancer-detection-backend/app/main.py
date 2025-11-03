from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from contextlib import asynccontextmanager
import os
import logging

from app.schemas import PredictionResult
from app.models import load_model_h5, predict
from app.config import settings
from app.database import get_collection, connect_to_mongo, close_mongo_connection
from app.memory_db import init_sample_data
from app.auth import router as auth_router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

model = None

# Startup and shutdown lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to MongoDB (or fallback to memory DB)
    await connect_to_mongo()
    # Initialize sample data if using memory DB
    await init_sample_data()
    # Load ML model
    global model
    model = load_model_h5()
    logger.info("🚀 Application startup complete")
    yield
    # Close MongoDB connection
    await close_mongo_connection()
    logger.info("🛑 Application shutdown complete")

# Initialize FastAPI app
app = FastAPI(
    title=settings.api_title,
    description="API for detecting skin cancer from images using machine learning",
    version=settings.api_version,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount(
    "/uploads/doctors",
    StaticFiles(directory=os.path.join(os.getcwd(), "uploads", "doctors")),
    name="doctor_images"
)

# Include auth router
app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"message": "Skin Cancer Detection API is running"}

@app.post("/analyze", response_model=PredictionResult)
async def analyze_image(
    image: UploadFile = File(..., description="An image file"),
    user_id: str = Form(...)
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    if image.size > 10_000_000:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    try:
        # Save uploaded file
        file_path = f"static/uploads/{datetime.now().timestamp()}_{image.filename}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as buffer:
            buffer.write(await image.read())

        # Run prediction using the loaded model and correct mechanism
        prediction = predict(model, file_path)
        if 'error' in prediction:
            raise HTTPException(status_code=500, detail=prediction['error'])

        # Store in MongoDB
        collection = get_collection("prediction_history")
        await collection.insert_one({
            "user_id": user_id,
            "image_path": file_path,
            "predicted_class": prediction["predicted_class"],
            "confidence": prediction["confidence"],
            "conclusion": prediction["conclusion"],
            "description": prediction["description"],
            "predicted_at": datetime.utcnow()
        })

        return prediction

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
