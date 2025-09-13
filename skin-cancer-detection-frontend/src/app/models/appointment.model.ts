// appointment.model.ts
export interface AppointmentBase {
    patient_id: string;
    doctor_id: string;
    date_time: string;
    notes?: string;
  }
  
  export interface AppointmentCreate extends AppointmentBase {
    // Additional fields if needed
  }
  
  export interface Appointment extends AppointmentBase {
    _id: string;  // MongoDB ObjectId as string
    patient_id: string;
    status: 'pending' | 'book' | 'rate' | 'cancel';
    doctor: Doctor;
    patient: Patient;
    prediction_id?: string;
  }
  
  export interface Doctor {
    id: string;
    user_name: string;
    specialty: string;
    hospital: string;
    years_experience: number;
    contact: string;
    rating?: number;
    profile_image_url: string;
    email?: string; // Added from Users table
  }
  
  export interface Patient {
    id: string;
    user_name: string;
    // Add other patient fields as needed
  }