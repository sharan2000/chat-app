import { Component, OnInit, OnDestroy } from "@angular/core";
import { ChatService } from "./chat.service";
import { Subscription } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { ApiService } from "../api.service";
import { UserDataType, RoomDataType } from '../utils/data-types'

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
  roomsDataSubscription : Subscription | undefined
  messageArray: any[] = []
  usersDataObject: any
  usersDataValues: any
  roomsDataObject: any
  roomsDataValues: any
  selectedChat: any
  authLoggedInSubscription: Subscription|undefined
  chatSpinner = false
  namesFilter = ''
  hideMenu = false
  showAddModal = false
  enteredRoomName = ''
  spinner = false
  errorResponse: any
  modalViewNumber = 1
  
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
      next: (data: {
        usersData : UserDataType
        roomsData : RoomDataType
      }) => {
        this.usersDataObject = data['usersData']
        this.usersDataValues = Object.values(this.usersDataObject)

        this.roomsDataObject = data['roomsData']
        this.roomsDataValues = Object.values(this.roomsDataObject)
        console.log('in subscription of users and rooms data --', data)
      }
    })

    this.userStatusSubscription = this.chatService.userStatus.subscribe({
      next: (userStatus: any) => {
        this.usersDataObject[userStatus.username].connected = userStatus.connected
        if(this.selectedChat?.connected != undefined && this.selectedChat?.name === userStatus.username) {
          this.selectedChat.connected = userStatus.connected
        }
        console.log('in subscription of user status --', userStatus)
      }
    })

    this.roomsDataSubscription = this.chatService.roomsData.subscribe({
      next: (data: any) => {
        this.roomsDataObject[data.room_name] = data
        this.roomsDataValues.push(data)
      }
    })

    this.newMessagesSubscription = this.chatService.newMessages.subscribe({
      next: (body: any) => {
        // if the user did not select any chat we don't need to do the below process because there won't be any messages array for the user to see. 
        if(!this.selectedChat) { return }

        console.log('new message -- ', body)
        // user can receive different messages(from different rooms and chats). but we should add a new message to array only if the message is coming in the current select chat of the user (ie., between current user and selected (user or room))
        if((body.is_room && body.to === this.selectedChat.name) || (!body.is_room && (((body.from === this.selectedChat.name) && (body.to === this.authService.userData['username'])) || (body.from === this.authService.userData['username']) && (body.to === this.selectedChat.name)))) {
          this.messageArray.push({
            name: body.from,
            message: body.message,
            time: body.time
          })
          this.scrollToBottomOfChat(true) // true for smooth scroll
        }
      }
    })
  }

  sendMessage() {
    this.chatService.sendMessage({
      from: this.authService.userData['username'],
      to: this.selectedChat.name,
      message: this.userEnteredMessage,
      selected_is_user: this.selectedChat.is_user
    })
    this.userEnteredMessage = ''
  }

  // when user chat is selected; i.e, one-on-one chat
  chatSelected(selecteItem: any) {
    this.chatSpinner = true
    console.log('selected chat --- ', selecteItem)
    this.selectedChat = {
      name: selecteItem.username,
      connected: selecteItem.connected,
      is_user: true
    }
    let payload = {
      from: this.authService.userData.username,
      to: this.selectedChat.name
    }
    this.apiService.callApi('get_chat', 'POST', payload).subscribe({
      next: (response: any) => {
        console.log(`chat between '${this.authService.userData.username}' and '${selecteItem.username}' -- `, response)
        this.messageArray = response.messages
        this.chatSpinner = false
        this.scrollToBottomOfChat() // scroll to bottom of page
      },
      error: (errorResponse: any) => {
        this.chatSpinner = false
      }
    })
  }

  // when any other chat is selected; i.e, NOT one-on-one chat (rooms, etc)
  chatRoomSelected(selecteItem: any) {
    this.chatSpinner = true
    console.log('selected chat room --- ', selecteItem)
    this.selectedChat = {
      name: selecteItem.room_name
    }
    let payload = {
      to: this.selectedChat.name
    }
    this.apiService.callApi('get_chat_for_room', 'POST', payload).subscribe({
      next: (response: any) => {
        console.log(`chat for room '${this.selectedChat.name}' -- `, response)
        this.messageArray = response.messages
        this.chatSpinner = false
        this.scrollToBottomOfChat() // scroll to bottom of page
      },
      error: (errorResponse: any) => {
        this.chatSpinner = false
      }
    })
  }

  scrollToBottomOfChat(smooth = false) {
    setTimeout(() => {
      const identifiedElement = document.getElementById('page-content-wrapper')
      identifiedElement?.scrollTo({
        top: identifiedElement?.scrollHeight,
        behavior: smooth ? "smooth" : 'instant' 
      });
    }, 15)
  }

  scrollToTopOfChat() {
    document.getElementById('page-content-wrapper')?.scrollTo({
      top: 0
    });
  }

  removeExtraSpaces(variable: string) {
    switch(variable) {
      case 'userEnteredMessage' :
        this.userEnteredMessage = this.userEnteredMessage.replace(/ {2,}/g, '')
        break
      case 'enteredRoomName' :
        this.enteredRoomName = this.enteredRoomName.replace(/ {2,}/g, '')
        break
    }
  }

  filterNames() {
    this.usersDataValues = Object.values(this.usersDataObject).filter((data:any) => {
      return data.username.includes(this.namesFilter)
    })

    this.roomsDataValues = Object.values(this.roomsDataObject).filter((data:any) => {
      return data.room_name.includes(this.namesFilter)
    })
  }

  onAddRoom() {
    this.spinner = true
    console.log(this.enteredRoomName)
    this.apiService.callApi('add_new_chat_room', 'POST', { enteredRoomName : this.enteredRoomName }).subscribe({
      next: (response: any) => {
        this.spinner = false
        if(response.success) {
          this.chatService.emitNewRoomDetails(this.enteredRoomName)
          this.modalViewNumber = 2
        } else {
          this.errorResponse = response.error
        }
      },
      error: (errorResponse: any) => {
        this.spinner = false
        this.errorResponse = {
          roomname: 'Network error. Please try again.'
        }
      }
    })
  }

  openRoomModal() {
    this.showAddModal = true
    this.enteredRoomName = ''
    this.errorResponse = null
    this.modalViewNumber = 1
  }

  ngOnDestroy() {
    this.newMessagesSubscription?.unsubscribe()
    this.usersAndRoomsSubscription?.unsubscribe()
    this.authLoggedInSubscription?.unsubscribe()
    this.userStatusSubscription?.unsubscribe()
    this.roomsDataSubscription?.unsubscribe()
    this.chatService.disconnectUser()
  }

}