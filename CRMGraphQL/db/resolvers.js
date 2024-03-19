const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({path: 'variables.env'});

const crearToken = (usuario, secreta, expiresIn) => {
    const { id, email, nombre, apellido } = usuario;

    // Crear el token con el payload (id, email, nombre, apellido).
    return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn });
}

// Resolver.
const resolvers = {
    Query: {
        obtenerUsuario: async (_, { token }) => {
            const usuarioId = await jwt.verify(token, process.env.SECRETA);

            return usuarioId;
        },
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch(error) {
                console.log(error)
            }
        },
        obtenerProducto: async (_, { id }) => {
            // Revisar si el producto existe
            const producto = await Producto.findById(id);

            if(!producto){
                throw new Error("Producto no encontrado");
            }

            return producto;
        }
    },
    Mutation: {
        nuevoUsuario: async (_, { input } ) => {
            const { email, password } = input;
            
            // Revisar si usuario está registrado.
            const existeUsuario = await Usuario.findOne({email});
            if(existeUsuario){
                throw new Error("El usuario ya está registrado");
            }

            // Hashear su password.
            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);

            try{
                // Guardarlo en la BD.
                const usuario = new Usuario(input);
                usuario.save();
                return usuario;

            } catch(error){
                console.log(error);
            }
        },
        autenticarUsuario: async (_, { input }) => {
            const { email, password } = input;

            // Verificar que el usuario exista.
            const existeUsuario = await Usuario.findOne({email});

            if(!existeUsuario){
                throw new Error("El usuario no existe");
            }   
            
            // Revisar si el password es correcto.
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);

            if(!passwordCorrecto){
                throw new Error("El password es incorrecto");
            }

            // Crear el token.
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '24h')
            }
        },
        nuevoProducto: async (_, { input }) => {
            try {
                const producto = new Producto(input);

                // Almacenar en la BD.
                const resultado = await producto.save();

                return resultado;

            } catch(error) {
                console.log(error);
            }
        },
        actualizarProducto: async (_, { id, input}) => {
            // Revisar si el producto existe.
            let producto = await Producto.findById(id);

            if(!producto){
                throw new Error("Producto no encontrado");
            }

            // Guardarlo en la BD.
            producto = await Producto.findOneAndUpdate({ _id: id }, input, { new: true });

            return producto;
        },
        eliminarProducto: async (_, { id }) => {
            // Revisar si el producto existe.
            let producto = await Producto.findById(id);

            if(!producto){
                throw new Error("Producto no encontrado");
            }

            // Eliminarlo de la BD.
            await Producto.findOneAndDelete({ _id: id });

            return "Producto eliminado";            
        }
    }
};

module.exports = resolvers;