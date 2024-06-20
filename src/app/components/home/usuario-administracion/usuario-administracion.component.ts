import { Component, ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { User } from '../../../models/User';
import { UserService } from '../../../services/user.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule,_MatSlideToggleRequiredValidatorModule,} from '@angular/material/slide-toggle';
import { ImagenService } from '../../../services/imagen.service';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { timer } from 'rxjs';

@Component({
  selector: 'app-usuario-administracion',
  standalone: true,
  imports: [FormsModule,RouterLink,RouterLinkActive,RouterOutlet,MatFormFieldModule, MatCheckboxModule,
    MatInputModule, MatTableModule ,MatPaginatorModule, _MatSlideToggleRequiredValidatorModule,MatButtonModule,
    ReactiveFormsModule, MatSlideToggleModule],
  templateUrl: './usuario-administracion.component.html',
  styleUrl: './usuario-administracion.component.css'
})
export class UsuarioAdministracionComponent {
  public displayedColumns: string[] = ['select', 'id', 'name', 'apellido', 'email', 'fechaNacimiento', 'permisoAdmin'];
  public dataSource = new MatTableDataSource<User>([]);
  public selection = new SelectionModel<User>(true, []);
  public errores:string[]=[];
  public activateErrors:boolean=false;
  public _user: User;
  public users: User[] = [];
  public selectedUser: User = new User(1, "", "", "", "", "", false, "");

  constructor(
    private _userService: UserService,
    private _imagenService:ImagenService,
    private _router:Router
  ) {
    this._user= new User(1,"","","","","",false,"")
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


  //cambiar el nombre del rol en la tabla
  nombreRol(rol:boolean):string{return (rol==true)?'Admin':(rol==false)?'Usuario':'';}

  /****************ESTAS SON FUNCIONES PROPIAS DE LA TABLA PARA EL CHECKBOX Y SELECCIONAR****************/
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  checkboxLabel(row?: User): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id + 1}`;
  }
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isAtLeastOneSelected(): boolean {
    return !this.selection.isEmpty();
  }

  isExactlyOneSelected(): boolean {
    return this.selection.selected.length === 1;
  }

  isUserRow(row: any): boolean {
    const identity = sessionStorage.getItem('identity');
    if (identity) {
      const parsedIdentity = JSON.parse(identity);
      return row.id === parsedIdentity['iss'];
    }
    return false;
  }

  isRegisteredUserSelected(): boolean {
    if (!this.selection.isEmpty()) {
      const selectedUser = this.selection.selected[0];
      return this.isUserRow(selectedUser);
    }
    return false;
  }
  /*****************************CREACIÓN DE LAS FUNCIONES PRINCIPALES DEL CRUD*****************************/
  
  ngOnInit():void {
    this.getUsers();
  }

  /*****************************  GET  *****************************/
  getUsers() {
    this._userService.index().subscribe({
      next: (response: any) => {
        this.dataSource.data = response['data'];
        console.log();
      },
      error: (err: Error) => {
        console.error('Error al cargar los usuarios', err);
      }
    });
  }

  /*****************************  CREATE  *****************************/
  storeUser(form: any): void {
    //if (form.valid) {
      this._userService.create(this._user).subscribe({
      next:(response)=>{
        console.log(response);
        if(response.status==201){
          form.reset();
          this.getUsers();
          this.msgAlert('Usuario agregado correctamente','','success');
            } else {
              console.error('No se pudo ingresar el usuario');
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
        
    //}
  }

  /*****************************  DELETE  *****************************/
  deleteSelectedUsers() {
    this.selection.selected.forEach(user => {
      this._userService.delete(user.id).subscribe({
        next: () => {
          // (image!=null)? this.deleteUserImage(image!):console.log('No hay imagenes');
          this.dataSource.data = this.dataSource.data.filter(u => u.id !== user.id);
          this.selection.clear();
          this.msgAlert('Usuario eliminado','','success');
        },
        error: (err: any) => {
          console.error('Error al eliminar el usuario', err);
          this.msgAlert('Error desde el servidor, contacte con un administrador', '', 'error');
        }
      });
    });
  }


  /*****************************  UPDATE  *****************************/
    updateUser(form: any): void {
      if (form.valid) {
        this._userService.update(this.selectedUser).subscribe({
          next: (updatedUser) => {
            const index = this.dataSource.data.findIndex(user => user.id === updatedUser.id);
            if (index !== -1) {
              this.dataSource.data[index] = updatedUser;
              this.dataSource.data = [...this.dataSource.data]; // Para disparar la actualización de Angular
            }
            form.reset();
            this.getUsers();
            this.selection.clear();
            this.msgAlert('Usuario actualizado','','success'); 
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
              console.error(this.errores);
              this.changeActivateErrors(true)
            } else {
              console.error('Otro tipo de error:', error);
              this.msgAlert('Error desde el servidor, contacte con un administrador', '', 'error');
            }
          }
        });
      }
    }
    
    prepareUpdateForm() {
      if (this.isExactlyOneSelected()) {
        this.selectedUser = { ...this.selection.selected[0] };
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