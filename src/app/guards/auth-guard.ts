import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    // Esperar a que el storage esté listo
    await this.authService.checkAuthStatus();
    
    // Verificar si hay sesión activa
    const isAuthenticated = this.authService.getAuthState();
    
    if (isAuthenticated) {
      // Usuario logueado, puede pasar
      return true;
    } else {
      // No está logueado, redirigir al login
      console.log('Acceso denegado. Redirigiendo al login...');
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }
  }
}