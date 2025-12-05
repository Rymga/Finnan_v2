import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Dbservice } from './services/dbservice';
import { AuthService } from './services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  
  userName: string = 'Usuario';
  userPhoto: string = '';

  constructor(
    private platform: Platform,
    private dbService: Dbservice,
    private authService: AuthService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    
    // Esperar a que la BD esté lista
    this.dbService.dbState().subscribe(async (ready) => {
      if (ready) {
        console.log('Base de datos lista');
        // Cargar datos del usuario si hay sesión
        await this.loadUserData();
      }
    });
  }

  async loadUserData() {
    // Cargar nombre
    this.userName = await this.authService.getUserName() || 'Usuario';
    
    // Cargar foto de perfil
    const userId = await this.authService.getUserId();
    if (userId) {
      const usuario = await this.dbService.obtenerUsuarioPorId(userId);
      if (usuario && usuario.fotoPerfil) {
        this.userPhoto = usuario.fotoPerfil;
      }
    }
  }

  // Método para recargar datos del usuario (llamar desde profile después de cambiar foto)
  async refreshUserData() {
    await this.loadUserData();
  }
}