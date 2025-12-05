import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth';
import { Dbservice} from 'src/app/services/dbservice';
import { Category } from 'src/app/class/category';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.page.html',
  styleUrls: ['./transaction.page.scss'],
  standalone: false,
})
export class TransactionPage implements OnInit {

  // Variables del formulario
  tipo: 'gasto' | 'ingreso' = 'gasto';
  monto: number = 0;
  categoriaId: number = 0;
  descripcion: string = '';
  fecha: string = new Date().toISOString();
  metodoPago: string = '';

  // Modo edición
  modoEdicion: boolean = false;
  transaccionId: number = 0;

  // Datos auxiliares
  userId: number | null = null;
  categorias: Category[] = [];
  categoriasFiltradas: Category[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private authService: AuthService,
    private dbService: Dbservice
  ) { }

  async ngOnInit() {
    // Obtener userId
    this.userId = await this.authService.getUserId();
    
    // Cargar categorías
    await this.cargarCategorias();

    // Verificar si viene en modo edición
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.modoEdicion = true;
        this.cargarDatosTransaccion(params);
      }
    });
  }

  cargarDatosTransaccion(params: any) {
    this.transaccionId = parseInt(params['id']);
    this.tipo = params['tipo'];
    this.monto = parseFloat(params['monto']);
    this.categoriaId = parseInt(params['categoriaId']);
    this.descripcion = params['descripcion'];
    this.fecha = params['fecha'];
    this.metodoPago = params['metodoPago'] || '';
    
    // Filtrar categorías después de cargar el tipo
    this.filtrarCategoriasPorTipo();
  }

  async cargarCategorias() {
    if (!this.userId) return;

    // Cargar todas las categorías del usuario
    await this.dbService.cargarCategorias(this.userId);
    
    // Suscribirse a las categorías
    this.dbService.fetchCategorias().subscribe(categorias => {
      this.categorias = categorias;
      this.filtrarCategoriasPorTipo();
    });
  }

  filtrarCategoriasPorTipo() {
    // Filtrar categorías según el tipo
    this.categoriasFiltradas = this.categorias.filter(cat => cat.tipo === this.tipo);
    
    // Resetear categoría seleccionada
    if (this.categoriaId > 0) {
      const categoriaExiste = this.categoriasFiltradas.find(cat => cat.id === this.categoriaId);
      if (!categoriaExiste) {
        this.categoriaId = 0;
      }
    }
  }

  async guardarTransaccion() {
    // Validaciones
    if (this.monto <= 0) {
      this.presentAlert('Error', 'El monto debe ser mayor a 0');
      return;
    }

    if (this.categoriaId === 0) {
      this.presentAlert('Error', 'Debes seleccionar una categoría');
      return;
    }

    if (!this.descripcion.trim()) {
      this.presentAlert('Error', 'Debes ingresar una descripción');
      return;
    }

    if (!this.userId) {
      this.presentAlert('Error', 'Usuario no identificado');
      return;
    }

    try {
      // Convertir la fecha string a Date
      const fechaTransaccion = new Date(this.fecha);

      if (this.modoEdicion) {
        // ACTUALIZAR transacción existente
        await this.dbService.updateTransaccion(
          this.transaccionId,
          this.tipo,
          this.monto,
          this.categoriaId,
          this.descripcion,
          fechaTransaccion,
          this.metodoPago || undefined,
          this.userId
        );

        this.presentAlert('Éxito', 'Transacción actualizada correctamente');
      } else {
        // CREAR nueva transacción
        await this.dbService.addTransaccion(
          this.userId,
          this.tipo,
          this.monto,
          this.categoriaId,
          this.descripcion,
          fechaTransaccion,
          this.metodoPago || undefined
        );

        this.presentAlert('Éxito', 'Transacción guardada correctamente');
      }
      
      this.limpiarFormulario();

      setTimeout(() => {
        this.router.navigate(['/history']);
      }, 1000);

    } catch (error) {
      console.error('Error al guardar transacción:', error);
      this.presentAlert('Error', 'No se pudo guardar la transacción');
    }
  }

  cancelarEdicion() {
    this.router.navigate(['/history']);
  }

  limpiarFormulario() {
    this.modoEdicion = false;
    this.transaccionId = 0;
    this.monto = 0;
    this.categoriaId = 0;
    this.descripcion = '';
    this.fecha = new Date().toISOString();
    this.metodoPago = '';
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  ionChange() {
    this.filtrarCategoriasPorTipo();
  }
}