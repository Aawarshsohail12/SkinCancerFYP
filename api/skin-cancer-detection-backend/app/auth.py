from datetime import datetime, timedelta
from typing import Optional, Union, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File, Form, Query, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
import random
from passlib.context import CryptContext
import os
import yagmail
from dotenv import load_dotenv

from .config import settings
from . import schemas, crud
from .database import get_collection


router = APIRouter(tags=["auth"])

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# In-memory storage for verification codes (use database in production)
verification_codes: Dict[str, Dict[str, Any]] = {}

load_dotenv()

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

@router.post("/api/ratings/set_rating", response_model=float)
async def submit_rating(
    data: schemas.DoctorRatingUpdate,
) -> float:
    try:
        print("submit rating endpoint called")
        print("Data: ", data)
        # Call the CRUD function
        updated_doctor = await crud.update_doctor_rating(
            appointment_id=data.appointment_id,
            new_rating=data.rating
        )
        
        if not updated_doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        return updated_doctor["rating"]
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


async def get_current_user(token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        print("payload: ", payload)
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await crud.get_user(email=email)
    print("user: ", user)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user = Depends(get_current_user)
):
    if not current_user["is_active"]:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def generate_verification_code(email: str) -> str:
    code = f"{random.randint(100000, 999999)}"
    expiration = datetime.now() + timedelta(minutes=10)
    verification_codes[email] = {
        "code": code,
        "expires_at": expiration,
        "verified": False
    }
    return code

async def verify_code_dependency(
    user_data: schemas.UserCreate,
):
    email = user_data.email
    record = verification_codes.get(email)
    if not record or not record["verified"]:
        raise HTTPException(status_code=400, detail="Email not verified")
    return True

@router.post("/send-verification")
async def send_verification(
    request: schemas.EmailRequest,
):
    if await crud.get_user(email=request.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    code = generate_verification_code(request.email)
    EMAIL_USER = os.getenv("EMAIL_USER")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
    yag = yagmail.SMTP(user=EMAIL_USER, password=EMAIL_PASSWORD)
    subject = "Verification Code - Skin Cancer Detection App"
    body = f"""
        Dear User,

        Your verification code for Skin Cancer Detection App is: {code}

        Please enter this code to verify your email address.

        Regards,
        Skin Cancer Detection Team
    """
    try:
        yag.send(
            to=request.email,
            subject=subject,
            contents=body
        )
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Failed to send verification email: {e}")
    print(f"Verification code for {request.email}: {code}")
    return {"message": "Verification code sent"}

@router.post("/verify-code")
async def verify_code(
    data: schemas.VerifyCodeRequest,
):
    record = verification_codes.get(data.email)
    
    if not record or datetime.now() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    
    if data.code != record["code"]:
        raise HTTPException(status_code=400, detail="Invalid code")
    
    verification_codes[data.email]["verified"] = True
    return {"verified": True}

@router.post("/register", response_model=schemas.User)
async def register(
    user_data: schemas.UserCreate,
    verified: bool = Depends(verify_code_dependency),
):
    if user_data.role not in ["doctor", "patient"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    try:
        return await crud.create_user(user=user_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/appointments")
async def create_appointment_endpoint(
    patient_id: str = Form(...),
    doctor_id: str = Form(...),
    date_time: str = Form(...),
    notes: str = Form(None),
):
    """Endpoint to create a new appointment."""
    try:
        print("create appointment endpoint called")
        # Convert date_time string to a Python datetime object
        
        parsed_datetime = datetime.fromisoformat(date_time.replace("Z", "+00:00"))

        new_appointment = await crud.create_appointment(
            schemas.AppointmentCreate(
                doctor_id=doctor_id,
                date_time=parsed_datetime,
                notes=notes
            ),
            patient_id=patient_id
        )
        print("new appointment: ", new_appointment)
        return new_appointment
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Invalid date_time format: {str(ve)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating appointment: {str(e)}")

@router.post("/complete-profile/{user_id}", response_model=Union[schemas.Doctor, schemas.Patient])
async def complete_profile(
    user_id: str,
    user_name: str = Form(None),
    specialty: str = Form(None),
    hospital: str = Form(None),
    dob: str = Form(None),
    years_experience: Optional[int] = Form(None),
    contact: str = Form(...),
    profile_image: Optional[UploadFile] = File(None),
    role: str = Query(..., regex="^(doctor|patient)$"),
):
    try:
        # Create the appropriate schema based on the role
        if role == "doctor":
            if not (specialty and hospital and years_experience is not None):
                raise HTTPException(status_code=422, detail="Missing doctor fields.")
            profile_data = schemas.ProfileCompleteDoctor(
                user_name=user_name,
                specialty=specialty,
                hospital=hospital,
                years_experience=years_experience,
                contact=contact
            )
        else:  # patient
            print("user name: ", user_name)
            profile_data = schemas.ProfileCompletePatient(
                user_name=user_name,
                dob=dob,
                contact=contact
                # Add any other patient-specific fields if needed
            )

        # Save profile
        result = await crud.complete_user_profile(
            user_id=user_id,
            profile_data=profile_data,
            role=role,
            profile_image=profile_image
        )

        # Return complete profile
        if role == "doctor":
            doctor = await crud.get_doctor_by_user_id(user_id=user_id)
            if not doctor:
                raise HTTPException(status_code=404, detail="Doctor profile not found.")
            return {**doctor, "_id": str(doctor["_id"])}
        else:
            patient = await crud.get_patient_by_user_id(user_id=user_id)
            if not patient:
                raise HTTPException(status_code=404, detail="Patient profile not found.")
            return {**patient, "_id": str(patient["_id"])}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error completing profile: {e}")

@router.patch("/appointments/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    status: str = Body(..., embed=True),  # Note the embed=True
):
    print(f"Status update received: {status}")
    return await crud.update_appointment_status(appointment_id, status)

@router.get("/api/ratings/has_rated", response_model=bool)
async def has_rated_endpoint(
    appointment_id: str = Query(..., description="The appointment ID to check"),
):
    """
    Endpoint to check if a patient has rated a specific appointment.
    Returns:
        bool: True if the appointment has been rated, False otherwise
    """
    try:
        print(f"Checking rating status for appointment: {appointment_id}")
        return await crud.has_patient_rated(appointment_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Could not check rating status. Please try again later."
        )
    
@router.get("/doctordetails/{user_id}")  # Temporarily remove response_model
async def get_doctor_profile(user_id: str, request: Request = None):
    doctor = await crud.get_doctor_by_user_id(user_id=user_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    print(f"DEBUG Backend: Raw doctor data: {doctor}")

    # Handle profile image URL - if it exists and is not empty, construct the full URL
    profile_image = doctor.get("profile_image_url", "")
    if profile_image and profile_image.strip():  # Check for non-empty string
        base_url = str(request.base_url).rstrip("/")
        # Construct the proper URL path for the static file
        doctor["profile_image_url"] = f"{base_url}/uploads/doctors/{os.path.basename(profile_image)}"
    else:
        # Set to empty string for empty/missing profile images
        doctor["profile_image_url"] = ""
    
    # Create the response data matching the Doctor schema
    response_data = {
        "id": str(doctor["_id"]),
        "user_id": doctor["user_id"],
        "user_name": doctor["user_name"],
        "specialty": doctor["specialty"],
        "hospital": doctor["hospital"],
        "years_experience": doctor["years_experience"],
        "contact": doctor["contact"],
        "rating": doctor.get("rating"),
        "profile_image_url": doctor["profile_image_url"],
        "appointments_count": doctor.get("appointments_count", 0)
    }
    
    print(f"DEBUG Backend: Final response data: {response_data}")
    
    return response_data

@router.get("/appointments/doctor/{doctor_id}")
async def get_appointments_for_doctor_endpoint(
    doctor_id: str,
):
    """Endpoint to retrieve all appointments for a specific doctor."""
    try:
        # First get the doctor by user_id to get the actual doctor _id
        doctor = await crud.get_doctor_by_user_id(user_id=doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found.")
        
        # Use the actual doctor _id to find appointments
        actual_doctor_id = str(doctor["_id"])
        appointments = await crud.get_appointments_for_doctor(actual_doctor_id)
        if not appointments:
            raise HTTPException(status_code=404, detail="No appointments found for this doctor.")
        print("appointments: ", appointments)
        return appointments
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error retrieving appointments: {str(e)}")

@router.get("/appointments/patient/{patient_id}")
async def get_appointments_for_patient_endpoint(
    patient_id: str,
):
    """Endpoint to retrieve all appointments for a specific patient."""
    try:
        appointments = await crud.get_appointments_for_patient(patient_id)
        if not appointments:
            raise HTTPException(status_code=404, detail="No appointments found for this patient.")
        print("appointments: ", appointments)
        return appointments
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error retrieving appointments: {str(e)}")
    
@router.get("/patientdetails/{user_id}")
async def get_patient_profile(user_id: str):
    patient = await crud.get_patient_by_user_id(user_id=user_id)
    print("patient: ", patient)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    return {**patient, "_id": str(patient["_id"])}

@router.get("/appointments")
async def get_appointment_status_route(
    patient_id: str, 
    doctor_id: str, 
):
    # Call the function to get the appointment status
    appointment_status = await crud.get_appointment_status(doctor_id, patient_id)
    return appointment_status

@router.get("/doctors")
async def get_all_doctors(request: Request):
    doctors = await crud.get_all_doctors()
    print("doctors: ", doctors)
    if not doctors:
        raise HTTPException(status_code=404, detail="No doctors found")

    base_url = str(request.base_url).rstrip("/")

    for doctor in doctors:
        if doctor.get("profile_image_url"):
            filename = os.path.basename(doctor["profile_image_url"])
            doctor["profile_image_url"] = f"{base_url}/{filename}"

    return doctors

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    
    user = await crud.get_user(email=form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "email": user["email"],
        "role": user["role"],
        "user_id": str(user["_id"])  # Convert ObjectId to string
    }

# Add to auth.py file
@router.get("/prediction-history", response_model=List[schemas.PredictionHistory])
async def get_prediction_history():
    """Retrieve all prediction history records."""
    try:
        predictions = await crud.get_prediction_history()
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving prediction history: {str(e)}")
    
# Add to auth.py file
@router.get("/prediction/{prediction_id}", response_model=schemas.PredictionHistory)
async def get_prediction_by_id(prediction_id: str):
    """Retrieve a specific prediction by its ID."""
    try:
        prediction = await crud.get_prediction_by_id(prediction_id)
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")
        return {**prediction, "_id": str(prediction["_id"])}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving prediction: {str(e)}")