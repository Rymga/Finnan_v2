import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth';
import { Dbservice } from 'src/app/services/dbservice';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
  standalone: false,
})
export class StatisticsPage implements OnInit {

  // Datos del usuario
  userId: number | null = null;

  // Período seleccionado
  periodo: string = 'mes';

  // Resúmenes
  resumenActual: any = { ingresos: 0, gastos: 0, balance: 0 };
  resumenAnterior: any = { ingresos: 0, gastos: 0, balance: 0 };

  // Comparación
  mostrarComparacion: boolean = false;
  cambioIngresos: number = 0;
  cambioGastos: number = 0;

  // Gastos por categoría
  gastosPorCategoria: any[] = [];

  // Historial de meses
  historialMeses: any[] = [];

  // Control
  hayDatos: boolean = false;

  constructor(
    private authService: AuthService,
    private dbService: Dbservice
  ) { }

  async ngOnInit() {
    this.userId = await this.authService.getUserId();
    await this.cargarDatos();
  }

  async ionViewWillEnter() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    if (!this.userId) return;

    if (this.periodo === 'mes') {
      await this.cargarDatosMesActual();
    } else if (this.periodo === 'meses') {
      await this.cargarDatosTresMeses();
    } else if (this.periodo === 'total') {
      await this.cargarDatosTotal();
    }
  }

  async cargarDatosMesActual() {
    if (!this.userId) return;

    const fecha = new Date();
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();

    try {
      // Resumen del mes actual
      this.resumenActual = await this.dbService.obtenerResumenMes(this.userId, mes, anio);

      // Resumen del mes anterior
      this.resumenAnterior = await this.dbService.obtenerResumenMesAnterior(this.userId);

      // Calcular cambios porcentuales
      this.calcularCambios();

      // Gastos por categoría del mes
      this.gastosPorCategoria = await this.dbService.obtenerGastosPorCategoria(this.userId, mes, anio);
      
      // Calcular porcentajes
      if (this.resumenActual.gastos > 0) {
        this.gastosPorCategoria = this.gastosPorCategoria.map(cat => ({
          ...cat,
          porcentaje: Math.round((cat.total / this.resumenActual.gastos) * 100)
        }));
      }

      this.hayDatos = this.resumenActual.ingresos > 0 || this.resumenActual.gastos > 0;

    } catch (error) {
      console.error('Error al cargar datos del mes:', error);
    }
  }

  async cargarDatosTresMeses() {
    if (!this.userId) return;

    try {
      // Obtener historial de 3 meses
      this.historialMeses = await this.dbService.obtenerHistorialMeses(this.userId, 3);

      // Calcular resumen total de los 3 meses
      let totalIngresos = 0;
      let totalGastos = 0;

      this.historialMeses.forEach(item => {
        totalIngresos += item.ingresos;
        totalGastos += item.gastos;
      });

      this.resumenActual = {
        ingresos: totalIngresos,
        gastos: totalGastos,
        balance: totalIngresos - totalGastos
      };

      this.mostrarComparacion = false;
      this.hayDatos = this.historialMeses.length > 0;

    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  }

  async cargarDatosTotal() {
    if (!this.userId) return;

    try {
      // Resumen total histórico
      this.resumenActual = await this.dbService.obtenerResumenTotal(this.userId);

      // Obtener todas las categorías con gastos
      const fecha = new Date();
      const mes = fecha.getMonth() + 1;
      const anio = fecha.getFullYear();
      
      this.gastosPorCategoria = await this.dbService.obtenerGastosPorCategoria(this.userId, mes, anio);
      
      if (this.resumenActual.gastos > 0) {
        this.gastosPorCategoria = this.gastosPorCategoria.map(cat => ({
          ...cat,
          porcentaje: Math.round((cat.total / this.resumenActual.gastos) * 100)
        }));
      }

      this.mostrarComparacion = false;
      this.hayDatos = this.resumenActual.ingresos > 0 || this.resumenActual.gastos > 0;

    } catch (error) {
      console.error('Error al cargar resumen total:', error);
    }
  }

  calcularCambios() {
    // Calcular cambio porcentual de ingresos
    if (this.resumenAnterior.ingresos > 0) {
      this.cambioIngresos = Math.round(
        ((this.resumenActual.ingresos - this.resumenAnterior.ingresos) / this.resumenAnterior.ingresos) * 100
      );
    } else {
      this.cambioIngresos = this.resumenActual.ingresos > 0 ? 100 : 0;
    }

    // Calcular cambio porcentual de gastos
    if (this.resumenAnterior.gastos > 0) {
      this.cambioGastos = Math.round(
        ((this.resumenActual.gastos - this.resumenAnterior.gastos) / this.resumenAnterior.gastos) * 100
      );
    } else {
      this.cambioGastos = this.resumenActual.gastos > 0 ? 100 : 0;
    }

    this.mostrarComparacion = true;
  }

  cambiarPeriodo() {
    this.cargarDatos();
  }

  getColorGradient(color: string): string {
    const gradients: any = {
      'primary': 'linear-gradient(to right, #3880ff, #5a9bff)',
      'secondary': 'linear-gradient(to right, #3dc2ff, #5dd5ff)',
      'tertiary': 'linear-gradient(to right, #5260ff, #7279ff)',
      'success': 'linear-gradient(to right, #2dd36f, #4de88f)',
      'warning': 'linear-gradient(to right, #ffc409, #ffd534)',
      'danger': 'linear-gradient(to right, #eb445a, #f06579)',
      'dark': 'linear-gradient(to right, #222428, #3a3f47)',
      'medium': 'linear-gradient(to right, #92949c, #a8aaaf)',
      'light': 'linear-gradient(to right, #f4f5f8, #ffffff)'
    };
    return gradients[color] || 'linear-gradient(to right, #3880ff, #5a9bff)';
  }

}