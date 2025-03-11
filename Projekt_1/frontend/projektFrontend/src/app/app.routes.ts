import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { InboxComponent } from './inbox/inbox.component';
import { AdminPaneComponent } from './admin-pane/admin-pane.component';

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'login', component:LoginComponent },
    { path: 'register', component:RegisterComponent },
    { path: 'inbox/:username', component:InboxComponent },
    { path: 'admin', component: AdminPaneComponent},
    { path: '**', redirectTo: '/login' }
];
