import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'projektFrontend';
  
    message = '';
    
    constructor(private router: Router, private http: HttpClient) {}
    
    ngOnInit() {

      this.http.get('http://localhost:3000/').subscribe(data => {
        this.message = JSON.stringify(data);
        console.log('Data received:', data);
      }, error => {
        console.error('Error fetching data:', error);
      });

      const token = localStorage.getItem('token');
      if (token) {
        this.router.navigate(['/home']);
      } else {
        console.log('No token found, redirecting to login');
        this.router.navigate(['/login']);
      }
    }
}
