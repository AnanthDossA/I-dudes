import { Injectable } from '@angular/core';

import { Item } from '../../models/item';
import { Api } from '../api/api';
import { Observable } from '../../../node_modules/rxjs/Observable';

@Injectable()
export class Items {

  constructor(public api: Api) { }

  plansList(params?: any): Observable<any> {
    return this.api.get('rooms', params);
  }

  getRoomDetail(params?: any): Observable<any> {
    debugger;
    return this.api.post('room-detail', params);
  }


  add(item: Item): Observable<any> {
    debugger;
    return this.api.post('create-room', item);
  }

  createNewItem(item: Item): Observable<any> {
    return this.api.post('create-new-item', item);
  }

  delete(item: Item) {
  }

  addAttachment(attachment) {
    return this.api.post('create-attachment', attachment);

  }
}
