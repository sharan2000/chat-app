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

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    AuthComponent,
    ChatComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}