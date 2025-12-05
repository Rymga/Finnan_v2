export class Transaction {
  id: number;
  usuarioId: number;
  tipo: 'ingreso' | 'gasto'; // solo puede ser ingreso o gasto
  monto: number;
  categoriaId: number;
  descripcion: string;
  fecha: Date; // fecha de la transacción
  fechaCreacion: Date; // fecha en que se registró
  metodoPago?: string; // efectivo, tarjeta, transferencia, etc. (opcional)

  constructor(
    id: number,
    usuarioId: number,
    tipo: 'ingreso' | 'gasto',
    monto: number,
    categoriaId: number,
    descripcion: string,
    fecha: Date = new Date(),
    fechaCreacion: Date = new Date(),
    metodoPago?: string
  ) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.tipo = tipo;
    this.monto = monto;
    this.categoriaId = categoriaId;
    this.descripcion = descripcion;
    this.fecha = fecha;
    this.fechaCreacion = fechaCreacion;
    this.metodoPago = metodoPago;
  }
}