import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../services/api.service';
import { User } from '../home/home.component';
import { FormsModule } from '@angular/forms';
import { SearchPipe } from '../pipes/search.pipe';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-admin-pane',
  imports: [CommonModule, FormsModule, SearchPipe],
  providers: [DatePipe],
  templateUrl: './admin-pane.component.html',
  styleUrl: './admin-pane.component.css'
})
export class AdminPaneComponent implements OnInit {
  users: User[] = [];
  searchTerm = '';
  selectedUser: User | null = null;
  registrationData: { date: Date, count: number }[] = [];
  postsByDay: { date: Date, count: number }[] = [];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    this.fetchAllUsers();
    this.fetchRegistrationData();
    this.fetchPostsByDay();
  }

  returnToHome() {
    this.router.navigate(['/home']);
  }

  // korisnici
  fetchAllUsers() {
    this.apiService.fetchAllUsers().subscribe({
      next: (data: User[]) => {
        this.users = data;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
      }
    });
  }

  onUserSelect(user: User) {
    this.selectedUser = user;
  }

  deleteUser(user: User) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.apiService.deleteAccount(user).subscribe({
        next: () => {
          alert('User deleted successfully.');
          this.fetchAllUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Failed to delete user. Please try again.');
        }
      });
    }
  }

  toggleAdminRole(user: User) {
    const newRole = !user.role;
    this.apiService.updateUserRole(user.userId, newRole).subscribe({
      next: () => {
        user.role = newRole;
        alert(`User role updated to ${newRole ? 'Admin' : 'User'}.`);
      },
      error: (error) => {
        console.error('Error updating user role:', error);
        alert('Failed to update user role. Please try again.');
      }
    });
  }

  // grafovi
  fetchRegistrationData() {
    this.apiService.getRegistrationStats().subscribe({
      next: (data: any) => {
        if (data && Array.isArray(data)) {
          this.registrationData = data.map(item => {
  
              if (item._id !== null) {
                const [day, month, year] = item._id.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                if (isNaN(date.getTime())) {
                  console.warn('Invalid date encountered:', item._id);
                  return {
                    date: new Date(),
                    count: item.count || 0
                  };
                }
                return {
                  date: date,
                  count: item.count
                };
              }else {
              console.warn('Encountered null _id in registration data:', item);
              return {
                date: new Date(),
                count: item.count || 0
              };
            }
          });
          this.createRegistrationChart(); 
        } else {
          console.error('Registration data is not in the expected format:', data);
        }
      },
      error: (error) => {
        console.error('Failed to fetch registration data:', error);
        alert('Failed to load registration statistics. Please try again later.');
      }
    });
  }

  fetchPostsByDay() {
    this.apiService.getPostStats().subscribe({
      next: (data: any) => {
        if (data && Array.isArray(data)) {
          this.postsByDay = data.map(item => {
              if (item._id !== null) {
                const [day, month, year] = item._id.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                if (isNaN(date.getTime())) {
                  console.warn('Invalid date encountered:', item._id);
                  return {
                    date: new Date(),
                    count: item.count || 0
                  };
                }
                return {
                  date: date,
                  count: item.count
                };
              } else {
              console.warn('Encountered null _id in registration data:', item);
              return {
                date: new Date(),
                count: item.count || 0
              };
            }
          });
          this.createPostsChart();
        }else {
          console.error('Posts data is not in the expected format:', data);
        }
      },
      error: (error) => {
        console.error('Failed to fetch post data:', error);
        alert('Failed to load post statistics. Please try again later.');
      }
    });
  }

  createRegistrationChart() {
    const ctx = document.getElementById('registrationChart') as HTMLCanvasElement;
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.registrationData.map(d => this.datePipe.transform(d.date, 'dd-MM-yyyy')),
          datasets: [{
            label: 'User Registrations By Day',
            data: this.registrationData.map(d => d.count)
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  createPostsChart() {
    const ctx = document.getElementById('postsChart') as HTMLCanvasElement;
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.postsByDay.map(d => this.datePipe.transform(d.date, 'dd-MM-yyyy')),
          datasets: [{
            label: 'Posts By Day',
            data: this.postsByDay.map(d => d.count),
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            }
          }
        }
      });
    }
  }


  getUserFromLocalStorage(): User | null {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        return JSON.parse(userString);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return null;
      }
    }
    return null;
  }

}