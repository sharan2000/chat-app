import { Injectable } from '@angular/core'
import { AuthService } from './auth.service'
import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError, map, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  exclude_routes_array = ['login', 'signup']

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const url = req.url
    let exclude_url = false
    let modifiedReq

    // checking if the token need to be passed
    for(const route of this.exclude_routes_array) {
      if(url.includes(route)) {
        exclude_url = true
        break
      }
    }

    if(!exclude_url) {
      let token = sessionStorage.getItem('token') || '';
      modifiedReq = req.clone({
        headers: req.headers.append('Authorization', token)
      })
    } else {
      modifiedReq = req
    }

    return next.handle(modifiedReq).pipe(
      catchError((error: any) => {
        if(error['status'] === 401) {
          this.authService.logout()
          this.router.navigate(['/auth'], { queryParams: {type: 'login'} })
        }
        throw error
      })
    );
  }
}