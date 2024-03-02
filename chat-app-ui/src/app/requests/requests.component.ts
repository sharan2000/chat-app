import { ChatService } from './../chat/chat.service';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core'
import { ApiService } from '../api.service'
import { AuthService } from '../auth/auth.service'
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html'
})
export class RequestsComponent implements OnInit, OnDestroy {
  requests: any[] = []
  spinner = false
  requestObjectSubscription: Subscription|undefined
  requestActionPerformedSubscription: Subscription|undefined
  requestActionSpinner = new Map()


  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private chatService: ChatService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.requestObjectSubscription = this.chatService.requestObject.subscribe({
      next: (object) => {
        // new request is added. So we should update our list
        this.requests.push(object.data)
      }
    })

    this.requestActionPerformedSubscription = this.chatService.requestActionPerformed.subscribe({
      next: (object) => {
        // some request action has been performed so we just remove that request from list.
        this.requests = this.requests.filter(request => request.id != object.request_id)
      }
    })

    this.getMyRequests()
  }

  getMyRequests() {
    this.spinner = true
    this.apiService.callApi('get_my_requests', 'POST', {
      my_user_id: this.authService.userData.id
    }).subscribe({
      next: (response: any) => {
        console.log('response from get_my_requests : ',  response)
        this.spinner = false
        if(response.success) {
          this.requests = response.requests
        } else [
          this.requests = []
        ]        
      }, error: () => {
        this.spinner = false
        this.requests = []
      }
    })
  }

  takeAction(type: number, item: any) {
    this.requestActionSpinner.set(item.id, true)
    console.log('take action type -- ', item)
    /*
      - here type '1' means 'Accept' the request
      - here type '2' means both 'Cancel' or 'Reject' because in both cases we just delete the record from
        user_requests table
    */
    this.apiService.callApi('take_action_on_request', 'POST', {
      request_id: item.id,
      other_username: item.username,
      type
    }).subscribe({
      next: (response: any) => {
        console.log('response from take_action_on_request : ',  response)
        this.requestActionSpinner.delete(item.id)
        if(!response.success) {
          this.toastr.error('Action cannot be performed. Updating the requests.');
        }
      }, error: () => {
        this.toastr.error('Action cannot be performed. Updating the requests.');
        this.requestActionSpinner.delete(item.id)
      }
    })
  }

  ngOnDestroy(): void {
    this.requestObjectSubscription?.unsubscribe()
    this.requestActionPerformedSubscription?.unsubscribe()
  }

}