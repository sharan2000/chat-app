import { NgModule } from '@angular/core'
import { AppRoutingModule } from './app-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http'
import { CommonModule } from '@angular/common';
import { AuthComponent } from './auth/auth.component';
import { FormsModule } from '@angular/forms'
import { AuthInterceptor } from './auth/auth.interceptor';
import { ChatComponent } from './chat/chat.component';
import { ShortUsernamePipe } from './utils/short-username.pipe';
import { RootComponent } from './root.component';
import { RequestsComponent } from './requests/requests.component';
import { ExploreComponent } from './explore/explore.component';
import { ToastNoAnimationModule } from 'ngx-toastr';
import { AdminActionsComponent } from './admin_actions/admin_actions.component';

@NgModule({
  declarations: [
    AppComponent,
    RootComponent,
    DashboardComponent,
    AdminActionsComponent,
    AuthComponent,
    ChatComponent,
    RequestsComponent,
    ExploreComponent,
    ShortUsernamePipe
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    ToastNoAnimationModule.forRoot(), // ToastrModule added
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}