import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../services/doctor.service';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';

@Component({
  selector: 'app-doctor-recommendations',
  templateUrl: './doctor-recommendations.component.html',
  styleUrls: ['./doctor-recommendations.component.css'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CommonModule, RouterModule]
})
export class DoctorRecommendationsComponent implements OnInit {
  doctors: any[] = [];
  analysisResults: any = null;
  isLoading = true;

  constructor(
    private doctorService: DoctorService,
    private router: Router,
    private authService: AuthService,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit() {
    // Get analysis results from session storage
    const storedResults = sessionStorage.getItem('analysisResults');
    if (storedResults) {
      this.analysisResults = JSON.parse(storedResults);
    }

    // Fetch the doctors data
    this.doctorService.getAllDoctors().subscribe({
      next: (response: any) => {
        this.doctors = response;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching doctors:', err);
        this.isLoading = false;
      }
    });
  }

  bookAppointmentWithAnalysis(doctorId: string): void {
    // Create appointment notes from analysis results
    const appointmentNotes = this.generateAppointmentNotes();
    
    // Store the analysis notes for use in booking
    sessionStorage.setItem('appointmentNotes', appointmentNotes);
    
    // Navigate to doctor consultation with the analysis data
    this.router.navigate(['/doctor-consultation', doctorId]);
  }

  private generateAppointmentNotes(): string {
    if (!this.analysisResults) return '';

    const lesionTypes: {[key: string]: string} = {
      'nv': 'Melanocytic nevus',
      'mel': 'Melanoma',
      'bkl': 'Benign keratosis-like lesion',
      'bcc': 'Basal cell carcinoma',
      'akiec': 'Actinic keratosis',
      'vasc': 'Vascular lesion',
      'df': 'Dermatofibroma'
    };

    const lesionType = lesionTypes[this.analysisResults.predicted_class] || this.analysisResults.predicted_class;
    const confidence = (this.analysisResults.confidence * 100).toFixed(1);
    const conclusion = this.analysisResults.conclusion;

    return `Skin Analysis Report:
• Lesion Type: ${lesionType}
• AI Conclusion: ${conclusion}
• Confidence: ${confidence}%
• Recommendation: ${this.analysisResults.is_benign ? 'Regular monitoring recommended' : 'Professional evaluation recommended'}

Please review this AI analysis and provide professional medical assessment.`;
  }

  goBack(): void {
    this.router.navigate(['/analyze']);
  }
}