import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router'
import { AuthService } from './auth.service'


@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(state: RouterStateSnapshot): boolean {
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
    /*
      - If the user is going to /admin_actions then we neeed to check if the user role is admin
      - admin role_id is 1
      - If the user does not have that role id log them out and navigate them to login page
    */
    if(!return_val || (state.url === '/admin_actions' && this.authService.userData.role != 1)) {
      this.authService.logout()
      this.router.navigate(['/auth'], { queryParams: {type: 'login'} })
    }
    return return_val
  }
}

export const AuthGuardFunction: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  return inject(AuthGuardService).canActivate(state);
};
