import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; 
import { provideNativeDateAdapter } from '@angular/material/core';
import { AppointmentService } from '../../services/appointment.service'; // Import your service
import { MatSnackBar } from '@angular/material/snack-bar'; // For notifications
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // For authentication
import { CommonModule } from '@angular/common'; // For common directives
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-booking-modal',
  templateUrl: './booking-modal.component.html',
  styleUrl: './booking-modal.component.css',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    FormsModule,
    MatSelectModule,
    MatIconModule,
    MatNativeDateModule,
    CommonModule,
    ReactiveFormsModule
  ],
  providers: [provideNativeDateAdapter()]
})
export class BookingModalComponent {
  modalForm: FormGroup;
  notes: string = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<BookingModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private authService: AuthService // Inject AuthService for user ID
  ) {
    console.log('BookingModalComponent constructor - data received:', this.data);
    console.log('Doctor ID from data:', this.data?.doctorId);
    console.log('Route params:', this.route.snapshot.params);
    
    this.modalForm = this.fb.group({
      date_time: ['', Validators.required],
      notes: [''] // Add notes to the FormGroup
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
  onConfirm(): void { // Remove async
    if (this.isSubmitting) return;
  
    this.isSubmitting = true;
  
    const doctorId = this.data.doctorId || this.route.snapshot.params['id'];
    console.log('onConfirm - data.doctorId:', this.data.doctorId);
    console.log('onConfirm - route params id:', this.route.snapshot.params['id']);
    console.log('onConfirm - final doctorId:', doctorId);
    
    // Check if doctorId is a valid string (MongoDB ObjectId format)
    if (!doctorId || typeof doctorId !== 'string' || doctorId.trim().length === 0) {
      console.error('Invalid doctor ID:', doctorId);
        this.snackBar.open('Invalid doctor ID. Please try again.', 'Close', {
          duration: 3000
        });
        this.isSubmitting = false;
        return;
    }
  
    const appointmentData = {
      patient_id: this.authService.getCurrentUserId() || '',
      doctor_id: doctorId,
      date_time: this.modalForm.value.date_time ? new Date(this.modalForm.value.date_time).toISOString() : '',
      notes: this.modalForm.value.notes || ''
    };
  
    this.appointmentService.createAppointment(appointmentData)
      .subscribe({
        next: (result) => {
          console.log('Appointment Result:', result);
          this.snackBar.open('Appointment booked successfully!', 'Close', {
            duration: 3000
          });
          this.dialogRef.close();
        },
        error: (error) => {
          console.error('Error creating appointment:', error);
          this.snackBar.open('Error booking appointment. Please try again.', 'Close', {
            duration: 3000
          });
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
  }
}