import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Platform, ToastController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../class/user' ;
import { Category } from '../class/category';
import { Transaction } from '../class/transaction';

@Injectable({
  providedIn: 'root'
})
export class Dbservice {

  public database!: SQLiteObject;

  // Definición de las tablas
  tblUsuarios: string = "CREATE TABLE IF NOT EXISTS usuarios(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre VARCHAR(100) NOT NULL, email VARCHAR(100) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, foto_perfil TEXT);";

  tblCategorias: string = "CREATE TABLE IF NOT EXISTS categorias(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre VARCHAR(50) NOT NULL, tipo VARCHAR(10) NOT NULL, icono VARCHAR(50) NOT NULL, color VARCHAR(20) NOT NULL, usuario_id INTEGER);";

  tblTransacciones: string = "CREATE TABLE IF NOT EXISTS transacciones(id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, tipo VARCHAR(10) NOT NULL, monto REAL NOT NULL, categoria_id INTEGER NOT NULL, descripcion TEXT NOT NULL, fecha TEXT NOT NULL, fecha_creacion TEXT NOT NULL, metodo_pago VARCHAR(50));";

  // BehaviorSubjects para observar cambios
  listaUsuarios = new BehaviorSubject<User[]>([]);
  listaCategorias = new BehaviorSubject<Category[]>([]);
  listaTransacciones = new BehaviorSubject<Transaction[]>([]);
  
  private isDbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private sqlite: SQLite,
    private platform: Platform,
    public toastController: ToastController
  ) {
    this.crearBD();
  }

  /**
   * Método que crea la BD si no existe o carga la existente
   */
  crearBD() {
    this.platform.ready().then(() => {
      this.sqlite.create({
        name: 'finan.db',
        location: 'default'
      }).then((db: SQLiteObject) => {
        this.database = db;
        this.presentToast("BD creada");
        this.crearTablas();
      }).catch(e => this.presentToast("Error al crear BD: " + e));
    });
  }

  /**
   * Método que crea las tablas de la BD si no existen
   */
  async crearTablas() {
    try {
      console.log('Creando tabla usuarios...');
      await this.database.executeSql(this.tblUsuarios, []);
      console.log('Tabla usuarios creada');
      
      console.log('Creando tabla categorias...');
      await this.database.executeSql(this.tblCategorias, []);
      console.log('Tabla categorias creada');
      
      console.log('Creando tabla transacciones...');
      await this.database.executeSql(this.tblTransacciones, []);
      console.log('Tabla transacciones creada');
      
      this.presentToast("Tablas creadas");
      
      // Insertar categorías por defecto
      await this.insertarCategoriasDefault();
      
      this.isDbReady.next(true);
    } catch (error) {
      console.error('Error detallado en crear tablas:', error);
      this.presentToast("Error en crear tablas: " + JSON.stringify(error));
      alert("Error al crear tablas: " + JSON.stringify(error));
    }
  }

  /**
   * Inserta categorías por defecto si no existen
   */
  async insertarCategoriasDefault() {
    const categorias = [
      // Categorías de GASTOS
      { nombre: 'Alimentación', tipo: 'gasto', icono: 'fast-food-outline', color: 'primary' },
      { nombre: 'Transporte', tipo: 'gasto', icono: 'car-outline', color: 'warning' },
      { nombre: 'Entretenimiento', tipo: 'gasto', icono: 'game-controller-outline', color: 'tertiary' },
      { nombre: 'Salud', tipo: 'gasto', icono: 'fitness-outline', color: 'danger' },
      { nombre: 'Educación', tipo: 'gasto', icono: 'school-outline', color: 'secondary' },
      { nombre: 'Servicios', tipo: 'gasto', icono: 'receipt-outline', color: 'medium' },
      { nombre: 'Otros Gastos', tipo: 'gasto', icono: 'ellipsis-horizontal-outline', color: 'dark' },
      // Categorías de INGRESOS
      { nombre: 'Salario', tipo: 'ingreso', icono: 'cash-outline', color: 'success' },
      { nombre: 'Freelance', tipo: 'ingreso', icono: 'briefcase-outline', color: 'success' },
      { nombre: 'Otros Ingresos', tipo: 'ingreso', icono: 'wallet-outline', color: 'success' }
    ];

    // Verificar si ya existen categorías
    const res = await this.database.executeSql('SELECT COUNT(*) as total FROM categorias WHERE usuario_id IS NULL', []);
    if (res.rows.item(0).total === 0) {
      for (let cat of categorias) {
        await this.database.executeSql(
          'INSERT INTO categorias(nombre, tipo, icono, color, usuario_id) VALUES(?,?,?,?,NULL)',
          [cat.nombre, cat.tipo, cat.icono, cat.color]
        );
      }
      this.presentToast("Categorías por defecto creadas");
    }
  }

  // ==================== MÉTODOS PARA USUARIOS ====================

  /**
   * Registrar un nuevo usuario
   */
  async addUsuario(nombre: string, email: string, password: string) {
    const data = [nombre, email, password,null];
    try {
      await this.database.executeSql(
        'INSERT INTO usuarios(nombre, email, password, foto_perfil) VALUES(?,?,?,?)',
        data
      );
      this.presentToast("Usuario registrado exitosamente");
      return true;
    } catch (error) {
      this.presentToast("Error al registrar usuario: " + error);
      return false;
    }
  }

  /**
   * Login de usuario
   */
  async loginUsuario(email: string, password: string): Promise<User | null> {
    try {
      const res = await this.database.executeSql(
        'SELECT * FROM usuarios WHERE email=? AND password=?',
        [email, password]
      );
      if (res.rows.length > 0) {
        const user = res.rows.item(0);
        return new User(
          user.id,
          user.nombre,
          user.email,
          user.password,
          user.foto_perfil
        );
      }
      return null;
    } catch (error) {
      this.presentToast("Error en login: " + error);
      return null;
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUsuario(id: number, nombre: string, email: string) {
    const data = [nombre, email, id];
    try {
      await this.database.executeSql('UPDATE usuarios SET nombre=?, email=? WHERE id=?', data);
      this.presentToast("Usuario actualizado");
    } catch (error) {
      this.presentToast("Error al actualizar usuario: " + error);
    }
  }


  /**
   * Actualizar foto de perfil
   */
  async updateFotoPerfil(userId: number, fotoBase64: string){
    try {
      await this.database.executeSql(
        'UPDATE usuarios SET foto_perfil=? WHERE id=?',
        [fotoBase64, userId]
      );
      this.presentToast("Foto de perfil actualizada");
      return true;
    }catch(error){
      this.presentToast("Error al actualizar foto de perfil: " + error);
      return false;
    }
  }

  /**
   * Obtener usuario por ID
   */
  async obtenerUsuarioPorId(userId: number): Promise<User | null>{
    try {
      const res = await this.database.executeSql(
        'SELECT * FROM usuarios WHERE id=?',
        [userId]
      );
      if (res.rows.length > 0) {
        const user = res.rows.item(0);
        return new User(
          user.id,
          user.nombre,
          user.email,
          user.password,
          user.foto_perfil
        );
      }
      return null;
    } catch (error) {
      this.presentToast("Error al obtener usuario: " + error);
      return null;
    }
  }

  // ==================== MÉTODOS PARA CATEGORÍAS ====================

  /**
   * Cargar todas las categorías
   */
  async cargarCategorias(usuarioId?: number) {
    let items: Category[] = [];
    try {
      let query = 'SELECT * FROM categorias WHERE usuario_id IS NULL';
      let params: any[] = [];
      
      if (usuarioId) {
        query = 'SELECT * FROM categorias WHERE usuario_id IS NULL OR usuario_id=?';
        params = [usuarioId];
      }
      
      const res = await this.database.executeSql(query, params);
      if (res.rows.length > 0) {
        for (let i = 0; i < res.rows.length; i++) {
          const cat = res.rows.item(i);
          items.push(new Category(
            cat.id,
            cat.nombre,
            cat.tipo,
            cat.icono,
            cat.color,
            cat.usuario_id
          ));
        }
      }
      this.listaCategorias.next(items);
    } catch (error) {
      this.presentToast("Error al cargar categorías: " + error);
    }
  }

  /**
   * Agregar categoría personalizada
   */
  async addCategoria(nombre: string, tipo: 'ingreso' | 'gasto', icono: string, color: string, usuarioId: number) {
    const data = [nombre, tipo, icono, color, usuarioId];
    try {
      await this.database.executeSql(
        'INSERT INTO categorias(nombre, tipo, icono, color, usuario_id) VALUES(?,?,?,?,?)',
        data
      );
      this.cargarCategorias(usuarioId);
      this.presentToast("Categoría creada");
    } catch (error) {
      this.presentToast("Error al crear categoría: " + error);
    }
  }

  // ==================== MÉTODOS PARA TRANSACCIONES ====================

  /**
   * Cargar todas las transacciones de un usuario
   */
  async cargarTransacciones(usuarioId: number) {
    let items: Transaction[] = [];
    try {
      const res = await this.database.executeSql(
        'SELECT * FROM transacciones WHERE usuario_id=? ORDER BY fecha DESC',
        [usuarioId]
      );
      if (res.rows.length > 0) {
        for (let i = 0; i < res.rows.length; i++) {
          const trans = res.rows.item(i);
          items.push(new Transaction(
            trans.id,
            trans.usuario_id,
            trans.tipo,
            trans.monto,
            trans.categoria_id,
            trans.descripcion,
            new Date(trans.fecha),
            new Date(trans.fecha_creacion),
            trans.metodo_pago
          ));
        }
      }
      this.listaTransacciones.next(items);
    } catch (error) {
      this.presentToast("Error al cargar transacciones: " + error);
    }
  }

  /**
   * Agregar nueva transacción
   */
  async addTransaccion(
    usuarioId: number,
    tipo: 'ingreso' | 'gasto',
    monto: number,
    categoriaId: number,
    descripcion: string,
    fecha?: Date,
    metodoPago?: string
  ) {
    const fechaTransaccion = fecha ? fecha.toISOString() : new Date().toISOString();
    const fechaCreacion = new Date().toISOString();
    const data = [usuarioId, tipo, monto, categoriaId, descripcion, fechaTransaccion, fechaCreacion, metodoPago || null];
    
    try {
      await this.database.executeSql(
        'INSERT INTO transacciones(usuario_id, tipo, monto, categoria_id, descripcion, fecha, fecha_creacion, metodo_pago) VALUES(?,?,?,?,?,?,?,?)',
        data
      );
      this.cargarTransacciones(usuarioId);
      this.presentToast("Transacción registrada");
    } catch (error) {
      this.presentToast("Error al registrar transacción: " + error);
    }
  }

  /**
   * Actualizar transacción
   */
  async updateTransaccion(
    id: number,
    tipo: 'ingreso' | 'gasto',
    monto: number,
    categoriaId: number,
    descripcion: string,
    fecha: Date,
    metodoPago?: string,
    usuarioId?: number
  ) {
    const fechaTransaccion = fecha.toISOString();
    const data = [tipo, monto, categoriaId, descripcion, fechaTransaccion, metodoPago || null, id];
    
    try {
      await this.database.executeSql(
        'UPDATE transacciones SET tipo=?, monto=?, categoria_id=?, descripcion=?, fecha=?, metodo_pago=? WHERE id=?',
        data
      );
      if (usuarioId) {
        this.cargarTransacciones(usuarioId);
      }
      this.presentToast("Transacción actualizada");
    } catch (error) {
      this.presentToast("Error al actualizar transacción: " + error);
    }
  }

  /**
   * Eliminar transacción
   */
  async deleteTransaccion(id: number, usuarioId: number) {
    try {
      await this.database.executeSql('DELETE FROM transacciones WHERE id=?', [id]);
      this.cargarTransacciones(usuarioId);
      this.presentToast("Transacción eliminada");
    } catch (error) {
      this.presentToast("Error al eliminar transacción: " + error);
    }
  }

  // ==================== MÉTODOS ESTADISTICA ====================

  /**
   * Obtener resumen financiero del mes actual
   */
  async obtenerResumenMes(usuarioId: number, mes: number, anio: number) {
    try {
      const query = `
        SELECT 
          tipo,
          SUM(monto) as total
        FROM transacciones
        WHERE usuario_id=? 
          AND strftime('%m', fecha) = ?
          AND strftime('%Y', fecha) = ?
        GROUP BY tipo
      `;
      
      const mesStr = mes.toString().padStart(2, '0');
      const res = await this.database.executeSql(query, [usuarioId, mesStr, anio.toString()]);
      
      let ingresos = 0;
      let gastos = 0;
      
      for (let i = 0; i < res.rows.length; i++) {
        const row = res.rows.item(i);
        if (row.tipo === 'ingreso') {
          ingresos = row.total;
        } else if (row.tipo === 'gasto') {
          gastos = row.total;
        }
      }
      
      return {
        ingresos: ingresos,
        gastos: gastos,
        balance: ingresos - gastos
      };
    } catch (error) {
      this.presentToast("Error al obtener resumen: " + error);
      return { ingresos: 0, gastos: 0, balance: 0 };
    }
  }

  /**
   * Obtener gastos por categoría del mes actual
   */
  async obtenerGastosPorCategoria(usuarioId: number, mes: number, anio: number) {
    try {
      const query = `
        SELECT 
          c.nombre,
          c.icono,
          c.color,
          SUM(t.monto) as total
        FROM transacciones t
        INNER JOIN categorias c ON t.categoria_id = c.id
        WHERE t.usuario_id=? 
          AND t.tipo='gasto'
          AND strftime('%m', t.fecha) = ?
          AND strftime('%Y', t.fecha) = ?
        GROUP BY t.categoria_id
        ORDER BY total DESC
      `;
      
      const mesStr = mes.toString().padStart(2, '0');
      const res = await this.database.executeSql(query, [usuarioId, mesStr, anio.toString()]);
      
      let items = [];
      for (let i = 0; i < res.rows.length; i++) {
        items.push(res.rows.item(i));
      }
      
      return items;
    } catch (error) {
      this.presentToast("Error al obtener gastos por categoría: " + error);
      return [];
    }
  }


  /**
   * Obtener resumen del mes anterior
   */
  async obtenerResumenMesAnterior(usuarioId: number) {
    try {
      const fecha = new Date();
      // Obtener mes anterior
      fecha.setMonth(fecha.getMonth() - 1);
      const mes = fecha.getMonth() + 1;
      const anio = fecha.getFullYear();

      const query = `
        SELECT 
          tipo,
          SUM(monto) as total
        FROM transacciones
        WHERE usuario_id=? 
          AND strftime('%m', fecha) = ?
          AND strftime('%Y', fecha) = ?
        GROUP BY tipo
      `;
      
      const mesStr = mes.toString().padStart(2, '0');
      const res = await this.database.executeSql(query, [usuarioId, mesStr, anio.toString()]);
      
      let ingresos = 0;
      let gastos = 0;
      
      for (let i = 0; i < res.rows.length; i++) {
        const row = res.rows.item(i);
        if (row.tipo === 'ingreso') {
          ingresos = row.total;
        } else if (row.tipo === 'gasto') {
          gastos = row.total;
        }
      }
      
      return {
        ingresos: ingresos,
        gastos: gastos,
        balance: ingresos - gastos
      };
    } catch (error) {
      this.presentToast("Error al obtener resumen mes anterior: " + error);
      return { ingresos: 0, gastos: 0, balance: 0 };
    }
  }

  /**
   * Obtener historial de los últimos X meses
   */
  async obtenerHistorialMeses(usuarioId: number, cantidad: number = 3) {
    try {
      const query = `
        SELECT 
          strftime('%m', fecha) as mes,
          strftime('%Y', fecha) as anio,
          SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
          SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos
        FROM transacciones
        WHERE usuario_id=?
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY fecha DESC
        LIMIT ?
      `;
      
      const res = await this.database.executeSql(query, [usuarioId, cantidad]);
      
      let historial = [];
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      for (let i = 0; i < res.rows.length; i++) {
        const row = res.rows.item(i);
        const mesNum = parseInt(row.mes);
        const mesNombre = meses[mesNum - 1];
        
        historial.push({
          mes: mesNombre,
          anio: row.anio,
          ingresos: row.ingresos || 0,
          gastos: row.gastos || 0,
          balance: (row.ingresos || 0) - (row.gastos || 0)
        });
      }
      
      return historial;
    } catch (error) {
      this.presentToast("Error al obtener historial: " + error);
      return [];
    }
  }

  /**
   * Obtener resumen total (todo el tiempo)
   */
  async obtenerResumenTotal(usuarioId: number) {
    try {
      const query = `
        SELECT 
          tipo,
          SUM(monto) as total
        FROM transacciones
        WHERE usuario_id=?
        GROUP BY tipo
      `;
      
      const res = await this.database.executeSql(query, [usuarioId]);
      
      let ingresos = 0;
      let gastos = 0;
      
      for (let i = 0; i < res.rows.length; i++) {
        const row = res.rows.item(i);
        if (row.tipo === 'ingreso') {
          ingresos = row.total;
        } else if (row.tipo === 'gasto') {
          gastos = row.total;
        }
      }
      
      return {
        ingresos: ingresos,
        gastos: gastos,
        balance: ingresos - gastos
      };
    } catch (error) {
      this.presentToast("Error al obtener resumen total: " + error);
      return { ingresos: 0, gastos: 0, balance: 0 };
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Verificar si la BD está lista
   */
  dbState() {
    return this.isDbReady.asObservable();
  }

  /**
   * Observable de transacciones
   */
  fetchTransacciones(): Observable<Transaction[]> {
    return this.listaTransacciones.asObservable();
  }

  /**
   * Observable de categorías
   */
  fetchCategorias(): Observable<Category[]> {
    return this.listaCategorias.asObservable();
  }

  /**
   * Mostrar mensajes toast
   */
  async presentToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
  }
}