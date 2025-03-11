import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  loginForm: FormGroup;

  errorMessage = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
      this.loginForm = this.fb.group({
        username: ['', [Validators.required]],
        password: ['', [Validators.required]]
      });
  }

  get f() {
    return this.loginForm.controls;
  }

  login() {

    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    const formData = this.loginForm.value;

    this.apiService.login(formData).subscribe({
      next: (response) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            alert('Login successful.');
            console.log('Login successful.');
            this.router.navigate(['/home']);
          } else {
            console.error('Login response did not contain user data');
            alert('Login failed. No user data received.');
          }
        } else {
          console.error('Login response did not contain a token');
          alert('Login failed. No token received.');
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
      }
    });
  }
}
