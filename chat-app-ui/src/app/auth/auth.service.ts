import { ApiService } from './../api.service';
import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

@Injectable({
    providedIn: 'root'
})
export class AuthService {
  authLoggedIn = new Subject<boolean>();
  authStatus = new Subject<Object>();
  isAuthenticated: boolean = false
  userData = {
    email: '',
    username: '',
    id: ''
  }

  constructor(
    private apiService: ApiService
  ) {}

  login(payload: any) {
    this.apiService.callApi('login', 'POST', payload).subscribe({
      next: (response: any) => {
        console.log('login response -- ', response)
        if(response.success) {
          sessionStorage.setItem('token', response.token)
          sessionStorage.setItem('userData', JSON.stringify(response.user_data))
          this.userData = response.user_data

          this.authStatus.next({
            type: 'login',
            success: true
          })
          this.authLoggedIn.next(true)
          this.isAuthenticated = true
        } else {
          this.authStatus.next({
            type: 'login',
            success: false,
            errors: response.errors
          })
        }
      }
    })
  }

  signup(payload: any) {
    this.apiService.callApi('signup', 'POST', payload).subscribe({
      next: (response: any) => {
        console.log('signup response -- ', response)
        if(response.success) {
          this.authStatus.next({
            type: 'signup',
            success: true
          })
        } else {
          this.authStatus.next({
            type: 'signup',
            success: false,
            errors: response.errors
          })
        }
      }
    })
  }

  logout() {
    this.authLoggedIn.next(false)
    this.isAuthenticated = false
    sessionStorage.clear()
  }

  checkAndSetUserData() {
    const token = sessionStorage.getItem('token');
    const data = sessionStorage.getItem('userData');
    if(token && data) {
      try {
        // getting user data
        this.userData = JSON.parse(data)

        // getting only the jwt part
        let jwt = token.slice(7) 
        if(!this.tokenExpired(jwt) && (Object.keys(this.userData).length)) {
          this.authLoggedIn.next(true)
          this.isAuthenticated = true
        }

      } catch(err) {
        this.logout()
      }
    } else {
      this.logout()
    }
  }

  //helper function to say if the jwt token is expired
  tokenExpired(token: string) {
    const expiry = (JSON.parse(atob(token.split('.')[1]))).exp;
    return (Math.floor((new Date).getTime() / 1000)) >= expiry;
  }
}