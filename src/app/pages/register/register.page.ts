import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AlertController } from '@ionic/angular'; 

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {

  mdl_nombre: string = '';
  mdl_email: string = '';
  mdl_password: string = '';
  mdl_confirm_password: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
  }

  async register() {
    // Validar campos vacío
    if (!this.mdl_nombre || !this.mdl_email || !this.mdl_password || !this.mdl_confirm_password) {
      this.presentAlert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Validar que las contraseñas coincidan
    if (this.mdl_password !== this.mdl_confirm_password) {
      this.presentAlert('Error', 'Las contraseñas no coinciden');
      return;
    }

    // Validar longitud mínima de contraseña
    if (this.mdl_password.length < 6) {
      this.presentAlert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar formato de email
    if (!this.isValidEmail(this.mdl_email)) {
      this.presentAlert('Error', 'Por favor ingresa un email válido');
      return;
    }

    // Intentar registrar
    const registroExitoso = await this.authService.register(this.mdl_nombre, this.mdl_email, this.mdl_password);

    if (registroExitoso) {
      this.presentAlert('Éxito', 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
      this.limpiarCampos();
      setTimeout(() => {
        this.goToLogin();
      }, 2000);
    } else {
      this.presentAlert('Error', 'No se pudo registrar el usuario. Es posible que el email ya esté en uso.');
    }
    
    
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  limpiarCampos() {
    this.mdl_nombre = '';
    this.mdl_email = '';
    this.mdl_password = '';
    this.mdl_confirm_password = '';
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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