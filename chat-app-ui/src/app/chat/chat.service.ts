import { Injectable, OnDestroy } from '@angular/core'
import { Subject } from 'rxjs'
import { io } from 'socket.io-client'
import { Router } from '@angular/router'
import { UserDataType, RoomDataType } from '../utils/data-types'

@Injectable()
export class ChatService implements OnDestroy {
  SERVER_PORT = 1111
  CHAT_NAMESPACE = "/chat"
  SERVER_ADDRESS = 'http://127.0.0.1:' + this.SERVER_PORT + this.CHAT_NAMESPACE
  newMessages = new Subject<string>()
  userStatus = new Subject<any>()
  roomsData = new Subject<any>()
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

    this.socket.on("user_connection_status", (userStatus: any) => {
      this.userStatus.next(userStatus)
    });

    this.socket.on("new_room_added", (roomData: any) => {
      this.roomsData.next(roomData)
      this.socket.emit('join_new_room', roomData.room_name)
    });

    this.socket.on("connected_to_session", (session_token: any) => {
      sessionStorage.setItem('session_token', session_token)

      window.addEventListener("beforeunload", (event) => {
        this.emitUserExit()
      })
    });

    this.socket.on('new_message', (data: any) => {
      this.newMessages.next(data)
    })
  }

  sendMessage(body: any) {
    this.socket.emit('send_message', body)
  }

  emitNewRoomDetails(roomname: string) {
    this.socket.emit('emit_new_room_details', roomname)
  }

  emitUserExit() {
    this.socket.emit('user_exit', true)
  }

  ngOnDestroy() {
    this.emitUserExit() // to delete the user session session
    this.socket.disconnect() // to disconnect the socket
  }
}