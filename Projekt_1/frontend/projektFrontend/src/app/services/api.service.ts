import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Message } from '../inbox/inbox.component';
import { Post, Comment, User } from '../home/home.component';

interface LoginResponse {
  token: string;
  user: {
    userId: string;
    username: string;
    role: boolean;
  };
}

interface RegisterResponse {
  message: string;
}


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  private baseUrl = 'http://localhost:3000';
  private headers = new HttpHeaders();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return this.headers;
    }
    return this.headers.set('Authorization', `Bearer ${token}`);
  }


  /*Admin pane*/
  //Graphs
  getPostStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/posts/bla`, { headers: this.getAuthHeaders() });
  }

  getRegistrationStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/registration-data`, { headers: this.getAuthHeaders() });
  }

  /*Login*/
  login(formData: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, formData);
  }

  /*Registration*/
  register(formData: any): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/auth/register`, formData);
  }

  /*Inbox*/
  fetchConversations(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/messages/${username}`, { headers: this.getAuthHeaders() });
  }

  fetchMessages(user1: string, user2: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/messages/${user1}/${user2}`, { headers: this.getAuthHeaders() });
  }

  sendMessage(to: string, content: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/messages`, { to, content }, { headers: this.getAuthHeaders() });
  }

  markMessageAsSeen(messageId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/messages/${messageId}/seen`, {}, { headers: this.getAuthHeaders() });
  }

  /*Home*/

   // Users
   fetchAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`, { headers: this.getAuthHeaders() });
  }

  fetchFriendData(username: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/profile/${username}`, { headers: this.getAuthHeaders() });
  }

  updateUser(username: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/profile/${username}`, data, { headers: this.getAuthHeaders() });
  }

  deleteAccount(user: User){
    return this.http.delete(`${this.baseUrl}/profile/${user.userId}`, { headers: this.getAuthHeaders() });
  }

  updateUserRole(userId: string, role: boolean): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${userId}/role`, { role }, { headers: this.getAuthHeaders() });
  }

  // Posts
  fetchPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/posts`, { headers: this.getAuthHeaders() });
  }

  fetchLoggedInUsersData(username: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/profile/${username}`, { headers: this.getAuthHeaders() });
  }

  addPost(content: string): Observable<Post> {
    return this.http.post<Post>(`${this.baseUrl}/posts`, { content }, { headers: this.getAuthHeaders() });
  }

  deletePost(postId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/posts/${postId}`, { headers: this.getAuthHeaders() });
  }

  editPost(postId: string, newContent: string): Observable<Post> {
    return this.http.put<Post>(`${this.baseUrl}/posts/${postId}`, { content: newContent }, { headers: this.getAuthHeaders() });
  }

  // Likes
  checkIfPostIsLiked(postId: string, username: string): Observable<boolean> {
    const token = localStorage.getItem('token');
    return token ? 
      this.http.get<boolean>(`${this.baseUrl}/likes/${postId}/like/${username}`, { headers: this.getAuthHeaders() }) : 
      of(false);
  }

  toggleLike(postId: string, like: boolean): Observable<Post> {
    if (like) {
      return this.http.post<Post>(`${this.baseUrl}/likes/${postId}/like`, {}, { headers: this.getAuthHeaders() });
    } else {
      return this.http.delete<Post>(`${this.baseUrl}/likes/${postId}/like`, { headers: this.getAuthHeaders() });
    }
  }

  // Comments
  addComment(postId: string, comment: string): Observable<Post> {
    return this.http.post<Post>(`${this.baseUrl}/comments/${postId}/comment`, { comment }, { headers: this.getAuthHeaders() });
  }

  deleteComment(commentId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/comments/${commentId}`, { headers: this.getAuthHeaders() });
  }

  editComment(commentId: string, newContent: string): Observable<Comment> {
    return this.http.put<Comment>(`${this.baseUrl}/comments/${commentId}`, { content: newContent }, { headers: this.getAuthHeaders() });
  }

  fetchCommentsForPost(postId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.baseUrl}/comments/${postId}/comments`, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error fetching comments:', error);
        return of([]);
      })
    );
  }

  addNestedComment(parentCommentId: string, comment: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.baseUrl}/comments/${parentCommentId}/nested-comment`, { comment }, { headers: this.getAuthHeaders() });
  }

  fetchCommentsForPostWithNested(postId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.baseUrl}/comments/${postId}/comments-with-nested`, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error fetching comments with nested:', error);
        return of([]);
      })
    );
  }

  replyToComment(parentCommentId: string, content: string) {
    return this.http.post<Comment>(`${this.baseUrl}/comments/${parentCommentId}/reply`, { content }, { headers: this.getAuthHeaders() });
  }

  fetchRepliesForComment(commentId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.baseUrl}/comments/${commentId}/replies`, { headers: this.getAuthHeaders() });
  }
}