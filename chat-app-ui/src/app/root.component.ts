import { Router } from '@angular/router';
import { ChatService } from './chat/chat.service';
import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app-root',
  templateUrl: './root.component.html',
  providers: [ChatService]
})
export class RootComponent implements OnInit {
  constructor(
    private chatService: ChatService,
    private router: Router 
  ) {
    console.log('root component triggered -- ');
    if(window.location.pathname === '/') {
      /*
        - in this application we don't have a root route that displays data. (ex: 'localhost:4200/')
        - this root component is only rendered when the user is authenticated.
        - if the user is authenticated then he only has paths like '/chat', '/dashboard' to goto.
        - if the user came to this root component and does not have any path then it means that the user
          typed a empty path when logged in so we should redirect him to '/dashboard' 
      */
      this.router.navigate(['dashboard']);
    }
  }

  ngOnInit() {
    this.chatService.initializeChatSocket()
  }

  /* 
    - we use this component as the parent of all the components except for the auth route and any
      other unregistered routes.
    - we need to connect our socket only once the user logs in and need to do that every time the
      user reloads the page.
    - to cover all these cases we can just create a root component that covers all the routes when
      the user is loggedin and initialize the socket service here once.
  */
}