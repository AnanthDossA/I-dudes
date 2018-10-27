import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IonicPageModule } from 'ionic-angular';
import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';

import { ItemDetailPage } from './item-detail';
import { Items } from '../../providers';
const config: SocketIoConfig = {
  url: 'http://192.168.43.105:3000/chatroom', options: {
    query: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  }
};

@NgModule({
  declarations: [
    ItemDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(ItemDetailPage),
    TranslateModule.forChild(),
    SocketIoModule.forRoot(config),

  ],
  exports: [
    ItemDetailPage
  ],
  providers: [Items]
})
export class ItemDetailPageModule { }
