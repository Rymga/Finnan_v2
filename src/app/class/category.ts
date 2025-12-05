export class Category {
  id: number;
  nombre: string;
  tipo: 'ingreso' | 'gasto'; // solo puede ser ingreso o gasto
  icono: string; // nombre del ícono de Ionic (ej: 'fast-food-outline')
  color: string; // color en hexadecimal o nombre (ej: 'primary', '#FF5733')
  usuarioId?: number; // si es null, es categoría por defecto; si tiene valor, es personalizada

  constructor(
    id: number,
    nombre: string,
    tipo: 'ingreso' | 'gasto',
    icono: string,
    color: string,
    usuarioId?: number
  ) {
    this.id = id;
    this.nombre = nombre;
    this.tipo = tipo;
    this.icono = icono;
    this.color = color;
    this.usuarioId = usuarioId;
  }
}