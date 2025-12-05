import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {

  // Variables para enlazar con el formulario
  mdl_email: string = '';
  mdl_password: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
  }

  async login() {

    if (!this.mdl_email || !this.mdl_password) {
      this.presentAlert('Error', 'Por favor completa todos los campos');
      return;
    }
    const loginExitoso = await this.authService.login(this.mdl_email, this.mdl_password);

    if (loginExitoso) {
      console.log('Login exitoso');
    } else {
      this.presentAlert('Error', 'Usuario o contraseña incorrectos');
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
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