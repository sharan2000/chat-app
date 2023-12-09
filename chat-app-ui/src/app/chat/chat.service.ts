import { Injectable } from '@angular/core'
import { BehaviorSubject, Subject } from 'rxjs'
import { io } from 'socket.io-client'
import { Router } from '@angular/router'

@Injectable()
export class ChatService {
  SERVER_PORT = 1111
  CHAT_NAMESPACE = "/chat"
  SERVER_ADDRESS = 'http://127.0.0.1:' + this.SERVER_PORT + this.CHAT_NAMESPACE
  newMessages = new BehaviorSubject<string>('')
  usersAndRoomsData = new Subject<string[]>()
  userStatus = new Subject<any>()
  socket: any

  constructor(
    private router: Router,
  ) {}
  

  initializeChatSocket() {
    this.socket = io(this.SERVER_ADDRESS, {
      auth: {
        Authorization: sessionStorage.getItem('token'),
      },
      withCredentials: true,
    })

    this.socket.on("send_user_session_token", () => {
      this.socket.emit('user_session_token', sessionStorage.getItem('session_token'))
    });

    this.socket.on("connect_error", (err: any) => {
      // user not authenticated so loggin out
      console.log('Error in authentication of socket -- ', err.message);
      // this.router.navigate(['/auth'], { queryParams: {type: 'login'} })
    });

    this.socket.on("users_and_rooms_data", (data: any) => {
      this.usersAndRoomsData.next(data)
    });

    this.socket.on("user_connection_status", (userStatus: any) => {
      this.userStatus.next(userStatus)
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