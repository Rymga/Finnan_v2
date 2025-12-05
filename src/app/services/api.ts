import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiURL = 'https://reqres.in/api';

  private httpHeaders = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  recuperarPassword(email: string): Observable<any> {
    const body = {
      email: email,
      action: 'reset_password'
    };

    return this.http.post(`${this.apiURL}/users`, body, this.httpHeaders).pipe(
      tap((response) => {
        console.log('✅ API Response (Success):', response);
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
      
      switch (error.status) {
        case 404:
          errorMessage = 'Usuario no encontrado (Error 404)';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        case 0:
          errorMessage = 'No se pudo conectar con el servidor';
          break;
      }
    }

    console.error(' Error en API:', errorMessage);
    return throwError(() => ({
      status: error.status,
      message: errorMessage
    }));
  }
}