import { Pipe, PipeTransform } from '@angular/core';
import { Conversation } from '../inbox/inbox.component';

@Pipe({
  name: 'orderByLastMessage',
  standalone: true
})
export class OrderByLastMessagePipe implements PipeTransform {
  transform(conversations: Conversation[], order: 'asc' | 'desc' = 'desc'): Conversation[] {
    return conversations.sort((a, b) => {
      const timeA = new Date(a.lastMessage.timestamp).getTime();
      const timeB = new Date(b.lastMessage.timestamp).getTime();
      return order === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }
}
