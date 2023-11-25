import { Subscription } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  isAuthenticated: boolean = false
  authLoggedInSubscription = new Subscription()
  collapseNav = true

  constructor(
    private router: Router,
    protected authService: AuthService
  ) {}

  ngOnInit() {
    this.authLoggedInSubscription = this.authService.authLoggedIn.subscribe({
      next: (isAuthenticated: any) => {
        this.isAuthenticated = isAuthenticated
      }
    })
    this.authService.checkAndSetUserData()
  }

  logout() {
    this.authService.logout()
    this.router.navigate(['auth'], { queryParams: { type: 'login' } })
  }

  ngOnDestroy() {
    this.authLoggedInSubscription.unsubscribe()
  }

}
