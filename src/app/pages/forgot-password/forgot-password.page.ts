import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Dbservice } from 'src/app/services/dbservice';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: false,
})
export class ForgotPasswordPage implements OnInit {
  mdl_email: string = '';
  
  // REEMPLAZA ESTOS VALORES CON LOS TUYOS DE EMAILJS
  private SERVICE_ID = 'service_bw7r5tq';
  private TEMPLATE_ID = 'template_smk4tek';
  private PUBLIC_KEY = 'DYNFfoxWZWJ1ctMes';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private dbService: Dbservice
  ) { }

  ngOnInit() {
    // Inicializar EmailJS
    emailjs.init(this.PUBLIC_KEY);
  }

  async recuperarPassword() {
    // Validar que el campo no esté vacío
    if (!this.mdl_email) {
      this.presentAlert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    // Validar formato de email
    if (!this.isValidEmail(this.mdl_email)) {
      this.presentAlert('Error', 'Por favor ingresa un email válido');
      return;
    }

    // Mostrar loading
    const loading = await this.loadingController.create({
      message: 'Enviando correo...',
      spinner: 'crescent'
    });
    await loading.present();

    // Verificar si el email existe en la base de datos
    const emailExiste = await this.verificarEmail(this.mdl_email);
    
    if (emailExiste) {
      // ✅ Email existe - Enviar correo con EmailJS
      try {
        await this.enviarEmailRecuperacion(this.mdl_email);
        await loading.dismiss();
        
        this.presentAlert(
          'Correo Enviado', 
          '¡Se ha enviado el correo de recuperación exitosamente! Revisa tu bandeja de entrada.'
        );
        
        // Limpiar campo
        this.mdl_email = '';
      } catch (error) {
        await loading.dismiss();
        console.error('Error al enviar correo:', error);
        this.presentAlert('Error', 'No se pudo enviar el correo. Verifica tu configuración de EmailJS.');
      }
    } else {
      await loading.dismiss();
      // Email no existe
      this.presentAlert('Error', 'No existe una cuenta asociada a este correo electrónico');
    }
  }

  async verificarEmail(email: string): Promise<boolean> {
    try {
      const res = await this.dbService.database.executeSql(
        'SELECT * FROM usuarios WHERE email=?',
        [email]
      );
      
      return res.rows.length > 0;
    } catch (error) {
      console.error('Error al verificar email:', error);
      return false;
    }
  }

  async enviarEmailRecuperacion(email: string): Promise<void> {
    // Configurar el contenido del email
    const templateParams = {
      to_email: email,
      to_name: 'Usuario',
      message: `Hola,

Has solicitado recuperar tu contraseña en la aplicación Finan.

Tu email registrado es: ${email}

Para recuperar tu contraseña, sigue estos pasos:
1. Abre la aplicación Finan
2. Ve a la opción "Perfil"
3. Selecciona "Cambiar Contraseña"
4. Ingresa tu nueva contraseña

Si no solicitaste este cambio, ignora este mensaje.

Saludos,
Equipo Finan`
    };

    // Enviar correo usando EmailJS
    const response = await emailjs.send(
      this.SERVICE_ID,
      this.TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Correo enviado exitosamente:', response);
  }

  goToLogin() {
    this.router.navigate(['/login']);
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