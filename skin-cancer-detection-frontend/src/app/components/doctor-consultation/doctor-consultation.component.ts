import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { AppointmentService } from '../../services/appointment.service';
import { RatingService } from '../../services/rating.service';
import { MatDialog } from '@angular/material/dialog';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { RatingModalComponent } from '../rating-modal/rating-modal.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatError } from '@angular/material/form-field';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-doctor-consultation',
  standalone: true,
  templateUrl: './doctor-consultation.component.html',
  styleUrls: ['./doctor-consultation.component.css'],
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatError,
    RouterModule
  ]
})
export class DoctorConsultationComponent implements OnInit {
  doctor: any;
  currentPatientId!: string;
  existingAppointment: any | null = null;
  isRatingRequired: boolean = false;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private profileService: ProfileService,
    private appointmentService: AppointmentService,
    private ratingService: RatingService,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const doctorId = this.route.snapshot.params['id'];
      this.loadDoctorProfile(doctorId);
      this.currentPatientId = this.authService.getCurrentUserId() || '';
      
      if (this.currentPatientId) {
        this.loadAppointments(doctorId);
      }
    });
  }

  getButtonText(): string {

    switch (this.buttonState) {
      case 'book':
        return 'Book Appointment';
      case 'pending':
        return 'Request Pending';
      case 'rate':
        return 'Rate Doctor (Required)';
      default:
        return 'Book Appointment';
    }
  }

  private loadDoctorProfile(doctorId: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    console.log('Loading doctor profile for ID:', doctorId);
    this.profileService.getDoctorProfile(doctorId).subscribe({
      next: (doctor) => {
        console.log('Doctor profile received:', doctor);
        console.log('Doctor profile JSON:', JSON.stringify(doctor, null, 2));
        console.log('Doctor ID field:', doctor?.id);
        console.log('Doctor _id field:', doctor?._id);
        console.log('Doctor user_id field:', doctor?.user_id);
        this.doctor = doctor;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading doctor profile:', err);
        this.isLoading = false;
        this.errorMessage = 'Failed to load doctor profile. Please try again.';
      }
    });
  }

  private loadAppointments(doctorId: string): void {
    this.isLoading = true;
    this.appointmentService.getPatientDoctorAppointments(
      this.currentPatientId, 
      doctorId
    ).subscribe({
      next: (appointments) => {
        this.existingAppointment = appointments.length > 0 ? appointments[0] : null;
        this.checkRatingRequirement();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading appointments:', err);
        this.isLoading = false;
        this.errorMessage = 'Failed to load appointment details.';
      }
    });
  }


  private checkRatingRequirement(): void {
    if (this.existingAppointment?.status === 'rate') {
      this.ratingService.hasRated(this.existingAppointment.appointment_id).subscribe({
        next: (hasRated) => this.isRatingRequired = hasRated,
        error: (err) => {
          console.error('Error checking rating status:', err);
          this.errorMessage = 'Failed to check rating status.';
        }
      });
    }
  }

  openBookingDialog(): void {
    if (this.isRatingRequired) {
      this.openRatingDialog();
      return;
    }

    console.log('Opening booking dialog. Doctor object:', this.doctor);
    console.log('Doctor ID:', this.doctor?.id);
    console.log('Doctor user_id:', this.doctor?.user_id);

    // Use user_id if id is not available
    const doctorId = this.doctor?.id || this.doctor?.user_id;
    console.log('Final doctor ID to use:', doctorId);

    const dialogRef = this.dialog.open(BookingModalComponent, {
      width: '400px',
      data: { doctorId: doctorId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createAppointment(result);
      }
    });
  }

  private createAppointment(appointmentData: any): void {
    this.isLoading = true;
    const doctorId = this.doctor?.id || this.doctor?.user_id;
    const newAppointment = {
      ...appointmentData,
      patient_id: this.currentPatientId,
      doctor_id: doctorId
    };

    this.appointmentService.createAppointment(newAppointment).subscribe({
      next: (appointment) => {
        this.existingAppointment = appointment;
        this.isRatingRequired = false;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error creating appointment:', err);
        this.isLoading = false;
        this.errorMessage = 'Failed to create appointment. Please try again.';
      }
    });
  }

  openRatingDialog(): void {
    const dialogRef = this.dialog.open(RatingModalComponent, {
      width: '300px',
      data: { doctorId: this.doctor.id, appointmentId: this.existingAppointment?.appointment_id }
    });

    dialogRef.afterClosed().subscribe((rating: number) => {
      if (rating) {
        this.submitRating(rating);
      }
    });
  }

  private submitRating(ratingValue: number): void {
    this.isLoading = true;
    const appointment_id = this.existingAppointment!.appointment_id;

    this.ratingService.submitRating(appointment_id,ratingValue).subscribe({
      next: () => {
        this.isRatingRequired = false;
        this.loadAppointments(this.doctor.id);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error submitting rating:', err);
        this.isLoading = false;
        this.errorMessage = 'Failed to submit rating. Please try again.';
      }
    });
  }

  get buttonState(): string {
    if (!this.existingAppointment) return 'book';
    if (this.existingAppointment.status === 'pending') return 'pending';
    if (this.isRatingRequired) return 'rate';
    return 'book';
  }
}