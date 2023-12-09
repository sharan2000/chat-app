import { Component, OnInit, OnDestroy } from "@angular/core";
import { ChatService } from "./chat.service";
import { Subscription } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { ApiService } from "../api.service";

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    providers: [ChatService]
})
export class ChatComponent implements OnInit {
  userEnteredMessage: string = ''
  message: string = 'this is chat screen'
  newMessagesSubscription: Subscription | undefined
  usersAndRoomsSubscription: Subscription | undefined
  userStatusSubscription: Subscription | undefined
  messageArray: any[] = []
  usersAndRoomsObject: any
  usersAndRoomsValues: any
  selectedChat: any
  authLoggedInSubscription: Subscription|undefined
  chatSpinner = false

  constructor(
    protected authService: AuthService,
    private chatService: ChatService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
// new user is being connected
    this.chatService.initializeChatSocket()

    this.authLoggedInSubscription = this.authService.authLoggedIn.subscribe({
      next: (isLoggedIn: boolean) => {
        if(!isLoggedIn) {
          this.chatService.emitUserExit()
        }
      }
    })

    this.usersAndRoomsSubscription = this.chatService.usersAndRoomsData.subscribe({
      next: (data) => {
        this.usersAndRoomsObject = data
        this.usersAndRoomsValues = Object.values(this.usersAndRoomsObject)
        console.log('in subscription of users and rooms data --', data)
      }
    })


    this.userStatusSubscription = this.chatService.userStatus.subscribe({
      next: (userStatus: any) => {
        this.usersAndRoomsObject[userStatus.username].connected = userStatus.connected
        console.log('in subscription of user status --', userStatus)
      }
    })


    this.newMessagesSubscription = this.chatService.startReceivingMessage().subscribe({
      next: (body: any) => {
        this.messageArray.push(body)
      }
    })
  }

  sendMessage() {
    console.log('sending')
    this.chatService.sendMessage({
      from: this.authService.userData['username'],
      to: this.selectedChat.username,
      message: this.userEnteredMessage,
    })
    this.userEnteredMessage = ''
  }

  chatSelected(selecteItem: any) {
    this.chatSpinner = true
    console.log('selected chat -- ', selecteItem)
    this.selectedChat = selecteItem
    let payload = {
      from: this.authService.userData.username,
      to: selecteItem.username
    }
    this.apiService.callApi('get_chat', 'POST', payload).subscribe({
      next: (response: any) => {
        console.log(`chat between '${this.authService.userData.username}' and '${selecteItem.username}' -- `, response)
        this.messageArray = response.messages
        this.chatSpinner = false
      },
      error: (errorResponse: any) => {
        this.chatSpinner = false
      }
    })
  }

  removeExtraSpaces(event: any) {
    this.userEnteredMessage = this.userEnteredMessage.replace(/ {2,}/g, '')
  }

  ngOnDestroy() {
    this.newMessagesSubscription?.unsubscribe()
    this.usersAndRoomsSubscription?.unsubscribe()
    this.authLoggedInSubscription?.unsubscribe()
    this.userStatusSubscription?.unsubscribe()
    this.chatService.disconnectUser()
  }

}