import { Component, OnInit } from '@angular/core'
import { ApiService } from '../api.service'
import { AuthService } from '../auth/auth.service'

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html'
})
export class RequestsComponent implements OnInit {
  requests: any[] = []
  spinner = false

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.spinner = true
    this.apiService.callApi('get_my_requests', 'POST', {
      my_user_id: this.authService.userData.id
    }).subscribe({
      next: (response: any) => {
        console.log('response from get_my_requests : ',  response)
        this.spinner = false
        if(response.success) {
          this.requests = response.requests
        } else [
          this.requests = []
        ]        
      }, error: () => {
        this.spinner = false
        this.requests = []
      }
    })
  }



}