import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { emailValidator } from '../validators/email.validator';
import { EmailVerificationService } from '../../../services/email-verification.service';
import { MatDialog } from '@angular/material/dialog';
import { VerifyEmailComponent } from '../verify-email/verify-email.component';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon'; // Add this import

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [
    MatIconModule, // Add this import
    MatOptionModule,
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule // Add this to imports
  ]
})
export class RegisterComponent {
  registerForm!: FormGroup
  isLoading = false;
  hidePassword = true;
  acceptTerms = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private emailService: EmailVerificationService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog 
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, emailValidator()]],
      role: ['', Validators.required], // Add role form control
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    const { email, password, role } = this.registerForm.value; // Include role

    // First verify email quality
    this.emailService.verify(email!).subscribe({
      next: (isValid) => {
        if (isValid) {
          this.registerUser(email!, password!, role!); // Pass role to registerUser
        } else {
          this.showError('Invalid email domain');
          this.isLoading = false;
        }
      },
      error: () => {
        this.showError('Email verification failed');
        this.isLoading = false;
      }
    });
  }

  // Update registerUser to include role
  private registerUser(email: string, password: string, role: string): void {
    this.isLoading = true;
    
    this.authService.sendVerificationCode(email).subscribe({
      next: () => {
        this.isLoading = false;
        const dialogRef = this.dialog.open(VerifyEmailComponent, {
          width: '400px',
          data: { email }
        });

        dialogRef.afterClosed().subscribe(verified => {
          if (verified) {
            this.completeRegistration(email, password, role); // Pass role to completeRegistration
          }
        });
      },
      error: () => this.showError('Failed to send verification code')
    });
  }

  // Update completeRegistration to include role
  private completeRegistration(email: string, password: string, role: string) {
    this.authService.register(email, password, role).subscribe({
      next: () => {
        this.router.navigate(['/login']);
        this.snackBar.open('Registration successful!', 'Close', { duration: 3000 });
      },
      error: (err) => this.showError(err.error?.message || 'Registration failed')
    });
  }

  private showError(message: string): void {
    this.isLoading = false;
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}