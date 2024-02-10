import { Component, OnInit } from '@angular/core'
import { ApiService } from '../api.service'
import { AuthService } from '../auth/auth.service'

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html'
})
export class ExploreComponent implements OnInit {
  users_object = {}
  users_vals : any[] = []
  rooms: any
  spinner = false
  friendSpinnerMap = new Map()
  roomsSpinnerMap = new Map()


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
          //  we get 25 vals at a time for infinite loading so updating the object with latest users
          this.users_object = {
            ...response.data.users,
            ...this.users_object
          }
          this.users_vals = [
            ...Object.values(response.data.users),
            ...this.users_vals
          ]
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

  addUserToFriends(item: any) {
    this.friendSpinnerMap.set(item.id, true)
    console.log('clicked friend -- ', item)

    this.apiService.callApi('add_or_remove_user_friend', 'POST', {
      type: 1, // 1 is to add, 2 is to remove
      my_user_id: this.authService.userData.id, // from the logged in user
      friend_user_id: item.id // to the user who we click on
    }).subscribe({
      next: (response: any) => {
        console.log('response from add_or_remove_user_friend : ', response)
        if(response.success) {
          item.in_request = true // add to requests so remove the add button
        }
        this.friendSpinnerMap.delete(item.id) // stopping spinner
      },
      error: () => {
        this.friendSpinnerMap.delete(item.id) // stopping spinner
      }
    })
  }

  addRoomToUser(item: any) {
    this.roomsSpinnerMap.set(item.id, true)
    console.log(item)
    setTimeout(() => {
      this.roomsSpinnerMap.delete(item.id)
    }, 3000)
  }


}