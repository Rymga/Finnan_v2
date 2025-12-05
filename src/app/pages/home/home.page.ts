import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth';
import { Dbservice } from  'src/app/services/dbservice';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  // Datos del usuario
  username: string = 'Usuario';
  userId: number | null = null;

  // Datos financieros
  ingresos: number = 0;
  gastos: number = 0;
  balance: number = 0;
  porcentajeGastado: number = 0;
  mensajeMotivacional: string = '';

  // Fecha actual
  mesActual: string = '';

  // Gastos por categoría
  gastosPorCategoria: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private dbService: Dbservice
  ) { }

  async ngOnInit() {
    // Obtener datos del usuario
    await this.cargarDatosUsuario();
    
    // Cargar datos financieros
    await this.cargarDatosFinancieros();
  }
    goToTansaction() {
    this.router.navigate(['/transaction']);
  }

  async ionViewWillEnter() {
    // Recargar datos cada vez que se entra a la página
    await this.cargarDatosFinancieros();
  }

  async cargarDatosUsuario() {
    this.username = await this.authService.getUserName() || 'Usuario';
    this.userId = await this.authService.getUserId();
    
    // Obtener mes actual
    const fecha = new Date();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.mesActual = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
  }

  async cargarDatosFinancieros() {
    if (!this.userId) return;

    const fecha = new Date();
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();

    try {
      // Obtener resumen del mes
      const resumen = await this.dbService.obtenerResumenMes(this.userId, mes, anio);
      this.ingresos = resumen.ingresos;
      this.gastos = resumen.gastos;
      this.balance = resumen.balance;

      // Calcular porcentaje gastado
      if (this.ingresos > 0) {
        this.porcentajeGastado = Math.round((this.gastos / this.ingresos) * 100);
      } else {
        this.porcentajeGastado = 0;
      }

      // Generar mensaje motivacional
      this.generarMensajeMotivacional();

      // Obtener gastos por categoría
      this.gastosPorCategoria = await this.dbService.obtenerGastosPorCategoria(this.userId, mes, anio);
      
      // Calcular porcentajes
      if (this.gastos > 0) {
        this.gastosPorCategoria = this.gastosPorCategoria.map(cat => ({
          ...cat,
          porcentaje: Math.round((cat.total / this.gastos) * 100)
        }));
      }

    } catch (error) {
      console.error('Error al cargar datos financieros:', error);
    }
  }

  generarMensajeMotivacional() {
    if (this.ingresos === 0) {
      this.mensajeMotivacional = 'Empieza a registrar tus ingresos y gastos para llevar un mejor control.';
    } else if (this.porcentajeGastado < 30) {
      this.mensajeMotivacional = `¡Excelente! Solo has gastado el ${this.porcentajeGastado}% de tus ingresos este mes.`;
    } else if (this.porcentajeGastado < 50) {
      this.mensajeMotivacional = `¡Vas muy bien! Has gastado el ${this.porcentajeGastado}% de tus ingresos este mes.`;
    } else if (this.porcentajeGastado < 70) {
      this.mensajeMotivacional = `Atención: Has gastado el ${this.porcentajeGastado}% de tus ingresos. Controla tus gastos.`;
    } else if (this.porcentajeGastado < 100) {
      this.mensajeMotivacional = `¡Cuidado! Has gastado el ${this.porcentajeGastado}% de tus ingresos. Reduce gastos.`;
    } else {
      this.mensajeMotivacional = `¡Alerta! Has gastado más de lo que ganaste este mes (${this.porcentajeGastado}%).`;
    }
  }

  async logout() {
    await this.authService.logout();
  }

  getCategoryColor(color: string): string {
    const colors: any = {
      'primary': '#3880ff',
      'secondary': '#3dc2ff',
      'tertiary': '#5260ff',
      'success': '#2dd36f',
      'warning': '#ffc409',
      'danger': '#eb445a',
      'dark': '#222428',
      'medium': '#92949c',
      'light': '#f4f5f8'
    };
    return colors[color] || '#3880ff';
  }

}