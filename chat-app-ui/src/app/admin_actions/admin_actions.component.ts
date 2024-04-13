import { ChatService } from '../chat/chat.service';
import { ApiService } from './../api.service';
import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app-admin_action',
  templateUrl: './admin_actions.component.html' 
})
export class AdminActionsComponent implements OnInit {
  showAddModal = false
  enteredRoomName = ''
  errorResponse: any
  modalViewNumber = 1
  spinner = false

  constructor(
    private apiService: ApiService,
    private chatService: ChatService
  ) {}

  ngOnInit() {

  }

  openRoomModal() {
    this.showAddModal = true
    this.enteredRoomName = ''
    this.errorResponse = null
    this.modalViewNumber = 1
  }

  removeExtraSpaces(variable: string) {
    switch(variable) {
      case 'enteredRoomName' :
        this.enteredRoomName = this.enteredRoomName.replace(/ {2,}/g, '')
        break
    }
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
}
