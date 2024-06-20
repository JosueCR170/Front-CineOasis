import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { Component } from '@angular/core';
import { CombosComponent } from './components/home/combos/combos.component';
import { IndexComponent } from './components/home/index/index.component';
import { PeliculaComponent } from './components/pelicula/pelicula.component';
import { UsuarioAdministracionComponent } from './components/home/usuario-administracion/usuario-administracion.component';
import { PeliculaAdministracionComponent } from './components/home/pelicula-administracion/pelicula-administracion.component';
import { ComidaAdministracionComponent } from './components/home/comida-administracion/comida-administracion.component';
import { AsientosComponent } from './components/home/asientos/asientos.component';
import { ImgPeliculaAdministracionComponent } from './components/home/img-pelicula-administracion/img-pelicula-administracion.component';
import { OfertaComboComponent } from './components/home/oferta-combo/oferta-combo.component';
import { PagoComponent } from './components/home/pago/pago.component';
import { FuncionAdministracionComponent } from './components/home/funcion-administracion/funcion-administracion.component';


export const routes: Routes = [
    {path:'',component: HomeComponent, children:[
        {path:'',component:IndexComponent},
        {path:'combos',component:CombosComponent},
        {path:'peliculas/:id', component:PeliculaComponent},
        {path:'usuarioAdministracion', component:UsuarioAdministracionComponent},
        {path:'peliculaAdministracion', component:PeliculaAdministracionComponent},
        {path:'imgPeliculaAdministracion', component:ImgPeliculaAdministracionComponent},
        {path:'comidaAdministracion',component:ComidaAdministracionComponent},
        {path:'asientos/:id',component:AsientosComponent},
        {path:'ofertaCombo',component:OfertaComboComponent},
        {path:'pago',component:PagoComponent},
        {path:'funcionAdministracion', component:FuncionAdministracionComponent},
        {path:'asientos/:id',component:AsientosComponent}]
    }
];
