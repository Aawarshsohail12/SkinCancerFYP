import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

interface LoginResponse {
  access_token: string;
  token_type: string;
  email: string;
  role: string;
  user_id: string;  // Changed to string for MongoDB ObjectId
}

interface VerificationResponse {
  verified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userEmailSubject = new BehaviorSubject<string | null>(null);
  private userRoleSubject = new BehaviorSubject<string | null>(null);
  private userIdSubject = new BehaviorSubject<string | null>(null);  // Changed to string
  private token: string | null = null;
  private isBrowser: boolean;
  private pendingRegistration: { email: string, password: string, role: string } | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initializeAuthState();
  }

  // Observable properties
  get isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get userEmail$(): Observable<string | null> {
    return this.userEmailSubject.asObservable();
  }

  get userRole$(): Observable<string | null> {
    return this.userRoleSubject.asObservable();
  }

  get userId$(): Observable<string | null> {  // Changed to string
    return this.userIdSubject.asObservable();
  }

  private initializeAuthState(): void {
    if (this.isBrowser) {
      this.token = localStorage.getItem('access_token');
      const email = localStorage.getItem('user_email');
      const role = localStorage.getItem('user_role');
      const userId = localStorage.getItem('user_id');

      this.isAuthenticatedSubject.next(!!this.token);
      this.userEmailSubject.next(email);
      this.userRoleSubject.next(role);
      this.userIdSubject.next(userId);  // No need to parse as int
    }
  }

  private setAuthState(token: string, email: string, role: string, userId: string): void {  // Changed to string
    this.token = token;
    if (this.isBrowser) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_id', userId);  // Store as string
    }
    this.isAuthenticatedSubject.next(true);
    this.userEmailSubject.next(email);
    this.userRoleSubject.next(role);
    this.userIdSubject.next(userId);
  }

  private clearAuthState(): void {
    this.token = null;
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
    }
    this.isAuthenticatedSubject.next(false);
    this.userEmailSubject.next(null);
    this.userRoleSubject.next(null);
    this.userIdSubject.next(null);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    console.log(this.apiUrl)
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    return this.http.post<LoginResponse>(`${this.apiUrl}/token`, formData).pipe(
      tap(response => {
        this.setAuthState(
          response.access_token,
          response.email,
          response.role,
          response.user_id
        );
      })
    );
  }

  sendVerificationCode(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-verification`, { email });
  }

  verifyCode(email: string, code: string): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(
      `${this.apiUrl}/verify-code`,
      { email, code }
    );
  }

  register(email: string, password: string, role: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, {
      email,
      password,
      role
    });
  }  

  setPendingRegistration(email: string, password: string, role: string): void {
    this.pendingRegistration = { email, password, role };
  }

  getPendingRegistration(): { email: string, password: string, role: string } | null {
    return this.pendingRegistration;
  }

  clearPendingRegistration(): void {
    this.pendingRegistration = null;
  }

  logout(): void {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token;
  }

  getCurrentUserEmail(): string | null {
    return this.userEmailSubject.value;
  }

  getCurrentUserRole(): string | null {
    return this.userRoleSubject.value;
  }

  getCurrentUserId(): string | null {  // Changed to string
    return this.userIdSubject.value;
  }
}