export class Pelicula{
    imagenes: any;
    constructor(
        public id:number,
        public nombre:string,
        public descripcion:string,
        public duracion:string,
        public idioma:string,
        public subtitulo:string,
        public genero:string,
        public fechaEstreno:string,
        public calificacionEdad:string,
        public animacion:string,
        public director:string,
        public elenco:string
    ){}
}