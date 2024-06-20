import { Component } from '@angular/core';
import { Funcion } from '../../../models/Funcion';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { SelectionModel } from '@angular/cdk/collections';
import { FuncionService } from '../../../services/funcion.service';
import { PeliculaService } from '../../../services/pelicula.service';
import { Pelicula } from '../../../models/Pelicula';
import Swal from 'sweetalert2';
import { timer } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AsientoService } from '../../../services/asiento.service';

@Component({
  selector: 'app-funcion-administracion',
  standalone: true,
  imports: [FormsModule,RouterLink,RouterLinkActive,RouterOutlet,MatFormFieldModule, MatCheckboxModule,MatInputModule, 
    MatTableModule ,MatPaginatorModule,MatButtonModule,ReactiveFormsModule, MatSlideToggleModule],
  templateUrl: './funcion-administracion.component.html',
  styleUrl: './funcion-administracion.component.css'
})
export class FuncionAdministracionComponent {
  public displayedColumns: string[] = ['select', 'id', 'idPelicula', 'sala', 'fecha', 'horaInicio', 'horaFinal','precio'];
  public dataSource = new MatTableDataSource<Funcion>([]);
  public selection = new SelectionModel<Funcion>(true, []);
  public selectedFuncion = new Funcion(1,0,"","","","",0)
  public salas=['A','B','C','D','E'];
  public _funcion:Funcion
  public peliculas: Pelicula[] = [];
  public _pelicula:Pelicula;
  public peliculasList: { key: number, value: string }[] = [];
  public errores:string[]=[];
  public activateErrors:boolean=false;
  constructor(
    private _funcionService: FuncionService,
    private _peliculaService: PeliculaService,
    private _asientoService:AsientoService,
    private _router:Router,
  ) {
    this._funcion = new Funcion(1,0,"","","","",3500)
    this._pelicula = new Pelicula(1,"","","","","","","","","","","")
    //this.urlAPI = server.url+'imagen/show/comidas/';
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

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  
  toggleAllRows(): void {
    if (this.selection.selected.length === this.dataSource.data.length) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }
  
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  
  checkboxLabel(row?: Funcion): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id + 1}`;
  }
  
  isExactlyOneSelected(): boolean {
    return this.selection.selected.length === 1;
  }
  
  isAtLeastOneSelected(): boolean {
    return this.selection.selected.length > 0;
  }

/*****************************CREACIÓN DE LAS FUNCIONES PRINCIPALES DEL CRUD*****************************/
  
  ngOnInit():void {
    this.getFunciones();
    this.verifyAsientosExists();
  }

/*****************************  GET  *****************************/
  getFunciones() {
    this._funcionService.index().subscribe({
    next: (response: any) => {
    //console.log("entro")
      this.dataSource.data= response['data'];
      //console.log(this.dataSource.data)
      //console.log(response)
      this.peliculasList=[];
      this.loadPeliculaName();
    },
      error: (err: Error) => {
        console.error('Error al cargar las funciones', err);
      }
    });
  }

   /*****************************  CREATE  *****************************/
   storeFuncion(form: any): void {
    
      //console.log(this._funcion)
      this._funcionService.create(this._funcion).subscribe({
      next:(response)=>{
       // console.log(response);
        if(response.status==201){
          form.reset();            
          this.getFunciones();
          this.msgAlert('Funcion agregada correctamente','','success'); 
            } else {
              console.error('No se pudo ingresar la funcion');
            }
          },
          error: (error: HttpErrorResponse) => {
            if (error.status === 406 && error.error && error.error.error) {
              this.errores = [];
              const errorObj = error.error.error;
              for (const key in errorObj) {
                if (errorObj.hasOwnProperty(key)) {
                  this.errores.push(...errorObj[key]);
                }
              }
              this.changeActivateErrors(true)
            } else {
              console.error('Otro tipo de error:', error);
              this.msgAlert('Error desde el servidor, contacte con un administrador', '', 'error');
            }
          }
        });
    
  }

  /*****************************  DELETE  *****************************/
  deleteSelectedFunciones() {
    this.selection.selected.forEach(user => {
      this._funcionService.delete(user.id).subscribe({
        next: () => {
          // (image!=null)? this.deleteUserImage(image!):console.log('No hay imagenes');
          this.dataSource.data = this.dataSource.data.filter(u => u.id !== user.id);
          this.selection.clear();
          this.msgAlert('Funcion eliminada','','success'); 
        },
        error: (err: any) => {
          console.error('Error al eliminar la funcion', err);
          this.msgAlert('Error desde el servidor, contacte con un administrador', '', 'error');
        }
      });
    });
  }


  /*****************************  UPDATE  *****************************/
    updateFuncion(form: any): void {
      // if (form.valid) {
        this.selectedFuncion.horaInicio=this.formatTime(this.selectedFuncion.horaInicio);
        this.selectedFuncion.horaFinal=this.formatTime(this.selectedFuncion.horaFinal);

        //console.log(this.selectedFuncion);

        this._funcionService.update(this.selectedFuncion).subscribe({
          next: (updatedFuncion) => {
            const index = this.dataSource.data.findIndex(user => user.id === updatedFuncion.id);
            if (index !== -1) {
              this.dataSource.data[index] = updatedFuncion;
              this.dataSource.data = [...this.dataSource.data]; // Para disparar la actualización de Angular
              
            }
            form.reset();
            this.getFunciones();
            this.selection.clear(); 
            this.msgAlert('Funcion actualizada','','success'); 
          },
          error: (error:HttpErrorResponse) => {
            if (error.status === 406 && error.error && error.error.error) {
              this.errores = [];
              const errorObj = error.error.error;
              for (const key in errorObj) {
                if (errorObj.hasOwnProperty(key)) {
                  this.errores.push(...errorObj[key]);
                }
              }
              this.changeActivateErrors(true)
            } else {
              console.error('Otro tipo de error:', error);
              this.msgAlert('Error desde el servidor, contacte con un administrador', '', 'error');
            }
          }
        });
      // }
    }
    
    prepareUpdateForm() {
      if (this.isExactlyOneSelected()) {
        this.selectedFuncion = { ...this.selection.selected[0] };
      }
    }

    /*****************************  Obtener nombre  *****************************/

    loadPeliculaName() {
      this._peliculaService.index().subscribe({
        next: (response: any) => {
          //console.log(response)
          let peliculas = response['data'];
    peliculas.forEach((e:any) => {
      this.peliculasList.push({
            key: e.id,
            value: e.nombre
          });
    });
    
        },
        error: (err: Error) => {
          console.error('Error al buscar la pelicula', err);
        }
      });
    }
  
    getPeliculaNameById(id: number): string {
      const pelicula = this.peliculasList.find(p => p.key === id);
      return pelicula ? pelicula.value : 'Desconocido';
    }
    //----------------MODIFICA EL FORMATO DE TIEMPO--------------------------------
    formatTime(time: string): string {
      const parts = time.split(':');
      if (parts.length === 2) {
        const [hours, minutes] = parts;
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      } else if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
      } else {
        return time;
      }
    }
    
 //--------------------------FUNCIONES DE ALERTAS-------------------------------------------------------------------
 msgAlert= (title:any, text:any, icon:any) =>{
  Swal.fire({
    title,
    text,
    icon,
  })
}

changeActivateErrors(val:boolean){
  this.activateErrors=val;
  let countdown=timer(5000);
  countdown.subscribe(n=>{
    this.activateErrors=false;
  })
}


//---------------------------FUNCIONES QUE ASIGNAN LOS ASIENTOS EN LA BD----------------------------------------

verifyAsientosExists(){
  this._asientoService.index().subscribe({
    next: (response: any) => {
      //console.log(response)
      let asientos = response['data'];
      //console.log('asientos',asientos)
      if(asientos.length>0)
        {console.log('ya existen asientos registrados')
      }else{this.rellenarAsientos(140);console.log('Se crearon nuevos asientos')}
  
    },
    error: (err: Error) => {
      console.error('Error al buscar los asientos', err);
    }
  });
  }
  
  rellenarAsientos(cantidad:number){
    this._asientoService.rellenar(cantidad).subscribe({
      next: (response: any) => {
        //console.log(response);
      },
      error: (err: Error) => {
        console.error('Error al rellenar los asientos', err);
      }
    });
    }


}

