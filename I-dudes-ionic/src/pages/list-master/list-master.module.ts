import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IonicPageModule } from 'ionic-angular';

import { ListMasterPage } from './list-master';
import { Items } from '../../providers';
import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';
const config: SocketIoConfig = { url: 'http://192.168.43.105:3000/chatroom', options: {transports: ['websocket']} };
@NgModule({
  declarations: [
    ListMasterPage,
  ],
  imports: [
    IonicPageModule.forChild(ListMasterPage),
    TranslateModule.forChild(),
    SocketIoModule.forRoot(config)
  ],
  exports: [
    ListMasterPage
  ],
  providers:[
    Items
  ]
})
export class ListMasterPageModule { }
