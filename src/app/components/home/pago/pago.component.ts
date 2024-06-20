import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsientoCompartidoService } from '../../../services/asientoCompartido.service';
import { FuncionAsientoService } from '../../../services/funcionAsiento.service';
import { DetallesComboService } from '../../../services/detallesCombo.service';
import { TicketService } from '../../../services/ticket.service';
import { FuncionAsiento } from '../../../models/FuncionAsiento';
import { HttpErrorResponse } from '@angular/common/http';
import { DetallesTicketService } from '../../../services/detallesTicket.service';
import { Comida } from '../../../models/Comida';
import { DetallesCombo } from '../../../models/DetallesCombo';
import { Ticket } from '../../../models/Ticket';
import { User } from '../../../models/User';
import { UserService } from '../../../services/user.service';
import { DetallesTicket } from '../../../models/DetallesTicket';
import { Pelicula } from '../../../models/Pelicula';
import { PeliculaService } from '../../../services/pelicula.service';
import { FuncionService } from '../../../services/funcion.service';
import { Funcion } from '../../../models/Funcion';
import { Asiento } from '../../../models/Asiento';
import { ComidaService } from '../../../services/comida.service';
import { AsientoService } from '../../../services/asiento.service';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule,FormsModule,RouterModule],
  templateUrl: './pago.component.html',
  styleUrl: './pago.component.css'
})
export class PagoComponent implements OnInit {
  creditCardName: string = '';
  expirationMonth: string = '';
  creditCardNumber: string = '';
  expirationYear: string = '';
  total: number=0;
  precioAsiento: number = 3500;
  cvc: string = '';
  years:number[]=[];
  ano: number | null = null;
  mes: string | null = null;
  dia: string | null = null;
  idTicket: any;
  idFuncionAux = 0;
  public comidasSeleccionadas: { comida: Comida, cantidad: number }[] = [];
  public funcionAsientos:FuncionAsiento[]=[];
  public detalleCombo: DetallesCombo;
  public detalleTicket: DetallesTicket;
  public ticket: Ticket;
  public identity:User;
  public asientos: Asiento[]=[]
  public asiento: Asiento;
  public comidas: Comida[]=[]
  public comida: Comida;
  public idFuncion:any;
  public funcion: Funcion;
  public pelicula:Pelicula;
  constructor(
    private _serviceCompartido: AsientoCompartidoService,
    private _funcionAsientos: FuncionAsientoService,
    private _userService: UserService,
    private _comboDetalle: DetallesComboService,
    private _ticket:TicketService,
   private _ticketDetalle: DetallesTicketService,
   private _pelicula:PeliculaService,
   private _funcion:FuncionService,
   private _comidaService:ComidaService,
   private _asientoService:AsientoService,
   private _router: Router,
  ){
    this.comida = new Comida(1,"",1,"")
    this.pelicula = new Pelicula(1,"","","","","","","","","","","")
    this.asiento = new Asiento(1,1,"")
    this.detalleCombo = new DetallesCombo(0,0,0,0,0,0,0)
    this.ticket = new Ticket(0,0,0," ",0)
    this.detalleTicket = new DetallesTicket(0,0,0,0)
    this.identity = new User(0," ","","","","",false,"")
    this.funcion = new Funcion(0,0,"","","","",0)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 20; i++) {
      this.years.push(currentYear + i);
  }
}
ngOnInit(): void {
  this.loadIdentityAux();
  this.ObtenerIdFuncion();
  this.ObtenerDatosCombos();
  this.ObtenerPrecioTotal();
  
}

//---------------RESTRINGIR ACCESO A MODULOS------------------------------------
authTokenUser(){
  let aux = sessionStorage.getItem('identity');
 return aux===null ? false:true;
}

redirectToHome(){
  this._router.navigate(['']);
  this.msgAlert('Necesitas estar registrado para acceder a este módulo','','error');
}


  /*-------------------------------Usuario del sesion storage-------------------------*/
  loadIdentityAux(){this.identity=this._userService.getIdentityFromStorage();
  console.log(this.identity);
 }
/*----------------------Funciones del front-end--------------------------------------*/
  formatCreditCard() {
    let value = this.creditCardNumber.replace(/\D/g, '').substring(0, 16); // Elimina todo lo que no sea dígito y limita a 16 caracteres
    let sections = value.match(/.{1,4}/g); // Divide en secciones de 4 dígitos
    this.creditCardNumber = sections ? sections.join('-') : ''; // Une las secciones con guiones
  }
  handleInput(event: any) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Elimina todo lo que no sea dígito
    input.value = value;
    this.creditCardNumber = value;
    this.formatCreditCard();
  }
  // Limitar la entrada a 4 dígitos y solo números
  handleYearInput(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').substring(0, 4); // Solo permite números y limita a 4 dígitos
  }
  handleCVCInput(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').substring(0, 3); // Solo permite números y limita a 3 dígitos
  }
  onSubmit(paymentForm: any) {
    if (paymentForm.form.valid) {
      console.log('Éxito: Formulario válido. Realizando compra...');
          this.agregarAsiento();
          this.crearTicket();
    } else {
  
    }
  }
   /*------------------------------------------------------------------------------------------------*/
  /*--------------------------------Funciones de almacenamiento-------------------------------------*/
  obtenerDatosPelicula(){
    this.funcionAsientos = this._serviceCompartido.getSelectedAsientos();
  }
  ObtenerDatosCombos(){
    this.comidasSeleccionadas = this._serviceCompartido.getSelectedComidas();
    this.obtenerComida()
  }
   ObtenerIdFuncion(){
    this.idFuncion = this._serviceCompartido.getSelectedFuncionId();  
    this.obtenerAsientos()
 
  }
  obtenerPelicual(idPelicula:number){
    this._pelicula.show(idPelicula).subscribe({
      next:(response)=>{
        this.pelicula = response['pelicula']
        console.log("Pelicula",response);
      },error:(error:HttpErrorResponse)=>{
        console.log(error)
      if(error.message === "No tiene privilegios para acceso al recurso")
        console.log(error)
      } 
    })
  }
  obtenerFuncion(idFuncion:number){
    this._funcion.show(idFuncion).subscribe({
      next:(response)=>{
        this.funcion = response['funcion']
        console.log("funcion",response);
        this.obtenerPelicual(this.funcion.idPelicula)
      },error:(error:HttpErrorResponse)=>{
        console.log(error)
      if(error.message === "No tiene privilegios para acceso al recurso")
        console.log(error)
      } 
    })
  }
  obtenerAsientos(){
    this.obtenerFuncion(this.idFuncion)
    this.obtenerDatosPelicula()
    this.funcionAsientos.forEach(element => {
      console.log(element.idAsiento)
      this._asientoService.show(element.idAsiento).subscribe({
        next:(response)=>{
          this.asiento = response['asiento'];
          console.log("asiento",response)
          this.asientos.push(this.asiento); 
        },error:(error:HttpErrorResponse)=>{
          console.log("error asiento",error)
        if(error.message === "No tiene privilegios para acceso al recurso")
          console.log(error)
        }   
      })
    });
  }
  obtenerComida(){
    this.comidasSeleccionadas.forEach(comida =>{
      console.log("comida ",comida.comida.id)
        this._comidaService.show(comida.comida.id).subscribe({
        next:(response)=>{
          this.comida = response['Comida'];
          this.comidas.push(this.comida);
          console.log("comida ",this.comida)
          console.log("comidas ",this.comidas)
        },error:(error:HttpErrorResponse)=>{
          if(error.message === "No tiene privilegios para acceso al recurso")
            console.log(error)
          }   
      })
    }
    
    )
    
  }
  ObtenerPrecioTotal(){
 
    let precioAsientos = this.funcionAsientos.length * this.precioAsiento;
    let precioComidas = 0;
    this.comidasSeleccionadas.forEach(comida => {
      precioComidas += comida.cantidad * comida.comida.precio;
    });
    // Sumar ambos precios para obtener el total
    this.total = precioAsientos + precioComidas;
    console.log(this.total)
  }

  agregarAsiento(){

    this.funcionAsientos.forEach(element => {
      this._funcionAsientos.create(element).subscribe({
        next:(response)=>{
          console.log(response)
          
        },error:(error:HttpErrorResponse)=>{
        if(error.message === "No tiene privilegios para acceso al recurso")
          console.log(error)
        }   
      })
    });
  }

  agregarComboDetalle(ticket:any){
    if(this.comidasSeleccionadas.length!= 0){
       this.comidasSeleccionadas.forEach(comida =>{
      this.detalleCombo.cantidad = comida.cantidad
      this.detalleCombo.descuento = 0
      this.detalleCombo.idComida =  comida.comida.id
      this.detalleCombo.idTicket = ticket
      this.detalleCombo.impuesto = 0
      this.detalleCombo.subtotal = 0
      this._comboDetalle.create(this.detalleCombo).subscribe({
        next:(response)=>{
          console.log("DETALLE COMBOO",response);

        },error:(error:HttpErrorResponse)=>{
          console.log(error)
        if(error.message === "No tiene privilegios para acceso al recurso")
          console.log(error)
          
        } 
      })
    
    })
    }else{
      console.log("no hay comida")
    }
  }
  crearDetalleTicket(ticket:any){

    this.funcionAsientos.forEach(element => {
    this.detalleTicket.idTicket = ticket,
    this.detalleTicket.idAsiento = element.idAsiento
    this.detalleTicket.subtotal = this.precioAsiento
    this._ticketDetalle.create(this.detalleTicket).subscribe({
      next:(response)=>{
        console.log("Detalle ticket",response);
      },error:(error:HttpErrorResponse)=>{
        console.log(error)
      if(error.message === "No tiene privilegios para acceso al recurso")
        console.log(error)
      } 
    })
  })
  }
  crearTicket(){
  
    this.idFuncionAux = this._serviceCompartido.getSelectedFuncionId()
    this.ticket.idUsuario = this.identity.id;
    this.ticket.idFuncion = this.idFuncionAux
    this.ticket.fechaCompra = this.dateToString(new Date())
    this.ticket.precioTotal = this.total
    this._ticket.create(this.ticket).subscribe({
      next:(response)=>{
        this.idTicket = response['ticket']
        console.log("tickeeeeet",this.idTicket.id);
        this.agregarComboDetalle(this.idTicket.id)
        this.crearDetalleTicket(this.idTicket.id)
      },error:(error:HttpErrorResponse)=>{
        console.log(error)
      if(error.message === "No tiene privilegios para acceso al recurso")
        console.log(error)
        
      } 
    })
  }

  dateToString(date: Date): string {
    this.ano = date.getFullYear();
    this.mes = ('0' + (date.getMonth() + 1)).slice(-2); // Mes se cuenta desde 0
    this.dia = ('0' + date.getDate()).slice(-2);
    return `${this.ano}-${this.mes}-${this.dia}`;
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
