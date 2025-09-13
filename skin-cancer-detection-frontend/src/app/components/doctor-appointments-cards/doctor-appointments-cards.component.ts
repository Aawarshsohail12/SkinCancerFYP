import { OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { Component, Input } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { PredictionService } from '../../services/prediction.service';
import { Appointment } from '../../models/appointment.model';
import { PredictionHistory } from '../../services/prediction.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Observable, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-doctor-appointments-cards',
  templateUrl: './doctor-appointments-cards.component.html',
  styleUrls: ['./doctor-appointments-cards.component.css'],
  standalone: true,
  imports: [CommonModule, MatIconModule]
})
export class DoctorAppointmentsCardsComponent implements OnInit, OnDestroy, AfterViewInit {
  appointments: Appointment[] = [];
  userRole$: Observable<string | null>;
  showModal = false;
  currentPrediction: PredictionHistory | null = null;
  currentPredictionId: string | null = null;  // Changed to string
  isLoading = false;
  error: string | null = null;
  baseUrl = environment.apiUrl;
  
  @ViewChild('modalContainer') modalContainer!: ElementRef;
  private isDragging = false;
  private initialX = 0;
  private initialY = 0;
  private currentX = 0;
  private currentY = 0;
  
  constructor(
    private appointmentService: AppointmentService,
    private predictionService: PredictionService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private renderer: Renderer2
  ) {
    this.userRole$ = this.authService.userRole$;
  }

  ngOnInit(): void {
    this.fetchAppointments();
    
    // Listen for window resize to adjust modal if needed
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  ngAfterViewInit() {
    // We'll set up drag functionality here after view initialization
    this.setupDraggableModal();
  }

  fetchAppointments(): void {
    const userId = this.authService.getCurrentUserId() || '';
    this.authService.userRole$.pipe(take(1)).subscribe(role => {
      if (role === 'doctor') {
        this.appointmentService.getDoctorAppointments(userId).subscribe((data) => {
          this.appointments = data;
        });
      } else if (role === 'patient') {
        this.appointmentService.getPatientAppointments(userId).subscribe((data) => {
          this.appointments = data;
        });
      }
    });
  }

  confirmAppointment(appointmentId: string): void {  // Changed to string
    this.appointmentService.updateAppointmentStatus(appointmentId, "book").subscribe(() => {
      this.fetchAppointments(); // Refresh the appointments after confirming
    });
  }

  cancelAppointment(appointmentId: string): void {  // Changed to string
    this.appointmentService.updateAppointmentStatus(appointmentId, "cancel").subscribe(() => {
      this.fetchAppointments();
    });
  }
  
  // Add this new method to set up draggable functionality
  setupDraggableModal() {
    if (this.showModal && this.modalContainer) {
      const modalHeader = this.modalContainer.nativeElement.querySelector('.modal-header');
      
      // If the modal is already visible
      if (modalHeader) {
        this.initDragListeners(modalHeader);
      }
    }
  }
  
  initDragListeners(modalHeader: HTMLElement) {
    // Mouse down event to start dragging
    this.renderer.listen(modalHeader, 'mousedown', (event: MouseEvent) => {
      if (event.target === modalHeader || (event.target as HTMLElement).closest('.modal-header')) {
        this.isDragging = true;
        this.initialX = event.clientX;
        this.initialY = event.clientY;
        
        // Get current transform or initialize to center
        const transform = this.modalContainer.nativeElement.style.transform;
        const match = transform.match(/translate\((\-?\d+)px, (\-?\d+)px\)/);
        this.currentX = match ? parseInt(match[1], 10) : 0;
        this.currentY = match ? parseInt(match[2], 10) : 0;
        
        // Add grabbing cursor to body during drag
        document.body.style.cursor = 'grabbing';
      }
    });
    
    // Mouse move event to track dragging
    this.renderer.listen(document, 'mousemove', (event: MouseEvent) => {
      if (this.isDragging) {
        const dx = event.clientX - this.initialX;
        const dy = event.clientY - this.initialY;
        
        const newX = this.currentX + dx;
        const newY = this.currentY + dy;
        
        // Apply the new transform
        this.renderer.setStyle(
          this.modalContainer.nativeElement, 
          'transform', 
          `translate(${newX}px, ${newY}px)`
        );
      }
    });
    
    // Mouse up event to stop dragging
    this.renderer.listen(document, 'mouseup', () => {
      this.isDragging = false;
      document.body.style.cursor = '';
    });
  }
  
  // Replace your existing openPredictionModal method:
  openPredictionModal(predictionId: string): void {  // Changed to string
    this.showModal = true;
    this.isLoading = true;
    this.error = null;
    this.currentPrediction = null;
    this.currentPredictionId = predictionId;
    
    // Reset scroll position variables
    this.initialX = 0;
    this.initialY = 0;
    this.currentX = 0;
    this.currentY = 0;
    
    // Lock body scroll without affecting position
    document.body.style.overflow = 'hidden';
    
    // Force the browser to recalculate layout before setting transform
    setTimeout(() => {
      if (this.modalContainer) {
        // Reset the transform to ensure it starts centered
        this.renderer.setStyle(this.modalContainer.nativeElement, 'transform', 'translate(0px, 0px)');
        
        // Set up drag listeners after modal is visible
        this.setupDraggableModal();
      }
    }, 0);
    
    // Check and adjust modal size
    this.checkModalSize();
    
    this.predictionService.getPredictionById(predictionId).subscribe({
      next: (data) => {
        this.currentPrediction = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = "Failed to load prediction results. Please try again.";
        this.isLoading = false;
      }
    });
  }

  // Replace your existing closeModal method:
  closeModal(event: MouseEvent): void {
    // Only close if clicking the overlay or the close button
    if (
      (event.target as HTMLElement).classList.contains('modal-overlay') || 
      (event.target as HTMLElement).closest('.close-button')
    ) {
      this.showModal = false;
      this.currentPrediction = null;
      
      // Unlock body scroll
      document.body.style.overflow = '';
    }
  }

  // Replace your existing ngOnDestroy method:
  ngOnDestroy(): void {
    if (this.showModal) {
      // Restore scrolling
      document.body.style.overflow = '';
    }
    
    // Remove resize event listener
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
  
  getPredictionImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Extract the filename from the path
    const filename = imagePath.split('/').pop();
    
    // Use the correct path to the images directory
    return `${this.baseUrl}/static/uploads/${filename}`;
  }
  
  getStatusClass(conclusion: string): string {
    if (conclusion.includes('Benign')) {
      return 'benign';
    } else if (conclusion.includes('malignancy')) {
      return 'malignant';
    } else {
      return 'uncertain';
    }
  }
  
  // Add this method to your component
  checkModalSize(): void {
    // Ensure modal fits within viewport
    setTimeout(() => {
      if (this.modalContainer && this.modalContainer.nativeElement) {
        const modalEl = this.modalContainer.nativeElement;
        const viewportHeight = window.innerHeight;
        const modalHeight = modalEl.offsetHeight;
        
        // If modal is too tall, adjust max-height
        if (modalHeight > viewportHeight * 0.85) {
          this.renderer.setStyle(modalEl, 'max-height', '85vh');
        }
      }
    }, 100);
  }
  
  // Add this method
  onWindowResize(): void {
    if (this.showModal) {
      this.checkModalSize();
    }
  }
}