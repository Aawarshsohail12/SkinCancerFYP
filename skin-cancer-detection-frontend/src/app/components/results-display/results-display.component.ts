import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../services/doctor.service'; // Import your doctor service
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-results-display',
  templateUrl: './results-display.component.html',
  styleUrls: ['./results-display.component.css'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CommonModule, RouterModule]
})
export class ResultsDisplayComponent implements OnInit {
  @Input() results: any;
  @Output() newUpload = new EventEmitter<void>();
  doctors: any[] = [];  // Store the doctor data

  constructor(private doctorService: DoctorService) {}

  ngOnInit() {
    // Fetch the doctors data when the component initializes
    this.doctorService.getAllDoctors().subscribe((response: any) => {
      console.log("response",response)
      this.doctors = response;  // Assuming the API response is an array of doctors
    });
  }

  get lesionType(): string {
    const types: {[key: string]: string} = {
      'nv': 'Melanocytic nevus',
      'mel': 'Melanoma',
      'bkl': 'Benign keratosis-like lesion',
      'bcc': 'Basal cell carcinoma',
      'akiec': 'Actinic keratosis',
      'vasc': 'Vascular lesion',
      'df': 'Dermatofibroma'
    };
    return types[this.results?.predicted_class] || this.results?.predicted_class || 'Unknown';
  }

  uploadNew(): void {
    this.newUpload.emit();
  }

  logDoctorId(doctor: any): void {
    console.log('Doctor object:', doctor);
    console.log('Doctor ID:', doctor._id);
  }
}
