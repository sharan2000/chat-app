import { ApiService } from './../api.service';
import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

import CryptoJS from 'crypto-js'
import { ENC_DEC_KEY } from '../../../env'

@Injectable({
    providedIn: 'root'
})
export class AuthService {
  authLoggedIn = new Subject<any>();
  authStatus = new Subject<Object>();
  isAuthenticated: boolean = false
  userData = {
    email: '',
    username: '',
    id: '',
    role: 0
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
          sessionStorage.setItem('userData', this.encrypt(JSON.stringify(response.user_data)))
          this.userData = response.user_data

          this.authStatus.next({
            type: 'login',
            success: true
          })
          this.authLoggedIn.next({
            isAuthenticated: true,
            role: this.userData.role
          })
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
    this.authLoggedIn.next({
      isAuthenticated: false,
      role: this.userData.role
    })
    this.isAuthenticated = false
    sessionStorage.clear()
  }

  checkAndSetUserData() {
    const token = sessionStorage.getItem('token');
    const data = this.decrypt(sessionStorage.getItem('userData'));
    if(token && data) {
      try {
        // getting user data
        this.userData = JSON.parse(data)

        // getting only the jwt part
        let jwt = token.slice(7) 
        if(!this.tokenExpired(jwt) && (Object.keys(this.userData).length)) {
          this.authLoggedIn.next({
            isAuthenticated: true,
            role: this.userData.role
          })
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

  //To encrypt input data
  public encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, ENC_DEC_KEY).toString();
  }

  //To decrypt input data
  public decrypt(data: any) {
    let response = ''
    try {
      response = CryptoJS.AES.decrypt(data, ENC_DEC_KEY).toString(CryptoJS.enc.Utf8);
    } catch(err) {
      response = ''
    }
    return response
  }
}