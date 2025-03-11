import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  registerForm: FormGroup;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_repeated: ['', [Validators.required]],
      role: ['']
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  register() {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.password_repeated) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    const formData = this.registerForm.value;
    this.apiService.register(formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        alert('Registration successful. You can now log in.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Registration failed:', error);
        if (error.status === 400 && error.error?.message === 'Username already exists') {
          alert('The username is already taken. Please choose a different one.');
        } else {
          alert('Registration failed. Please try again.');
        }
      }
    });
  }
}
