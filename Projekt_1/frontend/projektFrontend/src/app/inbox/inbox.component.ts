import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderByLastMessagePipe } from '../pipes/order-by-last-message.pipe';
import { UserService } from '../services/user.service';
import { User } from '../home/home.component';
import { SearchPipe } from '../pipes/search.pipe';
import { ApiService } from '../services/api.service';

export interface Message {
  _id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  seen: boolean;
}

export interface Conversation {
  user: string;
  lastMessage: Message;
}

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderByLastMessagePipe, SearchPipe],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit {
  conversations: Conversation[] = [];
  selectedConversation: string = '';
  messages: Message[] = [];
  newMessageContent = '';
  users: User[] = [];
  profileViewEnabled = false;
  private orderByLastMessagePipe = new OrderByLastMessagePipe();
  searchTerm: string = '';

  constructor(private http: HttpClient, private router: Router, private userService: UserService, private apiService: ApiService) {
    this.users = this.userService.getUsers();
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    this.fetchConversations();
  }

  getUserFromLocalStorage(): any {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }

  startNewConversation(friend: string) {
    this.selectedConversation = friend;
    this.messages = [];
  }

  returnToHomePage() {
    this.router.navigate(['/home']);
  }

  fetchConversations() {
    const user = this.getUserFromLocalStorage();
    if (user) {
      this.apiService.fetchConversations(user.username).subscribe({
        next: (conversations) => {
          const convMap = new Map<string, Conversation>();
          conversations.forEach((message: Message) => {
            const otherUser = message.from === user.username ? message.to : message.from;
            if (!convMap.has(otherUser)) {
              convMap.set(otherUser, { user: otherUser, lastMessage: message });
            } else {
              const existingConversation = convMap.get(otherUser)!;
              if (new Date(message.timestamp) > new Date(existingConversation.lastMessage.timestamp)) {
                convMap.set(otherUser, { ...existingConversation, lastMessage: message });
              }
            }
          });
          this.conversations = this.orderByLastMessagePipe.transform(Array.from(convMap.values()), 'desc');
        },
        error: (error) => {
          console.error('Error fetching conversations:', error);
        }
      });
    }
  }
  
  fetchMessages(user1: string, user2: string) {
    this.apiService.fetchMessages(user1, user2).subscribe({
      next: (messages) => {
        const possibleMessages = messages;
        if(possibleMessages.length === 0) {
          this.startNewConversation(user2);
          return;
        }
        this.messages = messages;
        this.selectedConversation = user2;
        this.messages.forEach((message) => {
          if (message.to === user1) {
            this.apiService.markMessageAsSeen(message._id).subscribe({
              next: () => {
                this.fetchConversations();
              },
              error: (error) => {
                console.error('Error marking message as seen:', error);
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error fetching messages:', error);
      }
    });
  }
  
  sendMessage(to: string, content: string) {
    this.apiService.sendMessage(to, content).subscribe({
      next: () => {
        this.fetchMessages(this.getUserFromLocalStorage().username, to);
        this.newMessageContent = '';
        
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }

  clearSearchTerm(){
    this.searchTerm = '';
  }

  goToProfile() {
    this.profileViewEnabled = !this.profileViewEnabled;
  }
 
  logout() {
    localStorage.clear();
    alert('You have been logged out.');
    this.router.navigate(['/login']);
  }
}