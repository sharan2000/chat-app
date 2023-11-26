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
  usersAndRoomsData = new Subject<string[]>()
  socket: any

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  

  initializeChatSocket() {
    this.socket = io(this.SERVER_ADDRESS, {
      auth: {
        Authorization: sessionStorage.getItem('token'),
        session_token: sessionStorage.getItem('session_token')
      },
      withCredentials: true,
    })

    this.socket.on("connect_error", (err: any) => {
      // user not authenticated so loggin out
      console.log('Error in authentication of socket -- ', err.message);
      // this.authService.logout()
      // this.router.navigate(['/auth'], { queryParams: {type: 'login'} })
    });

    this.socket.on("users_data", (data: any) => {
      this.usersAndRoomsData.next(data)
    });

    this.socket.on("connected_to_session", (session_token: any) => {
      sessionStorage.setItem('session_token', session_token)

      window.addEventListener("beforeunload", (event) => {
        this.emitUserExit()
      })
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

  emitUserExit() {
    this.socket.emit('user_exit', true)
  }
}