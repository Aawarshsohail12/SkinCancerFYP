import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; 


import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css']
})
export class PatientProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  profileForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      user_name: ['', Validators.required],
      dob: ['', Validators.required],
      contact: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }

  ngOnInit() {
    this.checkExistingProfile();
  }

  private checkExistingProfile() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.profileService.getPatientProfile(userId).subscribe(profile => {
        if (profile) {
          this.profileForm.patchValue(profile);
        }
      });
    }
  }

  getFormProgress(): number {
    const totalFields = Object.keys(this.profileForm.controls).length;
    const filledFields = Object.values(this.profileForm.controls).filter(control => 
      control.value && control.value.toString().trim() !== ''
    ).length;
    return Math.round((filledFields / totalFields) * 100);
  }

  onSubmit() {
    if (this.profileForm.invalid || this.isSubmitting) {
      return;
    }
  
    this.isSubmitting = true;
    this.errorMessage = null;
  
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
  
    // Prepare the profile data
    const profileData = {
      user_name: this.profileForm.value.user_name,
      dob: this.profileForm.value.dob,
      contact: this.profileForm.value.contact
    };
  
    // Call the service
    this.profileService.completeProfile(
      userId,
      profileData,
      'patient',
    ).subscribe({
      next: (response) => {
        this.router.navigate(['/analyze']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.detail || 'Failed to save profile. Please try again.';
        if (err.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }


  get contactControl() { return this.profileForm.get('contact'); }
  get userNameControl() { return this.profileForm.get('user_name'); }
  get dobControl() { return this.profileForm.get('dob');}

  // Keep the original getters for backward compatibility
  get user_name() { return this.userNameControl; }
  get contact() { return this.contactControl; }
  get dob() { return this.dobControl; }
}