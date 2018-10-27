import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 * Api is a generic REST Api handler. Set your API url first.
 */
@Injectable()
export class Api {
  url: string = 'http://192.168.43.105:3000';
  noAuthorization = ['login'];
  constructor(public http: HttpClient) {
  }

  setRequestOptions() {
    return {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    };
  }

  setAuthorizationToken(reqOpts) {
    reqOpts.headers = Object.assign({ 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }, reqOpts.headers);
  }
  get(endpoint: string, params?: any) {
    var reqOpts = {};
    if (this.noAuthorization.indexOf(endpoint) === -1){
      reqOpts = Object.assign({'withCredentails':true}, reqOpts);
      this.setAuthorizationToken(reqOpts);
    }
    if (params) {
      reqOpts['params'] = new HttpParams();
      for (let k in params) {
        reqOpts['params'] = reqOpts['params'].set(k, params[k]);
      }
    }
    debugger;
    return this.http.get(this.url + '/' + endpoint, reqOpts);
  }

  post(endpoint: string, body: any, addreqOptions: any = null) {
    let reqOpts = this.setRequestOptions();
    if (this.noAuthorization.indexOf(endpoint) === -1){
      reqOpts = Object.assign({'withCredentails':true}, reqOpts);
      this.setAuthorizationToken(reqOpts);
    }
    debugger;

    return this.http.post(this.url + '/' + endpoint, body, reqOpts);
  }

  put(endpoint: string, body: any) {
    return this.http.put(this.url + '/' + endpoint, body, this.setRequestOptions());
  }

  delete(endpoint: string) {
    return this.http.delete(this.url + '/' + endpoint, this.setRequestOptions());
  }

  patch(endpoint: string, body: any) {
    return this.http.patch(this.url + '/' + endpoint, body, this.setRequestOptions());
  }
}
