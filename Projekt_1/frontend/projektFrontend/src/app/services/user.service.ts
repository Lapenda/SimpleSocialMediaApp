import { Injectable } from '@angular/core';
import { User } from '../home/home.component';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [];

  setUsers(users: User[]) {
    this.users = users;
  }

  getUsers(): User[] {
    return this.users;
  }
}
