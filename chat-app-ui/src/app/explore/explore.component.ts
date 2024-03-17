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
  requestActionPerformedSubscription: Subscription|undefined
  userUnfriendedSubscription: Subscription|undefined

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
    this.userUnfriendedSubscription = this.chatService.userUnfriended.subscribe({
      next: (data) => {
        // we are updating the '-' button to '+' because users are no longer friends
        this.users_object[data.user_id].connected = 0
      }
    })
    this.requestActionPerformedSubscription = this.chatService.requestActionPerformed.subscribe({
      next: (data) => {
        // we update the explore list if any action has been performed by the user in requests page
        if (data.action_taken_user_id && this.users_object[data.action_taken_user_id]) {
          if(data.type === 1) { // accept request
            this.users_object[data.action_taken_user_id].connected = 1 // accepted so connected
          }
          this.users_object[data.action_taken_user_id].in_request = false // beacuse we remove it in requests
        }
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

  addOrRemoveUserFriend(item: any, type: number) {
    if(this.friendSpinnerMap.get(item.id)) { return } // if user is trying to click multiple times
    this.friendSpinnerMap.set(item.id, true)
    console.log('clicked friend -- ', item, '\ntype -- ', type)

    this.apiService.callApi('add_or_remove_user_friend', 'POST', {
      type, // 1 is to add, 2 is to remove
      my_user_id: this.authService.userData.id, // from the logged in user
      friend_user_id: item.id, // to the user who we click on
      my_user_name: this.authService.userData.username,
      friend_user_name: item.username
    }).subscribe({
      next: (response: any) => {
        console.log('response from add_or_remove_user_friend : ', response)
        if(response.success) {
          if(type === 1) {
            item.in_request = true // add to requests so remove the add button
          } else if (type === 2) {
            item.connected = 0 // removed as friend so connect is false
          }
        } else { // response.success will only be false when adding friend and a request already exists
          // the user request already exists (means some corner case where user duplicated the tabs and went offline in one)
          item.in_request = true // add to requests so remove the add button
          item.connected = 0 // removed as friend so connect is false (in add friend also this will be executed and change to same value)
        }
        this.friendSpinnerMap.delete(item.id) // stopping spinner
      },
      error: () => {
        this.friendSpinnerMap.delete(item.id) // stopping spinner
      }
    })
  }

  addOrRemoveRoomToUser(item: any, type: number) {
    if(this.roomsSpinnerMap.get(item.id)) { return } // if user is trying to click multiple times
    this.roomsSpinnerMap.set(item.id, true)
    console.log('add or delete room clicked -- ', item)
    this.apiService.callApi('add_or_remove_user_room', 'POST', {
      type, // 1 is to add, 2 is to remove
      my_user_id: this.authService.userData.id, // from the logged in user
      room_id: item.id
    }).subscribe({
      next: (response:any) => {
        if(response.success) {
          if(type === 1) {
            item.connected = 1 // room added so remove the add button
          } else if (type === 2) {
            item.connected = 0 // room removed so change remove button
          }
        }
        this.roomsSpinnerMap.delete(item.id) // stopping spinner
      },
      error: () => {
        this.roomsSpinnerMap.delete(item.id) // stopping spinner
      }
    })
  }

  ngOnDestroy() {
    this.requestObjectSubscription?.unsubscribe()
    this.requestActionPerformedSubscription?.unsubscribe()
    this.userUnfriendedSubscription?.unsubscribe()
  }
}