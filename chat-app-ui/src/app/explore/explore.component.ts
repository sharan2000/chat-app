import { Component, OnInit } from '@angular/core'
import { ApiService } from '../api.service'
import { AuthService } from '../auth/auth.service'

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html'
})
export class ExploreComponent implements OnInit {
  users_object: any
  users_vals: any
  rooms: any
  spinner = false

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.spinner = true
    this.apiService.callApi('get_all_users_rooms', 'POST', {
      user_id: this.authService.userData.id,
    }).subscribe({
      next: (response: any) => {
        console.log('response from get_all_users_rooms : ', response)
        if(response.success) {
          this.users_object = response.data.users
          this.users_vals = Object.values(this.users_object)
          this.rooms = response.data.rooms
        } else {
          this.users_object = {}
          this.users_vals = []
          this.rooms = []
        }

        this.spinner = false
      },
      error: () => {
        this.spinner = false
      }
    })
  }



}