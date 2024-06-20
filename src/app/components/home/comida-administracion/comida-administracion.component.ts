import { Component } from '@angular/core';
import { Comida } from '../../../models/Comida';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ComidaService } from '../../../services/comida.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { Imagen } from '../../../models/Imagen';
import { ImagenService } from '../../../services/imagen.service';
import { server } from '../../../services/global';
import Swal from 'sweetalert2';
import { timer } from 'rxjs';

@Component({
  selector: 'app-comida-administracion',
  standalone: true,
  imports: [FormsModule,RouterLink,RouterLinkActive,RouterOutlet,MatFormFieldModule, 
    MatCheckboxModule,MatInputModule, MatTableModule ,MatPaginatorModule,
    MatButtonModule,ReactiveFormsModule, MatSlideToggleModule],
  templateUrl: './comida-administracion.component.html',
  styleUrl: './comida-administracion.component.css'
})
export class ComidaAdministracionComponent {

  public displayedColumns: string[] = ['select', 'id', 'nombre', 'precio', 'imagen'];
  public dataSource = new MatTableDataSource<Comida>([]);
  public selection = new SelectionModel<Comida>(true, []);
  public selectedFile: File | null = null;
  public updateFile: File | null = null;
  public comida: Comida = new Comida(0, '', 0, '');
  public selectedComida = new Comida(1,"",1,"")
  public prueba:string | undefined;
  public Comidas: Comida[] = [];
  public _comida: Comida;
  public urlAPI: string | undefined;
  public imageURL:string='';
  public activateErrors:boolean=false;
  constructor(
    private _comidaService: ComidaService,
    private _imagenService: ImagenService,
    private _router:Router
  ) {
    this._comida = new Comida(1,"",0,"")
    this.urlAPI = server.url+'imagen/show/comidas/';
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

  checkboxLabel(row?: Comida): string {
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
    this.getComidas();
    
  }

  /*****************************  GET  *****************************/
  getComidas() {
    this._comidaService.index().subscribe({
    next: (response: any) => {
    // console.log("entro")
      this.dataSource.data= response['data'];
      // console.log(this.dataSource.data)
      // console.log(response)
      this.dataSource.data.forEach(comida => {
        this.getComidasImage(comida.imagen, comida); // Asumiendo que `filename` es el campo correcto a pasar
      });
    },
      error: (err: Error) => {
        console.error('Error al cargar las comidas', err);
      }
    });
  }

  getComidasImage(filename: string, comida: Comida) {
    //console.log("Obteniendo imagen para", filename);
    this._imagenService.getImage('comidas', filename).subscribe({
      next: (response: any) => {
        comida.imagen = URL.createObjectURL(response); // Agregar imageURL a la comida
       // console.log("Imagen obtenida:", comida.imagen);
        comida.originalImagen = filename; // Guardar el nombre original de la imagen
        // Actualizar la fila correspondiente en la tabla
        this.dataSource._updateChangeSubscription();
      },
      error: (err: Error) => {
        // Manejar el error adecuadamente
        console.error('Error al obtener la imagen', err);
      }
    });
  }
  


  /*****************************  STORE  *****************************/
  

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  storeComida(form: any): void {
    if (form.valid && this.selectedFile) {
      //Primero cargar la imagen
      this._imagenService.uploadImageStore(this.selectedFile, 'comidas').subscribe({
        next: (response) => {
          //Obtener el nombre de la imagen cargada en el Backend
          this.comida.imagen = response.filename; 
          this._comidaService.create(this.comida).subscribe({
            next: () => {
              this.getComidas();
              form.resetForm();
              this.selectedFile = null;
              this.msgAlert('Comida agregada correctamente','','success');
            },
            error: (err) => {
              console.error('Error al crear la comida', err);
              this.msgAlert('Error al agregar la comida','','error');
            }
          });
        },
        error: (err) => {
          console.error('Error al subir la imagen', err);
          this.msgAlert('Error al agregar la imagen','','error');
        }
      });
    } else {
      this.msgAlert('Datos inválidos o imagen no seleccionada','','error');
    }
  }
  
  /*****************************  DELETE  *****************************/
  deleteSelectedComidas(): void {
    const selectedIds = this.selection.selected.map(comida => comida.id);
    selectedIds.forEach(id => {
      this._comidaService.delete(id).subscribe({
        next: () => {
          this.getComidas();
          this.selection.clear(); 
          this.msgAlert('Comida eliminada','','success');
        },
        error: (err: Error) => {
          console.error('Error al eliminar la comida', err);
          this.msgAlert('Error al eliminar la comida','','error');
        }
      });
    });
  }

  /*****************************  UPDATE  *****************************/
  prepareUpdateForm(): void {
    if (this.isExactlyOneSelected()) {
      this.selectedComida = this.selection.selected[0];
    }
  }

  updateComidaImage(form: any): void {
    if (form.valid || this.updateFile) {
      if (this.updateFile) {
        const filename = this.selectedComida.originalImagen; // Usar el nombre de la imagen original
      this._imagenService.updateImage(this.updateFile, 'comidas', filename).subscribe({
          next: (response) => {
            //console.log("Imagen actualizada:", response.filename);
            this.selectedComida.imagen = response.filename;
            this.msgAlert('Comida actualizada','','success');
            // Si el formulario es válido, actualizar la información de la comida
            if (form.valid) {
              this.updateComidaInfo(form);
            } else {
              this.resetForm(form);
            }
          },
          error: (err) => {
            console.error('Error al subir la imagen', err);
            this.msgAlert('Error al actualizar la imagen','','error');
          }
        });
      } else {
        // Si no hay nueva imagen pero el formulario es válido, actualizar los datos de la comida
        if (form.valid) {
          this.updateComidaInfo(form);
        } else {
          this.msgAlert('Error al actualizar la comida',
            'Debe seleccionar una nueva imagen o completar el formulario correctamente para actualizar la comida','error');
         }
      }
    } else {
      this.msgAlert('Formulario inválido','','error');
    }
  }
  
  updateComidaInfo(form: any): void {
    this._comidaService.update(this.selectedComida).subscribe({
      next: () => {
        //console.log("Comida actualizada");
        this.getComidas();
        this.resetForm(form);
       this.msgAlert('Comida Actualizada','','success');
      },
      error: (err) => {
       // console.error('Error al actualizar la comida', err);
        this.msgAlert('Error al actualizar los datos de la comida','','error');
      }
    });
  }
  
    resetForm(form: any): void {
      form.resetForm();
      this.selection.clear();
      this.updateFile = null;
    }

    onUpdateFileChange(event: any): void {
      if (event.target.files && event.target.files[0]) {
        this.updateFile = event.target.files[0];
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
  
}
