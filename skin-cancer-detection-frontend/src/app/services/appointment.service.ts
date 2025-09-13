// appointment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Appointment, AppointmentCreate } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
    private apiUrl = environment.apiUrl + "/appointments";

  constructor(private http: HttpClient) { }

  // Create a new appointment
  createAppointment(appointment: any): Observable<any> {
    console.log('Creating appointment:', appointment);
    const formData = new FormData();
    formData.append('patient_id', appointment.patient_id.toString());
    formData.append('doctor_id', appointment.doctor_id.toString());
    formData.append('date_time', appointment.date_time);
    if (appointment.notes) {
      formData.append('notes', appointment.notes);
    }
    console.log([...formData.entries()]);
    return this.http.post<any>(this.apiUrl, formData).pipe(
      catchError(error => {
        console.error('API Error:', error);
        throw error;
      })
    );
  }

  // Get appointments between a specific patient and doctor
  getPatientDoctorAppointments(patientId: string, doctorId: string): Observable<Appointment[]> {  // Changed to string
    return this.http.get<Appointment[]>(
      `${this.apiUrl}?patient_id=${patientId}&doctor_id=${doctorId}`
    );
  }

  // Get all appointments for current patient
  getPatientAppointments(patientId: string): Observable<Appointment[]> {  // Changed to string
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getDoctorAppointments(doctorId: string): Observable<Appointment[]> {  // Changed to string
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}`);
  }

  // Update an appointment
  updateAppointmentStatus(appointmentId: string, status: string) {  // Changed to string
    return this.http.patch<Appointment>(
      `${this.apiUrl}/${appointmentId}/status`,
      { status: status }  // Explicit property name
    );
  }

  // Cancel an appointment
  cancelAppointment(id: string): Observable<Appointment> {  // Changed to string
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/cancel`, {});
  }
}