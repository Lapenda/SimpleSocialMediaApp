import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { UserService } from '../services/user.service';
import { SearchPipe } from '../pipes/search.pipe';
import { ApiService } from '../services/api.service';
 
export interface Post {
  postID: string;
  content: string;
  username: string;
  likes?: string[];
  comments: string[];
  timestamp: Date;
  isEditing?: boolean;
  newContent?: string;
  showComments?: boolean;
}
  
export interface Comment {
  _id: string;
  postID: string;
  content: string;
  username: string;
  timestamp: Date;
  comments?: Comment[];
  isEditing?: boolean;
  newContent?: string;
  showReplyDiv?: boolean;
  showReplies?: boolean;
}
  
export interface User {
  userId: string;
  username: string;
  name: string;
  email: string;
  role: boolean;
}
  
@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule, FormsModule, SearchPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

export class HomeComponent implements OnInit {
  
  posts: Post[] = [];
  users: User[] = [];
  commentsMap: { [key: string]: Comment } = {};
  likeStatus: { [key: string]: { [username: string]: boolean } | undefined } = {};
  selectedFriendUsername: string | null = null; 
  likeStatusForComments: { [key: string]: { [username: string]: boolean } | undefined } = {};

  newPostContent = '';
  showAddPostDiv = false;
  commentContent = '';
  commentsAreReady = false;
  profileViewEnabled = false;

  isAdminLoggedIn = false;

  showEditProfile = false;
  editedName = '';
  editedEmail = '';

  replyContent = '';

  searchTerm: string = '';
 
  constructor(private router: Router, private cdr: ChangeDetectorRef, private userService: UserService, private apiService: ApiService) {}
  
  ngOnInit() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    this.fetchPosts();
    this.fetchAllUsers();
    this.cdr.detectChanges();
    const user = this.getUserFromLocalStorage();
    if(user){
      this.isAdminLoggedIn = user.role;
    }
  }
  
  logout() {
    alert('You have been logged out.');
    localStorage.clear();
    this.router.navigate(['/login']);
  }
  
  goToInbox() {
    const user = this.getUserFromLocalStorage();
    if(!user){
      console.log('No user found in local storage');
      return;
    }
    this.router.navigate([`/inbox/${user.username}`]);
  }
  
  goToProfile() {
    this.profileViewEnabled = !this.profileViewEnabled;
    this.selectedFriendUsername = null;
    this.showAddPostDiv = false;
    if(this.profileViewEnabled === false){
      this.fetchPosts();
    }
    else{
      this.fetchLoggedInUsersData();
    }
  }
  
  goToAdminPane(){
    this.router.navigate(['/admin']);
  }

  addPost() {
    console.log('Add Post button clicked', this.showAddPostDiv);
    this.showAddPostDiv = !this.showAddPostDiv;
  }

  returnToTheHomePage(){
    this.profileViewEnabled = false;
    this.selectedFriendUsername = null;
    this.fetchPosts();
  }

  clearSearchTerm(){
    this.searchTerm = '';
  }

  //Lajkanje i odgovaranje na komentare
  toggleReplyDiv(commentId: string) {
    this.commentsMap[commentId] = {
      ...this.commentsMap[commentId],
      showReplyDiv: !this.commentsMap[commentId].showReplyDiv
    };
  }

  toggleSeeReplies(commentId: string) {
    this.commentsMap[commentId] = {
      ...this.commentsMap[commentId],
      showReplies: !this.commentsMap[commentId].showReplies
    };
    if (this.commentsMap[commentId].showReplies) {
      this.fetchRepliesForComment(commentId);
    }
  }
    
  replyToComment(parentCommentId: string, content: string) {
    if (content.trim()) {
      this.apiService.replyToComment(parentCommentId, content).subscribe({
        next: (data: Comment) => {
          this.commentsMap[parentCommentId].comments?.push(data);
          this.replyContent = '';
          console.log('Reply added successfully:', data);
          this.fetchPosts();
        },
        error: (error) => {
          console.error('Error replying to comment:', error);
          alert('Failed to add reply. Please try again.');
        }
      });
    } else {
      alert('Please enter a reply before posting.');
    }
    this.replyContent = '';
  }

  fetchRepliesForComment(commentId: string) {
    this.apiService.fetchRepliesForComment(commentId).subscribe({
      next: (data: Comment[]) => {
        this.commentsMap[commentId].comments = data;
      },
      error: (error) => {
        console.error('Error fetching replies for comment:', error);
      }
    });
  }  

  //Korisnici

  fetchAllUsers() {
    const token = localStorage.getItem('token');
    if (token) {
      this.apiService.fetchAllUsers().subscribe({
        next: (data: User[]) => {
          this.users = data;
          this.userService.setUsers(data);
        },
        error: (error) => {
          console.error('Error fetching users:', error);
        }
      });
    } else {
      console.log('No token found, redirecting to login');
      this.router.navigate(['/login']);
    }
  }


  onFriendClick(user: User) {
    this.searchTerm = '';
    this.fetchFriendData(user);
    this.profileViewEnabled = false;
  }


  fetchFriendData(user: User) {
    this.apiService.fetchFriendData(user.username).subscribe({
      next: (data: Post[]) => {
        const userPosts = data;
        if(userPosts.length === 0){
          alert('This user has no posts.');
          return;
        }
        this.selectedFriendUsername = user.username;
        this.posts = data;
        this.posts.forEach(post => this.checkIfUserIsAuthorOfPost(post));
        this.posts.forEach(post => this.fetchCommentsForPost(post));
        this.posts.forEach(post => this.checkLikeStatus(post));
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
      }
    });
  }

  deleteAccount(user: User) {
    if (confirm('Are you sure you want to permanently delete your account with all of its content?')) {
      this.apiService.deleteAccount(user).subscribe({
        next: () => {
          alert('Account deleted successfully.');
          localStorage.clear();
          this.router.navigate(['/login']);
        },
        error: (error) => {
        console.error('Error deleting account:', error);
          alert('Failed to delete account. Please try again.');
        }
      });
    }
  }
    
  //Podaci prijavljenog korisnika

  fetchLoggedInUsersData() {
    const user = this.getUserFromLocalStorage();
    if (user) {
      this.apiService.fetchLoggedInUsersData(user.username).subscribe({
        next: (data: Post[]) => {
          const userPosts = data;
          if(userPosts.length === 0){
            alert('You have no posts.');
            this.profileViewEnabled = false;
            return;
          }
          this.posts = data;
          this.posts.forEach(post => this.checkIfUserIsAuthorOfPost(post));
          this.posts.forEach(post => this.fetchCommentsForPost(post));
          this.posts.forEach(post => this.checkLikeStatus(post));
        },
        error: (error) => {
          console.error('Error fetching user data:', error);
        }
      });
    }
  }

  toggleEditUser(user: User) {
    this.showEditProfile = !this.showEditProfile;
    this.editedName = user.name;
    this.editedEmail = user.email;
  }

      
  updateUser(user: User) {
    this.apiService.updateUser(user.username, { name: this.editedName, email: this.editedEmail }).subscribe({
      next: (data: User) => {
        user.name = data.name;
        user.email = data.email;
        localStorage.setItem('user', JSON.stringify(user));
        alert('Profile updated successfully.');
        this.showEditProfile = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
      }
    });
  }
        

  //POstovi 

  finishAddingPost() {
    this.apiService.addPost(this.newPostContent).subscribe({
      next: (data: Post) => {
        this.posts.push(data);
        this.newPostContent = '';
        this.showAddPostDiv = false;
        console.log('Post added:', data);
        alert('Post added successfully.');
        if(this.profileViewEnabled === false){
          this.fetchPosts();
        }
        else{
          this.fetchLoggedInUsersData();
        }
      },
      error: (error) => {
        console.error('Error adding post:', error);
      }
    });
  }

  
  deletePost(post: Post) {
    if (confirm('Are you sure you want to delete this post?')) {
      this.apiService.deletePost(post.postID).subscribe({
        next: () => {
          const index = this.posts.findIndex(p => p.postID === post.postID);
          if (index !== -1) {
            this.posts.splice(index, 1);
          }
          alert('Post deleted successfully.');
        },
        error: (error) => {
          console.error('Error deleting post:', error);
            alert('Failed to delete post. Please try again.');
        }
      });
    }
  }

  checkIfUserIsAuthorOfPost(post: Post): boolean {
    const user = this.getUserFromLocalStorage();
    return (user !== null && post.username === user.username) || (user !== null && user.role);
  }
  
  editPost(post: Post, newContent: string) {
    if (newContent.trim()) {
      this.apiService.editPost(post.postID, newContent).subscribe({
        next: (data: Post) => {
          const index = this.posts.findIndex(p => p.postID === post.postID);
          if (index !== -1) {
            this.posts[index] = { ...this.posts[index], content: newContent, isEditing: false };
          }
          alert('Post edited successfully.');
          if(this.profileViewEnabled === false){
            this.fetchPosts();
          }
          else{
            this.fetchLoggedInUsersData();
          }
        },
        error: (error) => {
          console.error('Error editing post:', error);
          alert('Failed to edit post. Please try again.');
        }
      });
    } else {
      alert('Please enter content before saving the edit.');
    }
  }

  toggleEditPost(post: Post) {
    const index = this.posts.findIndex(p => p.postID === post.postID);
    if (index !== -1) {
      this.posts[index] = {
        ...this.posts[index],
        isEditing: !this.posts[index].isEditing,
        newContent: this.posts[index].content
      };
    }
  }

  fetchPosts() {
    this.apiService.fetchPosts().subscribe({
      next: (data: Post[]) => {
        this.posts = data;
        this.posts.forEach(post => this.checkIfUserIsAuthorOfPost(post));
        this.posts.forEach(post => this.fetchCommentsForPost(post));
        this.posts.forEach(post => this.checkLikeStatus(post));
      },
      error: (error) => {
        console.error('Error fetching posts:', error);
      }
    });
  }

  //Lajkovi

  checkIfPostIsLiked(postId: string, username: string): Observable<boolean> {
    return this.apiService.checkIfPostIsLiked(postId, username);
  }

  toggleLike(post: Post) {
    const token = localStorage.getItem('token');
    const user = this.getUserFromLocalStorage();
      
    if (token && user) {
      const like = !this.likeStatus[post.postID]?.[user.username];
    
      this.apiService.toggleLike(post.postID, like).subscribe({
        next: (data: Post) => {
          const index = this.posts.findIndex(p => p.postID === post.postID);
          if (index !== -1) {
            this.posts[index] = data;
          }
          this.checkLikeStatus(post);
          if (this.profileViewEnabled === false) {
            this.fetchPosts();
            this.selectedFriendUsername = null;
          } else {
            this.fetchLoggedInUsersData();
          }
        },
        error: (error) => {
          console.error(like ? 'Error liking post:' : 'Error unliking post:', error);
          alert(like ? 'Failed to like post. Please try again.' : 'Failed to unlike post. Please try again.');
        }
      });
    } else {
      console.log('No token or user found, redirecting to login');
      this.router.navigate(['/login']);
    }
  }

  checkLikeStatus(post: Post) {
    const user = this.getUserFromLocalStorage();
    if (user) {
      if (!this.likeStatus[post.postID]) {
        this.likeStatus[post.postID] = {};
      }
      this.checkIfPostIsLiked(post.postID, user.username).subscribe({
        next: (status) => {
          this.likeStatus[post.postID]![user.username] = status;
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
    }
  }
      

  //Komentari
       
  checkIfUserIsAuthorOfComment(comment: Comment): boolean {
    const user = this.getUserFromLocalStorage();

    if (!user) {
      console.log('No user found in local storage');
      return false;
    }

    if(this.commentsAreReady){
      if(!comment){
        console.log('No comment found yet');
        return false;
      }
    }

    return comment.username === user.username || user.role;
  }

  commentPost(post: Post, comment: string) {
    if (comment.trim()) {
      this.apiService.addComment(post.postID, comment).subscribe({
        next: (data: Post) => {
          const index = this.posts.findIndex(p => p.postID === post.postID);
          if (index !== -1) {
            this.posts[index] = data;
          }
          this.commentContent = '';
          console.log('Comment added successfully:', data);
          if(this.profileViewEnabled === false){
            this.fetchPosts();
          }
          else{
            this.fetchLoggedInUsersData();
          }
        },
        error: (error) => {
          console.error('Error commenting on post:', error);
          alert('Failed to add comment. Please try again.');
        }
      });
    } else {
      alert('Please enter a comment before posting.');
    }
  }

  deleteComment(post: Post, commentId: string) {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.apiService.deleteComment(commentId).subscribe({
        next: () => {
          alert('Comment deleted successfully.');
          if(this.profileViewEnabled === false){
            this.fetchPosts();
          }
          else{
            this.fetchLoggedInUsersData();
          }
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
          alert('Failed to delete comment. Please try again.');
        }
      });
    }
  }
  
   
 
  editComment(post: Post, commentId: string, newContent: string) {
    if (newContent.trim()) {
      this.apiService.editComment(commentId, newContent).subscribe({
        next: () => {
          this.fetchCommentsForPost(post);
          alert('Comment edited successfully.');
        },
        error: (error) => {
          console.error('Error editing comment:', error);
          alert('Failed to edit comment. Please try again.');
        }
      });
    } else {
      alert('Please enter content before saving the edit.');
    }
  }


  fetchCommentsForPost(post: Post) {
    this.apiService.fetchCommentsForPost(post.postID).subscribe({
      next: (comments: Comment[]) => {
        comments.forEach(comment => {
          this.commentsMap[comment._id] = comment;              
        });
        this.commentsAreReady = true;
      },
      error: (error) => {
        console.error('Error fetching comments for post:', error);
      }
    });
  }

  toggleSeeComments(post: Post) {
    const index = this.posts.findIndex(p => p.postID === post.postID);
    if (index !== -1) {
      this.posts[index] = {
        ...this.posts[index],
        showComments: !this.posts[index].showComments
      };

      if (this.posts[index].showComments) {
        this.fetchCommentsForPost(post);
      }
    }
  }


  toggleEditComment(post: Post, commentId: string) {
      
    const comment = this.commentsMap[commentId];
    if (comment) {
      this.commentsMap[commentId] = {
        ...comment,
        isEditing: !comment.isEditing,
        newContent: comment.content
      };
    }
  }

  //korisnik
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
