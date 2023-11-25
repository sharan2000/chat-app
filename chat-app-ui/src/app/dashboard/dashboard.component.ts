import { ApiService } from './../api.service';
import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html' 
})
export class DashboardComponent implements OnInit {
  message: string = 'Welcome to chat app!'

  constructor(
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.apiService.callApi('dashboard_data', 'GET').subscribe({
      next: (response) => {
        console.log('response of get dashboard data -- ', response)
      }
    })
  }
}
