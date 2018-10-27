import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IonicPageModule, Config } from 'ionic-angular';

import { ItemCreatePage } from './item-create';
import {Items} from '../../providers';

@NgModule({
  declarations: [
    ItemCreatePage
  ],
  imports: [
    IonicPageModule.forChild(ItemCreatePage),
    TranslateModule.forChild(),
  ],
  exports: [
    ItemCreatePage
  ],
  providers:[Items]
})
export class ItemCreatePageModule { }
