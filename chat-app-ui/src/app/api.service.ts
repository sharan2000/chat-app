import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core'
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ApiService {
  SERVER_PORT = 1111
  SERVER_ADDRESS = 'http://127.0.0.1:' + this.SERVER_PORT

  constructor(
    private httpClient: HttpClient,
  ) {}

  callApi(url: string, method: string, body = {}) {
    url = this.SERVER_ADDRESS + '/' + url
    let headers = new HttpHeaders().append('Content-Type', 'application/json')
    
    if(method === 'POST') {
      return this.httpClient.post(url, body, {
        headers: headers
      })
    }
    else if(method === 'GET') {
      return this.httpClient.get(url, {
        headers: headers
      })
    }
    else {
      return this.httpClient.get(this.SERVER_ADDRESS)
    }
  }
}