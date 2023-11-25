import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';


import { DashboardComponent } from './dashboard/dashboard.component';
import { ChatComponent } from './chat/chat.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuardFunction } from './auth/auth.guard';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuardFunction]
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [AuthGuardFunction]
  },
  {
    path: 'auth',
    component: AuthComponent
  },
  {
    path: '**',
    redirectTo: 'auth'
  },
];

@NgModule({
    imports: [ RouterModule.forRoot(routes) ],
    exports: [ RouterModule ]
})
export class AppRoutingModule {}
