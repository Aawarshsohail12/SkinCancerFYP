from typing import Annotated, Optional, List
from pydantic import BaseModel, confloat, Field
from datetime import datetime, date

# =======================
# Prediction Schemas
# =======================
class PredictionResult(BaseModel):
    predicted_class: str
    confidence: Annotated[float, confloat(ge=0, le=1)]
    conclusion: str = ""
    description: str = ""

    model_config = {
        "json_schema_extra": {
            "example": {
                "predicted_class": "Malignant",
                "confidence": 0.92,
                "conclusion": "Benign lesion detected",
                "description": "Some description"
            }
        }
    }


# =======================
# Email & Verification
# =======================
# Use string for email for now to avoid EmailStr validation issues
class EmailRequest(BaseModel):
    email: str

class VerifyCodeRequest(BaseModel):
    email: str
    code: str


# =======================
# User Schemas
# =======================
class UserBase(BaseModel):
    email: str
    role: str  # "doctor" | "patient" | "admin"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(alias="_id")
    is_active: bool
    created_at: datetime

    class Config:
        populate_by_name = True


# =======================
# Token Schemas
# =======================
class Token(BaseModel):
    access_token: str
    email: str
    role: str
    user_id: str

class TokenData(BaseModel):
    email: Optional[str] = None


# =======================
# Doctor Schemas
# =======================
class DoctorBase(BaseModel):
    user_name: str
    specialty: str
    hospital: str
    years_experience: int
    contact: str
    rating: Optional[float] = None
    profile_image_url: str
    appointments_count: int = 0

class DoctorCreate(DoctorBase):
    pass

class DoctorRatingUpdate(BaseModel):
    appointment_id: str
    rating: float

class Doctor(DoctorBase):
    id: str = Field(alias="_id")
    user_id: str

    class Config:
        populate_by_name = True


# =======================
# Patient Schemas
# =======================
class PatientBase(BaseModel):
    user_name: str
    dob: date
    contact: str

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: str = Field(alias="_id")
    user_id: str

    class Config:
        populate_by_name = True


# =======================
# Appointment Schemas
# =======================
class AppointmentBase(BaseModel):
    doctor_id: str
    date_time: datetime
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentCreateRequest(BaseModel):
    patient_id: str
    doctor_id: str
    date_time: datetime
    notes: Optional[str] = None

class Appointment(AppointmentBase):
    id: str = Field(alias="_id")
    patient_id: str
    status: str
    doctor: Optional[Doctor] = None
    patient: Optional[Patient] = None

    class Config:
        populate_by_name = True


# =======================
# Profile Completion
# =======================
class ProfileCompleteDoctor(BaseModel):
    user_name: str
    specialty: str
    hospital: str
    years_experience: int
    contact: str

class ProfileCompletePatient(BaseModel):
    user_name: str
    dob: str  # Changed to string for form data
    contact: str


# =======================
# Prediction History
# =======================
class PredictionHistory(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    image_path: str
    predicted_class: str
    predicted_at: datetime
    confidence: float
    conclusion: str
    description: str

    class Config:
        populate_by_name = True
