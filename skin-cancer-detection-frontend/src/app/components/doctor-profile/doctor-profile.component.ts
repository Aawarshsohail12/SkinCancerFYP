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

import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-doctor-profile',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './doctor-profile.component.html',
  styleUrls: ['./doctor-profile.component.css']
})
export class DoctorProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  profileForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  selectedImage!: File;

  specialties = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
    'General Practice',
    'Plastic Surgery',
    'Surgical Oncology'
  ];

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      user_name: ['', Validators.required],
      specialty: ['', Validators.required],
      hospital: ['', Validators.required],
      years_experience: [0, [Validators.required, Validators.min(0)]],
      contact: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }

  ngOnInit() {
    this.checkExistingProfile();
  }

  private checkExistingProfile() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.profileService.getDoctorProfile(userId).subscribe(profile => {
        console.log('Doctor profile response:', profile);
        if (profile) {
          this.profileForm.patchValue(profile);
          if (profile.profile_image_url) {
            this.imagePreview = profile.profile_image_url;
          }
        }
      });
    }
  }

  getFormProgress(): number {
    const controls = this.profileForm.controls;
    const totalFields = Object.keys(controls).length;
    const filledFields = Object.keys(controls).filter(key => {
      const control = controls[key];
      return control.value && control.value.toString().trim() !== '';
    }).length;
    
    return Math.round((filledFields / totalFields) * 100);
  }

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files![0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      this.errorMessage = 'Only JPG or PNG images are allowed';
      return;
    }

    if (file.size > 2097152) { // 2MB
      this.errorMessage = 'Image size must be less than 2MB';
      return;
    }

    this.selectedImage = file;
    this.errorMessage = null;

    // Create image preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.imagePreview = null;
    this.selectedImage = null!;
    this.fileInput.nativeElement.value = '';
    this.profileForm.markAsDirty();
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
      specialty: this.profileForm.value.specialty,
      hospital: this.profileForm.value.hospital,
      years_experience: this.profileForm.value.years_experience,
      contact: this.profileForm.value.contact
    };
  
    // Call the service
    this.profileService.completeProfile(
      userId,
      profileData,
      'doctor',
      this.selectedImage
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

  // Control getters with more descriptive names
  get specialtyControl() { return this.profileForm.get('specialty'); }
  get hospitalControl() { return this.profileForm.get('hospital'); }
  get yearsExperienceControl() { return this.profileForm.get('years_experience'); }
  get contactControl() { return this.profileForm.get('contact'); }
  get userNameControl() { return this.profileForm.get('user_name'); }

  // Keep the original getters for backward compatibility
  get user_name() { return this.userNameControl; }
  get specialty() { return this.specialtyControl; }
  get hospital() { return this.hospitalControl; }
  get years_experience() { return this.yearsExperienceControl; }
  get contact() { return this.contactControl; }
}