import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Pelicula } from '../../models/Pelicula';
import { PeliculaService } from '../../services/pelicula.service';
import { ImagenService } from '../../services/imagen.service';
import { server } from '../../services/global';
import { CommonModule } from '@angular/common';
import { FuncionService } from '../../services/funcion.service';
import { Funcion } from '../../models/Funcion';
import { error } from 'jquery';

@Component({
  selector: 'app-pelicula',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './pelicula.component.html',
  styleUrl: './pelicula.component.css'
})
export class PeliculaComponent {
  
selectedDate: string = 'Seleccione fecha';
urlAPI: string | undefined;
idP: any;
public pelicula:Pelicula;
public status: number | undefined;
public funciones: Funcion[] = [];
public funcionesFiltradas: Funcion[] = []; // Filtradas por película
public funcionesAux: Funcion[] = [];
public imagenHorizontal: any[] = [];
public imagenVertical: any[] = [];


constructor(
  private _peliculaService:PeliculaService,
  private _imagenService: ImagenService,
  private _funcionService:FuncionService,
  private _routes: ActivatedRoute,
  private _router:Router,
){
  this.urlAPI = server.url+'imagen/pelicula/';
  this.pelicula = new Pelicula(1,"","","","","","","","","","","")
}

ngOnInit():void{
  const id = this._routes.snapshot.paramMap.get('id');
  console.log('ID obtenido de la ruta:', id);
  if(id!=null){
    this.getPelicula(id);
    this.getFuncionesPelicula(id);
  }
}

 //---------------RESTRINGIR ACCESO A MODULOS------------------------------------
 authTokenUserAdmin(){
  let aux = sessionStorage.getItem('identity');
  if (aux == null){
    return false;
  } else {
  let jason= JSON.parse(aux);
  return jason.permisoAdmin;
  }
}

redirectToHome(){
  this._router.navigate([''])
}

getPelicula(id:string){
  this.idP = id;
  this._peliculaService.show(id).subscribe(
     data => {
     this.pelicula = data['pelicula']
      if (this.pelicula && this.pelicula.imagenes) {
        const imagenH = this.pelicula.imagenes.find((imagen: { descripcion: string; }) => imagen.descripcion === 'horizontal');
        if (imagenH) {
          this.imagenHorizontal = imagenH.imagen;
        } else {
          console.warn('No se encontró una imagen con la descripción "horizontal".');
        }
      } else {
        console.error('La película o las imágenes de la película no están definidas.');
      }
    },
    error => {
      console.error('Error al obtener la pelicula:', error);
      this.status = 0;
    }
  )
  }

  getFuncionesPelicula(idPeli: string) {
    this._funcionService.index().subscribe({
      next: (response: any) => {
        this.funciones = response['data'];
        this.funcionesFiltradas = this.funciones.filter((funcion: Funcion) =>
          funcion.idPelicula.toString().includes(idPeli.toString()));
        console.log(this.funcionesFiltradas);
      },
      error: (error: any) => {
        console.error('Error al obtener las funciones:', error);
      }
    });
  }

  onDateChange(event: any) {
    const selectedDate = event.target.value;
    this.selectedDate = selectedDate;
    this.funcionesAux = this.funcionesFiltradas.filter(funcion => {
      const funcionDate = new Date(funcion.fecha).toISOString().split('T')[0];
      return funcionDate === selectedDate;
    });
  }
}

