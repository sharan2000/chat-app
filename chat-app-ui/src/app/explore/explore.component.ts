import { ChatService } from './../chat/chat.service';
import { Component, OnInit , OnDestroy} from '@angular/core'
import { ApiService } from '../api.service'
import { AuthService } from '../auth/auth.service'
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html'
})
export class ExploreComponent implements OnInit, OnDestroy {
  users_object:any = {}
  users_vals : any[] = []
  rooms: any[] = []
  spinnerUsers = false
  spinnerRooms = false
  friendSpinnerMap = new Map()
  roomsSpinnerMap = new Map()

  requestObjectSubscription: Subscription|undefined


  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.requestObjectSubscription = this.chatService.requestObject.subscribe({
      next: (data) => {
        // we are updating the '+' button to add a user to 'in_requests' because a requests is sent or received
        this.users_object[data.user_id].in_request = true
      }
    })

    this.getAllUsersInFragments()
    this.getAllRoomsInFragments()
  }

  // api to get all users (25 at a time). same api is used to get users in infinite scrolling
  getAllUsersInFragments() {
    this.spinnerUsers = true
    this.apiService.callApi('get_all_users', 'POST', {
      user_id: this.authService.userData.id,
    }).subscribe({
      next: (response: any) => {
        console.log('response from get_all_users : ', response)
        if(response.success) {
          //  we get 25 vals at a time for infinite loading so updating the object with latest users
          this.users_object = {
            ...response.users,
            ...this.users_object
          }
          this.users_vals = [
            ...Object.values(response.users),
            ...this.users_vals
          ]
        }
        this.spinnerUsers = false
      },
      error: () => {
        this.spinnerUsers = false
      }
    })
  }

  // api to get all rooms (25 at a time). same api is used to get rooms in infinite scrolling
  getAllRoomsInFragments() {
    this.spinnerRooms = true
    this.apiService.callApi('get_all_rooms', 'POST', {
      user_id: this.authService.userData.id,
    }).subscribe({
      next: (response: any) => {
        console.log('response from get_all_rooms : ', response)
        if(response.success) {
          //  we get 25 vals at a time for infinite loading so updating the object with latest rooms
          this.rooms = [...response.rooms]
        }
        this.spinnerRooms = false
      },
      error: () => {
        this.spinnerRooms = false
      }
    })
  }

  addUserToFriends(item: any) {
    this.friendSpinnerMap.set(item.id, true)
    console.log('clicked friend -- ', item)

    this.apiService.callApi('add_or_remove_user_friend', 'POST', {
      type: 1, // 1 is to add, 2 is to remove
      my_user_id: this.authService.userData.id, // from the logged in user
      friend_user_id: item.id, // to the user who we click on
      my_user_name: this.authService.userData.username,
      friend_user_name: item.username
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

  ngOnDestroy() {
    this.requestObjectSubscription?.unsubscribe()
  }
}