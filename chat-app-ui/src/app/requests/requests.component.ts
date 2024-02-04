import { Component, OnInit } from '@angular/core'
import { ApiService } from '../api.service'
import { AuthService } from '../auth/auth.service'

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html'
})
export class RequestsComponent implements OnInit {
  temprequests = ['reuqests1', 'reuqests2', 'reuqests3', 'reuqests4', 'reuqests5']

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.apiService.callApi('get_my_requests', 'POST', {
      email: this.authService.userData.email
    }).subscribe({
      next: (response: any) => {
        console.log('response from get_my_requests : ' + response)
      }
    })
  }



}