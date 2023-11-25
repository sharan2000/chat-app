import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router'
import { AuthService } from './auth.service'


@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const token = sessionStorage.getItem('token');
    let return_val = false

    if(token) {
      try {
        let jwt = token.slice(7) // getting only the jwt part
        if(!this.authService.tokenExpired(jwt)) {
          return_val = true
        }
      } catch(err) {
        return_val = false
      }
    }
    if(!return_val) {
      this.authService.logout()
      this.router.navigate(['/auth'], { queryParams: {type: 'login'} })
    }
    return return_val
  }
}

export const AuthGuardFunction: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  return inject(AuthGuardService).canActivate();
};
