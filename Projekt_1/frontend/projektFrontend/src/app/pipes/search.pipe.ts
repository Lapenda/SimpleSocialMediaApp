import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../home/home.component';

@Pipe({
  name: 'search'
})
export class SearchPipe implements PipeTransform {

  transform(users: User[], searchTerm: string): User[] {
    if (!users || !searchTerm) return users;
    return users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}