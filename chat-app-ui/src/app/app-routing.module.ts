import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';


import { DashboardComponent } from './dashboard/dashboard.component';
import { ChatComponent } from './chat/chat.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuardFunction } from './auth/auth.guard';
import { RootComponent } from './root.component';
import { RequestsComponent } from './requests/requests.component';
import { ExploreComponent } from './explore/explore.component';
import { AdminActionsComponent } from './admin_actions/admin_actions.component';

const routes: Routes = [
  {
    path: '',
    component: RootComponent,
    canActivate: [AuthGuardFunction],
    canActivateChild: [AuthGuardFunction],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'chat',
        component: ChatComponent,
      },
      {
        path: 'requests',
        component: RequestsComponent,
      },
      {
        path: 'explore',
        component: ExploreComponent,
      },
      {
        path: 'admin_actions',
        component: AdminActionsComponent,
      }
    ],
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
