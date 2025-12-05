import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth';
import { Dbservice } from 'src/app/services/dbservice';
import { Transaction } from 'src/app/class/transaction';
import { Category } from 'src/app/class/category';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: false,
})
export class HistoryPage implements OnInit {

  // Datos del usuario
  userId: number | null = null;

  // Transacciones
  transacciones: Transaction[] = [];
  transaccionesFiltradas: Transaction[] = [];

  // Categorías para mostrar íconos
  categorias: Category[] = [];

  // Filtro
  filtroTipo: string = 'todos';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: AuthService,
    private dbService: Dbservice
  ) { }

  async ngOnInit() {

    this.userId = await this.authService.getUserId();
    
    // Cargar datos
    await this.cargarCategorias();
    await this.cargarTransacciones();
  }

  async ionViewWillEnter() {
    // Recargar transacciones cada vez que se entra a la página
    await this.cargarTransacciones();
  }

  async cargarCategorias() {
    if (!this.userId) return;

    // Cargar categorías
    await this.dbService.cargarCategorias(this.userId);
    
    // Suscribirse a las categorías
    this.dbService.fetchCategorias().subscribe(categorias => {
      this.categorias = categorias;
    });
  }

  async cargarTransacciones() {
    if (!this.userId) return;

    try {
      // Cargar transacciones
      await this.dbService.cargarTransacciones(this.userId);
      
      // Suscribirse a las transacciones
      this.dbService.fetchTransacciones().subscribe(transacciones => {
        this.transacciones = transacciones;
        this.filtrarTransacciones();
      });
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    }
  }

  filtrarTransacciones() {
    if (this.filtroTipo === 'todos') {
      this.transaccionesFiltradas = this.transacciones;
    } else {
      this.transaccionesFiltradas = this.transacciones.filter(
        trans => trans.tipo === this.filtroTipo
      );
    }
  }

  getCategoriaIcono(categoriaId: number): string {
    const categoria = this.categorias.find(cat => cat.id === categoriaId);
    return categoria ? categoria.icono : 'ellipsis-horizontal-outline';
  }

  async eliminarTransaccion(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de eliminar esta transacción?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            if (!this.userId) return;

            try {
              await this.dbService.deleteTransaccion(id, this.userId);
              this.presentAlert('Éxito', 'Transacción eliminada');
            } catch (error) {
              console.error('Error al eliminar:', error);
              this.presentAlert('Error', 'No se pudo eliminar la transacción');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  irANuevaTransaccion() {
    this.router.navigate(['/transaction']);
  }

  editarTransaccion(trans: Transaction) {
    this.router.navigate(['/transaction'], {
      queryParams: {
        id: trans.id,
        tipo: trans.tipo,
        monto: trans.monto,
        categoriaId: trans.categoriaId,
        descripcion: trans.descripcion,
        fecha: trans.fecha.toISOString(),
        metodoPago: trans.metodoPago || ''
      }
    });
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