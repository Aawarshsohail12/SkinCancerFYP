import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }


  completeProfile(
    userId: string,  // Changed to string
    profileData: any, 
    role: string,
    profileImage?: File
  ): Observable<any> {
    const formData = new FormData();
  
    // Append each field explicitly
    formData.append('user_name', profileData.user_name);
    if (role === 'doctor') {
      formData.append('specialty', profileData.specialty);
      formData.append('hospital', profileData.hospital);
      formData.append('years_experience', profileData.years_experience.toString());
    }
    if (role === "patient") {
      const formattedDob = new Date(profileData.dob).toISOString().split('T')[0]; 
      formData.append('dob', formattedDob);
    }
    formData.append('contact', profileData.contact);
  
    // Append the image if it exists
    if (profileImage) {
      formData.append('profile_image', profileImage, profileImage.name);
    }
    console.log([...formData.entries()]);
    return this.http.post(
      `${this.apiUrl}/complete-profile/${userId}`,
      formData,
      { params: { role } }
    );
  }
  
  
  getDoctorProfile(userId: string): Observable<any> {  // Changed to string
    return this.http.get(
        `${this.apiUrl}/doctordetails/${userId}`
    )
  }
  getPatientProfile(userId: string): Observable<any> {  // Changed to string
    return this.http.get(
        `${this.apiUrl}/patientdetails/${userId}`
    )
  }
}