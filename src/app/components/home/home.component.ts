import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../models/User';
import { HttpErrorResponse } from '@angular/common/http';
import { timer } from 'rxjs';
import { UserService } from '../../services/user.service';
import { initFlowbite } from 'flowbite';
import Swal from 'sweetalert2';
import { ImagenService } from '../../services/imagen.service';
import { server } from '../../services/global';
import { AsientoCompartidoService } from '../../services/asientoCompartido.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,FormsModule,RouterModule, MatButtonModule, MatDialogModule, ReactiveFormsModule],
  templateUrl:'./home.component.html',
  styleUrl:'./home.component.css',
  providers:[UserService]
})
export class HomeComponent {

  
  public status:number;
  public user:User;
  public identityAux: any;
  public identity:any;
  public errores:string[]=[];
  private checkIdentity;
  public selectedFile: File | null = null;
  public imageURL:string='';
  urlAPI: string;
  
    constructor(
      private _userService:UserService,
      private _imagenService:ImagenService,
      private _router: Router,
      private _servicioCompartido: AsientoCompartidoService
    ){
      this.urlAPI = server.url+'imagen/show/';
      this.status=-1;
      this.user=new User(1,"","","","","",false,null);

      this.checkIdentity=setInterval(()=>{
        //this.identity=_userService.getIdentityFromStorage()
        // console.log('nuevo token',this.identity)
        this.verificarToken()
      },5000)
    }
  ngOnInit(): void {
    initFlowbite();
    this.loadIndentityAux();

    if (this.identityAux && this.identityAux.imagen) {
      this.getUserImage(this.identityAux.imagen);
    } else {
      this.imageURL = "../../../assets/img/R.jpg";
    }
  }

  //---------VERIFICAR TOKEN-----------------
  verificarToken() {
    this._userService.verifyToken().subscribe({
      next: (response: any) => {
        console.log('response',response);
        if (!response) {
          sessionStorage.clear();
          console.log("Sesión borrada");
          this._router.navigate(['']);
          location.reload();
          this.msgAlert('Token caducado','Inicia sesión nuevamente','error');
        } else {
         this.identity = this._userService.getIdentityFromStorage();
          console.log(this.identity);
        }
      },
      error: (err: Error) => {
        console.log('error del response',err);
      }
    });
  }
  
  //Obtener imagen de usuario
  getUserImage(filename:string)
  {if(filename==''){
  this.imageURL = "../../../assets/img/R.jpg";
}else{
      this._imagenService.getImage('usuarios',filename).subscribe({
      next: (response: any) => {
        this.imageURL= URL.createObjectURL(response);
      },
      error: (err: Error) => {
        console.log('error',err);
        this.imageURL = "../../../assets/img/R.jpg"; 
      }
    });

  }
  }

  //FUNCION QUE CARGA AUXILIAR DE INDENTITY PARA ACTUALIZAR EL USUARIO
  loadIndentityAux(){this.identityAux=this._userService.getIdentityFromStorage();}

  //-------------FUNCION QUE LIMPIA FORM----------------
  resetForm(form:any){form.reset();}

//---------FUNCION UTILIZADA PARA CERRAR EL DIALOG DE ACTUALIZAR USUARIO-------------
  closeUpdateUserDialog(form:any){
    this.loadIndentityAux();
    this.resetForm(form);
  }

//--------------------DIALOG LOGIN------------------------------------------------
login(form:any){
  this.status=-1;
  this._userService.login(this.user).subscribe({
    next:(response)=>{
      if(response.status != 401){
        sessionStorage.setItem("token", response);
        this._userService.getIdentityFromAPI().subscribe({
          next:(resp:any)=>{
            sessionStorage.setItem('identity', JSON.stringify(resp));
            this.resetForm(form);
            location.reload();
          },
          error:(error:Error)=>{
            console.log(error);
          }
        })
      } else {
        this.status = 0;
        this.msgAlert('Datos incorrectos','', 'error');
        this.resetForm(form);
      }
    },
    error:(error:HttpErrorResponse)=>{
      if (error.status === 406 && error.error && error.error.errors) {
        this.errores = [];
        const errorObj = error.error.error;
        for (const key in errorObj) {
          if (errorObj.hasOwnProperty(key)) {
            this.errores.push(...errorObj[key]);
          }
        }
        console.error(this.errores);
      } else {
        console.error('Otro tipo de error:', error);
        this.msgAlert('Error desde el servidor, contacte con un administrador', '', 'error');
      }
      this.changeStatus(2);
    }
  })
}
//--------------------------------Editar perfil-------------------------------------------------------------

onImageFileChange(event: any): void {
  this.selectedFile = event.target.files[0];

}

updateImageUser(form:any) {
let user=new User(this.identityAux.iss,this.identityAux.name,this.identityAux.apellido,this.identityAux.email,'',
  this.identityAux.fechaNacimiento,this.identityAux.permisoAdmin,this.identityAux.imagen);

if(this.selectedFile==null)
  {
    this.updateInfoUser(user);
   
  }else{

  if(user.imagen===''){
    this._imagenService.uploadImageStore(this.selectedFile!,"usuarios").subscribe({
      next: (response: any) => {
        user.imagen=response['filename'];
        this.updateInfoUser(user);
        this.getUserImage(response['filename']);
        this.resetForm(form);
      },
      error: (err: Error) => {
        console.log(err);
      }
    });
  }else{
    this._imagenService.updateImage(this.selectedFile!,"usuarios", user.imagen!).subscribe({
      next: (response: any) => {

        this.updateInfoUser(user);
        this.getUserImage(this.identityAux.imagen)
        this.resetForm(form);
      },
      error: (err: Error) => {
        console.log(err);
        
      }
    });
  }
}
}

updateInfoUser(user:User){
  this._userService.update(user).subscribe({
    next: (response: any) => {
      sessionStorage.setItem('token',response.token);

      this._userService.getIdentityFromAPI().subscribe({
        next:(resp:any)=>{
          sessionStorage.setItem('identity', JSON.stringify(resp));
          this.identityAux=this._userService.getIdentityFromStorage();
         
        },
        error:(error:Error)=>{
          console.log(error);
        }
      });
      this.msgAlert('Usuario Actualizado','','success');
    },
    error: (err: Error) => {
      console.log(err);
      this.msgAlert('Error del servidor, contacte con un administrador','','error');
    }
  });
}


//------------------------------CERRAR SESION---------------------------------------------------------------
logOut(){
  sessionStorage.clear();
  this.identityAux=null;
  this.identity=null;
this._router.navigate([''])
}

//--------------------DIALOG REGISTER------------------------------------------------

    registerUser(form:any){
      this._userService.create(this.user).subscribe({
        next:(response)=>{
          console.log(response);
          if(response.status==201){
            this.resetForm(form);
            this.msgAlert('Usuario creado con éxito','','success');
            this.changeStatus(0);
          }else{
            this.changeStatus(1);
          }
        },
        error:(error:HttpErrorResponse)=>{
          if (error.status === 406 && error.error && error.error.error) {
            this.errores = [];
            const errorObj = error.error.error;
            for (const key in errorObj) {
              if (errorObj.hasOwnProperty(key)) {
                this.errores.push(...errorObj[key]);
              }
            }
            console.error(this.errores);
          } else {
            console.error('Otro tipo de error:', error);
            this.msgAlert('Error desde el servidor, contacte con un administrador', '', 'error');
          }
          this.changeStatus(2);
        }
      })
    }

    changeStatus(st:number){
      this.status=st;
      let countdown=timer(5000);
      countdown.subscribe(n=>{
        this.status=-1;
      })
    }
  
    //--------------------FUNCIONES DE FECHAS---------------------------------------------------
    dateToString(date: Date): string {
      let ano = date.getFullYear();
      let mes = ('0' + (date.getMonth() + 1)).slice(-2); // Mes se cuenta desde 0
      let dia = ('0' + date.getDate()).slice(-2);
      return `${ano}-${mes}-${dia}`;
    }
  
    public formatDate(event:Event): string {
      const input = event.target as HTMLInputElement;
      const fecha = new Date(input.value);
      let ano = fecha.getFullYear();
      let mes = ('0' + (fecha.getMonth() + 1)).slice(-2); // Mes se cuenta desde 0
      let dia = ('0' + fecha.getDate()).slice(-2);
      return `${ano}-${mes}-${dia}`;
    }


//--------------------------FUNCIONES DE ALERTAS-------------------------------------------------------------------
msgAlert= (title:any, text:any, icon:any) =>{
  Swal.fire({
    title,
    text,
    icon,
  })
}



//-------------------------Activar modal inicio de sesion en asiento---------------------------------------------------------//
/*activarModal(): void {
  this._servicioCompartido.modalTrigger$.subscribe(() => {
    const modalElement = document.getElementById('exampleModal');

    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    } else {
      console.error('Elemento modal no encontrado');
    }
  });
}*/


}