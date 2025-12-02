import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DoctorProfileComponent } from './components/doctor-profile/doctor-profile.component';
import { PatientProfileComponent } from './components/patient-profile/patient-profile.component';
import { DoctorConsultationComponent } from './components/doctor-consultation/doctor-consultation.component';
import { DoctorAppointmentsCardsComponent } from './components/doctor-appointments-cards/doctor-appointments-cards.component';
import { PredictionHistoryComponent } from './components/prediction-history/prediction-history';
import { DoctorRecommendationsComponent } from './components/doctor-recommendations/doctor-recommendations.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'analyze', 
    pathMatch: 'full' 
  },
  { 
    path: 'analyze', 
    component: ImageUploadComponent,
    canActivate: [AuthGuard] 
  },
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'register', 
    component: RegisterComponent 
  },
  {
    path: 'doctor-profile',
    component: DoctorProfileComponent
  },
  {
    path: 'patient-profile',
    component: PatientProfileComponent
  },
  {
    path: 'doctor-consultation/:id',
    component: DoctorConsultationComponent
  },  
  {
    path: 'doctor-appointments-cards',
    component: DoctorAppointmentsCardsComponent
  },
  {
    path: 'prediction-history',
    component: PredictionHistoryComponent
  },
  {
    path: 'doctor-recommendations',
    component: DoctorRecommendationsComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: '**', 
    redirectTo: 'login' 
  },
];