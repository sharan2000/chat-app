import { Injectable } from '@angular/core'
import { BehaviorSubject, Subject } from 'rxjs'
import { io } from 'socket.io-client'
import { AuthService } from '../auth/auth.service'
import { Router } from '@angular/router'

@Injectable()
export class ChatService {
  SERVER_PORT = 1111
  CHAT_NAMESPACE = "/chat"
  SERVER_ADDRESS = 'http://127.0.0.1:' + this.SERVER_PORT + this.CHAT_NAMESPACE
  newMessages = new BehaviorSubject<string>('')
  socket: any

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  

  initializeChatSocket() {
    this.socket = io(this.SERVER_ADDRESS, {
      auth: {
        Authorization: sessionStorage.getItem('token')
      }
    })

    this.socket.on("connect_error", (err: any) => {
      // user not authenticated so loggin out
      console.log('Error in authentication of socket -- ', err.message);
      // this.authService.logout()
      // this.router.navigate(['/auth'], { queryParams: {type: 'login'} })
    });
  }

  sendMessage(body: any) {
    this.socket.emit('send_message', body)
  }

  startReceivingMessage() {
    this.socket.on('new_message', (data: any) => {
      this.newMessages.next(data)
    })
    return this.newMessages.asObservable()
  }

  disconnectUser() {
    this.socket.disconnect()
  }
}