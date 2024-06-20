import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Asiento } from '../../../models/Asiento';
import { AsientoService } from '../../../services/asiento.service';
import { FuncionAsientoService } from '../../../services/funcionAsiento.service';
import { Funcion } from '../../../models/Funcion';
import { FuncionService } from '../../../services/funcion.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FuncionAsiento } from '../../../models/FuncionAsiento';
import Swal from 'sweetalert2';
import { AsientoCompartidoService } from '../../../services/asientoCompartido.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-asientos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asientos.component.html',
  styleUrl: './asientos.component.css'
})
export class AsientosComponent {
  selectedAsientos: Asiento[]=[];
  asiento: Asiento;
  funcion: Funcion;
  idFuncion: number =0;
  funcionesAsientos: FuncionAsiento[]=[];
  funcionesAsientosAux: FuncionAsiento[]=[];
  asientos: Asiento[]=[];
  funcionAsientos: FuncionAsiento;
  flagSesion: boolean = false;
  public identity:any;
  constructor(
    private _asientoService:AsientoService,
    private _funcionAsientoService: FuncionAsientoService,
    private _funcionService:FuncionService,
    private _funcionCompartida:AsientoCompartidoService,
    private _userService: UserService, 
    private _router:Router,
    private route: ActivatedRoute 
  ){
   this.asiento = new Asiento(1,0,"")
   this.funcion = new Funcion(0,0,"","","","",0)
   this.funcionAsientos = new FuncionAsiento(1,1,1,false)
  }

  ngOnInit(): void { 
    this.getAsientos();   
    this.recibirFuncionAsientos()
    const id = this.route.snapshot.paramMap.get('id');
    this.obtenerFuncion(id);
 
    this.loadIdentuty()
  }

  authTokenUser(){
    let aux = sessionStorage.getItem('identity');
   return aux===null ? false:true;
  }

  redirectToHome(){
    this._router.navigate(['']);
    this.msgAlert('Necesitas estar registrado para acceder a este módulo','','error');
  }

  getAsientos(){
    this._asientoService.index().subscribe({
      next:(response:any) =>{
        this.asientos = response['data'];
      }
    })
  }

  veridAsiento(asiento: Asiento): void {
    // No permitir la selección de asientos ocupados
    if (this.isOccupied(asiento)) {
      return;
    }
    const index = this.selectedAsientos.findIndex(a => a.numero === asiento.numero && a.fila === asiento.fila);
    if (index === -1) {
      this.selectedAsientos.push(asiento);
    } else {
      this.selectedAsientos.splice(index, 1);
    }
    console.log(this.selectedAsientos);
  }

  isOccupied(asiento: Asiento): boolean {
    return this.funcionesAsientos.some(
      fa => fa.idAsiento === asiento.id && fa.idFuncion === this.funcion.id && fa.estado
    );
  }

  isSelected(asiento: Asiento): boolean {
    return this.selectedAsientos.some(a => a.numero === asiento.numero && a.fila === asiento.fila);
  }

  obtenerFuncion(id:any){
    this._funcionCompartida.setSelectFuncion(id);
    this._funcionService.show(id).subscribe(
      data=>{
        this.funcion = data['funcion']
        console.log(this.funcion)
      }
    )
  }
/** AGREGAR FUNCION */
    enviarFuncionAsientos(){
    this.selectedAsientos.forEach(element => {
    this.funcionAsientos.idFuncion =  this.funcion.id;
    this.funcionAsientos.idAsiento = element.id
    this.funcionAsientos.estado = true
    
    this.funcionesAsientosAux.push(this.funcionAsientos)
    });

   /* this._funcionAsientoService.create(this.funcionAsientos).subscribe({
      next:(response)=>{
        console.log(response)
      },error:(error:HttpErrorResponse)=>{
      if(error.message === "No tiene privilegios para acceso al recurso")
        console.log(error)
        
      }   
    })
  }*/
  }
  loadIdentuty(){this.identity = this._userService.getIdentityFromStorage(); console.log(this.identity)}


  enviarServiceCompartido() {
    if (this.identity == null) {
    } else {
      if (this.selectedAsientos.length === 0) {
        this.msgAlert('Debe seleccionar al menos un asiento','Por favor, seleccione un asiento antes de continuar.','warning' );
      } else {
        this.enviarFuncionAsientos();
        if (this.funcionesAsientosAux.length == 0) {
          console.log("no hay asientos seleccionados");
        } else {
          this.funcionesAsientosAux = [];
          this.selectedAsientos.forEach(element => {
            let nuevoFuncionAsiento = new FuncionAsiento(0, 0, 0, false);
            nuevoFuncionAsiento.idFuncion = this.funcion.id;
            nuevoFuncionAsiento.idAsiento = element.id;
            nuevoFuncionAsiento.estado = true;
            this.funcionesAsientosAux.push(nuevoFuncionAsiento);
          });
          this._funcionCompartida.setSelectedAsientos(this.funcionesAsientosAux);
          console.log("asientos GET:", this._funcionCompartida.getSelectedAsientos());
          this._router.navigate(['/ofertaCombo']);
        }
      }
    }
  }
  
  recibirFuncionAsientos(){
    this._funcionAsientoService.index().subscribe({
      next:(response:any)=>{   console.log("entro funcion"),
        this.funcionesAsientos = response['data']
        console.log(this.funcionesAsientos)
      },error(error:any){
        console.log(error)
      }
    })
  }

  
    //--------------------------FUNCIONES DE ALERTAS-------------------------------------------------------------------
 msgAlert= (title:any, text:any, icon:any) =>{
  Swal.fire({
    title,
    text,
    icon,
  })
}
}
