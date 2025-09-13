from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from passlib.context import CryptContext
from app.database import get_collection
from app import schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -------------------------
# USER FUNCTIONS
# -------------------------
async def get_user(email: str):
    users = get_collection("users")
    
    # Check if we're using memory database
    if hasattr(users, 'find_one') and callable(getattr(users, 'find_one')):
        # This is a MongoDB collection
        return await users.find_one({"email": email})
    else:
        # This is memory database
        from app.memory_db import MemoryDB
        memory_db = MemoryDB()
        return await memory_db.find_one("users", {"email": email})


async def create_user(user: schemas.UserCreate):
    users = get_collection("users")
    existing_user = await users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    
    new_user = {
        "email": user.email,
        "hashed_password": hashed_password,
        "role": user.role,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    result = await users.insert_one(new_user)
    return {**new_user, "_id": str(result.inserted_id)}


async def get_user_by_id(user_id: str):
    users = get_collection("users")
    try:
        return await users.find_one({"_id": ObjectId(user_id)})
    except:
        return None


# -------------------------
# DOCTOR FUNCTIONS
# -------------------------
async def create_doctor(doctor: schemas.DoctorCreate, user_id: str):
    doctors = get_collection("doctors")
    doc_data = doctor.dict()
    doc_data["user_id"] = user_id
    doc_data["created_at"] = datetime.utcnow()
    result = await doctors.insert_one(doc_data)
    return {**doc_data, "_id": str(result.inserted_id)}


async def get_doctor_by_user_id(user_id: str):
    doctors = get_collection("doctors")
    return await doctors.find_one({"user_id": user_id})


async def get_all_doctors():
    doctors = get_collection("doctors")
    cursor = doctors.find({})
    return [dict(item, _id=str(item["_id"])) async for item in cursor]


async def update_doctor_rating(appointment_id: str, new_rating: float):
    # First get the appointment to find the doctor_id
    appointments = get_collection("appointments")
    appointment = await appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise ValueError("Appointment not found")
    
    doctor_id = appointment["doctor_id"]
    
    # Update doctor rating
    doctors = get_collection("doctors")
    result = await doctors.update_one(
        {"_id": ObjectId(doctor_id)},
        {"$set": {"rating": new_rating}}
    )
    
    if result.modified_count == 0:
        raise ValueError("Doctor not found")
    
    # Return updated doctor
    updated_doctor = await doctors.find_one({"_id": ObjectId(doctor_id)})
    return {**updated_doctor, "_id": str(updated_doctor["_id"])}


# -------------------------
# PATIENT FUNCTIONS
# -------------------------
async def create_patient(patient: schemas.PatientCreate, user_id: str):
    patients = get_collection("patients")
    patient_data = patient.dict()
    patient_data["user_id"] = user_id
    patient_data["created_at"] = datetime.utcnow()
    result = await patients.insert_one(patient_data)
    return {**patient_data, "_id": str(result.inserted_id)}


async def get_patient_by_user_id(user_id: str):
    patients = get_collection("patients")
    return await patients.find_one({"user_id": user_id})


# -------------------------
# APPOINTMENT FUNCTIONS
# -------------------------
async def create_appointment(appointment: schemas.AppointmentCreate, patient_id: str):
    appointments = get_collection("appointments")
    app_data = appointment.dict()
    app_data["patient_id"] = patient_id
    app_data["status"] = "pending"
    app_data["created_at"] = datetime.utcnow()
    result = await appointments.insert_one(app_data)
    return {**app_data, "_id": str(result.inserted_id)}


async def get_appointments_by_doctor_id(doctor_id: str):
    appointments = get_collection("appointments")
    cursor = appointments.find({"doctor_id": doctor_id})
    return [dict(item, _id=str(item["_id"])) async for item in cursor]


async def get_appointments_by_patient_id(patient_id: str):
    appointments = get_collection("appointments")
    cursor = appointments.find({"patient_id": patient_id})
    return [dict(item, _id=str(item["_id"])) async for item in cursor]


async def get_appointments_for_doctor(doctor_id: str):
    appointments = get_collection("appointments")
    cursor = appointments.find({"doctor_id": doctor_id})
    return [dict(item, _id=str(item["_id"])) async for item in cursor]


async def get_appointments_for_patient(patient_id: str):
    appointments = get_collection("appointments")
    cursor = appointments.find({"patient_id": patient_id})
    return [dict(item, _id=str(item["_id"])) async for item in cursor]


async def update_appointment_status(appointment_id: str, status: str):
    appointments = get_collection("appointments")
    result = await appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise ValueError("Appointment not found")
    return {"status": status}


async def get_appointment_status(doctor_id: str, patient_id: str):
    appointments = get_collection("appointments")
    appointment = await appointments.find_one({
        "doctor_id": doctor_id,
        "patient_id": patient_id
    })
    if appointment:
        return {"status": appointment["status"]}
    return {"status": "not_found"}


async def has_patient_rated(appointment_id: str):
    appointments = get_collection("appointments")
    appointment = await appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise ValueError("Appointment not found")
    return appointment.get("has_rated", False)


# -------------------------
# PREDICTION HISTORY FUNCTIONS
# -------------------------
async def create_prediction_history(
    user_id: str,
    image_path: str,
    predicted_class: str,
    confidence: float,
    conclusion: str,
    description: str
):
    predictions = get_collection("prediction_history")
    entry = {
        "user_id": user_id,
        "image_path": image_path,
        "predicted_class": predicted_class,
        "predicted_at": datetime.utcnow(),
        "confidence": confidence,
        "conclusion": conclusion,
        "description": description
    }
    result = await predictions.insert_one(entry)
    return {**entry, "_id": str(result.inserted_id)}


async def get_prediction_history_by_user_id(user_id: str):
    predictions = get_collection("prediction_history")
    cursor = predictions.find({"user_id": user_id}).sort("predicted_at", -1)
    return [dict(item, _id=str(item["_id"])) async for item in cursor]


async def get_prediction_by_id(prediction_id: str):
    predictions = get_collection("prediction_history")
    try:
        return await predictions.find_one({"_id": ObjectId(prediction_id)})
    except:
        return None


async def get_prediction_history():
    predictions = get_collection("prediction_history")
    cursor = predictions.find({}).sort("predicted_at", -1)
    return [dict(item, _id=str(item["_id"])) async for item in cursor]


# -------------------------
# PROFILE COMPLETION
# -------------------------
async def complete_user_profile(user_id: str, profile_data, role: str, profile_image=None):
    if role == "doctor":
        # Handle doctor profile image
        if profile_image:
            # Save image logic here
            profile_image_url = f"uploads/doctors/doctor_{user_id}_{datetime.now().timestamp()}.jpg"
            # Save the file
            with open(profile_image_url, "wb") as buffer:
                buffer.write(await profile_image.read())
        else:
            profile_image_url = ""
        
        # Create doctor profile
        doctor_data = profile_data.dict()
        doctor_data["profile_image_url"] = profile_image_url
        return await create_doctor(schemas.DoctorCreate(**doctor_data), user_id)
    else:
        # Create patient profile
        return await create_patient(profile_data, user_id)
