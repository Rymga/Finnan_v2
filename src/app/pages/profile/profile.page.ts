import { Component, OnInit } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth';
import { Dbservice } from 'src/app/services/dbservice';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {

  // Datos del usuario
  userId: number | null = null;
  nombre: string = '';
  email: string = '';
  fotoPerfil: string = '';

  constructor(
    private authService: AuthService,
    private dbService: Dbservice,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    await this.cargarDatosUsuario();
  }

  async ionViewWillEnter() {
    await this.cargarDatosUsuario();
  }

  async cargarDatosUsuario() {
    // Obtener datos básicos del storage
    this.userId = await this.authService.getUserId();
    this.nombre = await this.authService.getUserName() || 'Usuario';
    this.email = await this.authService.getUserEmail() || 'email@ejemplo.com';

    // Obtener foto de la base de datos
    if (this.userId) {
      const usuario = await this.dbService.obtenerUsuarioPorId(this.userId);
      if (usuario && usuario.fotoPerfil) {
        this.fotoPerfil = usuario.fotoPerfil;
      }
    }
  }

  async cambiarFoto() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Selecciona una opción',
      buttons: [
        {
          text: 'Tomar Foto',
          icon: 'camera',
          handler: () => {
            this.tomarFoto(CameraSource.Camera);
          }
        },
        {
          text: 'Elegir de Galería',
          icon: 'images',
          handler: () => {
            this.tomarFoto(CameraSource.Photos);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async tomarFoto(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: source
      });

      // Convertir a formato completo Base64
      const imageBase64 = `data:image/jpeg;base64,${image.base64String}`;

      // Actualizar en la base de datos
      if (this.userId) {
        const resultado = await this.dbService.updateFotoPerfil(this.userId, imageBase64);
        
        if (resultado) {
          // Actualizar la vista
          this.fotoPerfil = imageBase64;
          this.presentAlert('Éxito', 'Foto de perfil actualizada correctamente');
        }
      }

    } catch (error) {
      console.error('Error al tomar foto:', error);
      this.presentAlert('Error', 'No se pudo capturar la imagen');
    }
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

}