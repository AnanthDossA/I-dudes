import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, ToastController, IonicPage } from 'ionic-angular';

import { Items } from '../../providers';
import { Socket } from 'ng-socket-io';
import { Item } from '../../models/item';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';

import { Camera, CameraOptions } from '@ionic-native/camera';
import { DomSanitizer } from '@angular/platform-browser';

@IonicPage()
@Component({
  selector: 'page-item-detail',
  templateUrl: 'item-detail.html'
})
export class ItemDetailPage {
  item: any;
  roomDetail: object;
  planList: string[];
  planname: string;
  imageURI: any;
  imageFileName: any;
  base64Image: any
  imgUrl: any;
  selectedPlan: any;
  constructor(public navCtrl: NavController, public loadingCtrl: LoadingController, public toastCtrl: ToastController, private file: File,
    private navParams: NavParams, public items: Items, private socket: Socket, private transfer: FileTransfer, public domSanitizer: DomSanitizer,
    private camera: Camera) {

  }

  getImage(selectedPlan) {
    this.selectedPlan = selectedPlan;
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.NATIVE_URI,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY
    }
    this.camera.getPicture(options).then((imageData) => {
      this.imageURI = imageData;
      this.makeFileIntoBlob(this.imageURI).then(file => {
        this.base64Image = file;
      }).catch(e => {
        this.presentToast(e);
      })
    });
  }

  makeFileIntoBlob(_imagePath) {
    return new Promise((resolve, reject) => {
      this.file.resolveLocalFilesystemUrl(_imagePath).then((fileEntry: any) => {
        fileEntry.file((resFile) => {
          var reader = new FileReader();
          reader.onloadend = (evt: any) => {
            var imgBlob: any = evt.target.result;
            resolve(imgBlob);
          };
          reader.onerror = (e) => {
            console.log('Failed file read: ' + e.toString());
            reject(e);
          };
          reader.readAsDataURL(resFile);
        });
      });
    });
  }

  uploadFile() {
    let loader = this.loadingCtrl.create({
      content: "Uploading..."
    });
    loader.present();
    const fileTransfer: FileTransferObject = this.transfer.create();

    let options: FileUploadOptions = {
      fileKey: 'ionicfile',
      fileName: 'retrieve',
      chunkedMode: false,
      mimeType: "image/jpeg"
    }
    var headers = {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'name': this.selectedPlan.name,
      'roomId': this.item._id
    };
    options.headers = headers;
    fileTransfer.upload(this.imageURI, 'http://192.168.43.105:3000/upload', options)
      .then((data) => {
        console.log(data + " Uploaded Successfully");
        this.imageFileName = "ionicfile.jpg"
        loader.dismiss();
        this.presentToast("Image uploaded successfully");
      }, (err) => {
        console.log(err);
        loader.dismiss();
        this.imgUrl = JSON.stringify(err);
        this.presentToast(JSON.stringify(err));
      });
  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      duration: 3000,
      position: 'bottom'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  ionViewWillEnter() {
    this.loadPlan(this.navParams.get('item'));
    this.socket.on('connect', () => {
      this.socket.emit('join', { 'roomId': this.navParams.get('item')._id });
      this.socket.on('updateUsersList', function (msg) {
        debugger;
      })

    });
    this.socket.on('addMessage', (msg) => {
      debugger;
      alert(msg.name + "   " + msg.message);
    })
  }

  loadPlan(input = {}) {
    this.setPlanItem(input);
    this.getRoomDetail();
  }

  setPlanItem(input) {
    this.item = input;
  }

  createNewItem() {
    this.items.createNewItem({ 'name': this.planname, 'roomId': this.item._id }).subscribe(response => {
      this.getRoomDetail();
    })
  }

  getRoomDetail() {
    this.items.getRoomDetail({ roomId: this.item._id }).subscribe((res) => {
      this.roomDetail = res.data
      this.planList = res.data.planItems || [];
    });
  }

  openItem(plan, attachment: Item) {
    this.items.addAttachment({ 'name': plan.name, 'roomId': this.item._id, 'attachment': 'static attachment' }).subscribe(response => {
      this.getRoomDetail();
    })
  }

  sendNewMessage(newMessage) {
    this.socket.emit('newMessage', this.item._id, newMessage);
  }
}
