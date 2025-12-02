import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../services/doctor.service';
import { RouterModule, Router } from '@angular/router';

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

  constructor(private router: Router) {}

  ngOnInit() {
    // No need to fetch doctors here anymore
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

  goToDoctorRecommendations(): void {
    // Store the analysis results for use in doctor recommendations
    sessionStorage.setItem('analysisResults', JSON.stringify(this.results));
    this.router.navigate(['/doctor-recommendations']);
  }
}
