import { AuthService } from './auth.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Params, Router } from '@angular/router'
import { Subscription } from 'rxjs';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html'
})
export class AuthComponent implements OnInit, OnDestroy {
  currentView: string = 'login'
  email: string = ''
  password: string = ''
  username: string = ''
  showPassword: boolean = false
  signupErrors = {
    email: false,
    username: false
  }
  loginErrors = {
    email: false,
    password: false
  }
  authStatusSubscription = new Subscription()
  @ViewChild('form') myForm: NgForm | undefined
  
  constructor(
    private router: Router,
    private currentRoute: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if(this.authService.isAuthenticated) {
      this.router.navigate(['dashboard'])
      return
    }

    this.currentRoute.queryParams.subscribe({
      next: (queryParams: Params) => {
        if(queryParams['type'] && (['login', 'signup'].includes(queryParams['type']))) {
          this.currentView = queryParams['type']
        } else {
          this.router.navigate(['auth'], {
            queryParams: {
              type: 'login'
            }
          })
        }
        this.resetForm()
        this.myForm?.reset()
      }
    })

    this.authStatusSubscription = this.authService.authStatus.subscribe({
      next: (statusObject: any) => {
        if(statusObject.type === 'login') {
          if(statusObject.success) {
            this.router.navigate(['dashboard'])
          } else {
            this.loginErrors = statusObject.errors
          }
        } else if (statusObject.type === 'signup') {
          if(statusObject.success) {
            this.router.navigate(['auth'], {
              queryParams: { type: 'login' }
            })
            this.myForm?.reset()
          } else {
            this.signupErrors = statusObject.errors
          }
        }
      }
    })
  }

  submitForm(form: any) {
    let payload
    if(this.currentView === 'login') {
      payload = {
        email: this.email,
        password: this.password
      }
      this.authService.login(payload)
    } else if(this.currentView === 'signup') {
      payload = {
        email: this.email,
        password: this.password,
        username: this.username
      }
      this.authService.signup(payload)
    }
  }

  resetForm() {
    this.email = ''
    this.password = ''
    this.username = ''
    this.showPassword = false
    this.signupErrors = {
      email: false,
      username: false
    }
    this.loginErrors = {
      email: false,
      password: false
    }
  }

  ngOnDestroy() {
    this.authStatusSubscription.unsubscribe()
  }

}