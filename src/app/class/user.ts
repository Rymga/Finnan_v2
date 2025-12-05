export class User {
  id: number;
  nombre: string;
  email: string;
  password: string;
  fotoPerfil?: string;

  constructor(
    id: number,
    nombre: string,
    email: string,
    password: string,
    fotoPerfil?: string
  ) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.password = password;
    this.fotoPerfil = fotoPerfil;
  }
}