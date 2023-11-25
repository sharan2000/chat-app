import { Component, OnInit, OnDestroy } from "@angular/core";
import { ChatService } from "./chat.service";
import { Subscription } from "rxjs";
import { AuthService } from "../auth/auth.service";

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    providers: [ChatService]
})
export class ChatComponent implements OnInit {
  userEnteredMessage: string = ''
  message: string = 'this is chat screen'
  newMessagesSubscription: Subscription | undefined
  messageArray: any[] = []

  constructor(
    protected authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    // new user is being connected
    this.chatService.initializeChatSocket()

    this.newMessagesSubscription = this.chatService.startReceivingMessage().subscribe({
      next: (body: any) => {
        this.messageArray.push(body)
      }
    })
  }

  sendMessage() {
    console.log('sending')
    this.chatService.sendMessage({
      username: this.authService.userData['username'],
      message: this.userEnteredMessage,
      message_type: 'message',
      sent_on: new Date()
    })
  }

  logArray() {
    console.log('messages array -- ', this.messageArray)
  }

  ngOnDestroy() {
    this.chatService.disconnectUser()
    this.newMessagesSubscription?.unsubscribe()
  }

}