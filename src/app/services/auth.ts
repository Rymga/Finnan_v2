import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';
import { User } from '../class/user';
import { Dbservice } from './dbservice';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  //saber si el usuario está autenticado
  private authState = new BehaviorSubject<boolean>(false);
  
  //almacenar el usuario actual
  private currentUser = new BehaviorSubject<User | null>(null);

  // Variable para verificar si Storage está listo
  private storageReady = false;

  constructor(
    private storage: Storage,
    private dbService: Dbservice,
    private router: Router
  ) {
    this.initStorage();
  }

  /**
   * Inicializar Ionic Storage
   */
  async initStorage() {
    await this.storage.create();
    this.storageReady = true;
    // Verificar si hay una sesión activa al iniciar
    this.checkAuthStatus();
  }

  /**
   * Verificar si hay una sesión guardada
   */
  async checkAuthStatus() {
    if (!this.storageReady) {
      await this.initStorage();
    }

    const userId = await this.storage.get('userId');
    
    if (userId) {
      // Usuario está autenticado
      this.authState.next(true);
      
      // Obtener datos del usuario
    } else {
      this.authState.next(false);
    }
  }

  /**
   * Login de usuario
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      // Verificar credenciales en la base de datos
      const user = await this.dbService.loginUsuario(email, password);
      
      if (user) {
        // Guardar el userId en el storage (persistencia)
        await this.storage.set('userId', user.id);
        await this.storage.set('userName', user.nombre);
        await this.storage.set('userEmail', user.email);
        
        // Actualizar el estado de autenticación
        this.authState.next(true);
        this.currentUser.next(user);
        
        // Redirigir al home
        this.router.navigate(['/home']);
        
        return true;
      } else {
        // Credenciales incorrectas
        return false;
      }
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(nombre: string, email: string, password: string) {
    try {
      const resultado = await this.dbService.addUsuario(nombre, email, password);
      if (resultado) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en registro:', error);
      return false;
    }
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    // Limpiar todo el storage
    await this.storage.clear();
    
    // Actualizar el estado
    this.authState.next(false);
    this.currentUser.next(null);
    
    // Redirigir al login
    this.router.navigate(['/login']);
  }

  /**
   * Obtener el estado de autenticación como Observable
   */
  isAuthenticated() {
    return this.authState.asObservable();
  }

  /**
   * Obtener el usuario actual como Observable
   */
  getCurrentUser() {
    return this.currentUser.asObservable();
  }

  /**
   * Obtener el ID del usuario logueado
   */
  async getUserId(): Promise<number | null> {
    return await this.storage.get('userId');
  }

  /**
   * Obtener el nombre del usuario logueado
   */
  async getUserName(): Promise<string | null> {
    return await this.storage.get('userName');
  }

  /**
   * Obtener el email del usuario logueado
   */
  async getUserEmail(): Promise<string | null> {
    return await this.storage.get('userEmail');
  }

  /**
   * Verificar si el usuario está autenticado
   */
  getAuthState(): boolean {
    return this.authState.value;
  }
}