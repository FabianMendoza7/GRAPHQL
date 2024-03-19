const {ApolloServer} = require("apollo-server");
const typeDefs = require("./db/schema");
const resolvers = require("./db/resolvers");
const conectarDB = require("./config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config({path: 'variables.env'});

// Conectar a la BD.
conectarDB();

// Servidor Apollo.
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({req}) => {
        const token = req.headers["authorization"] || "";

        if(token){
            try{
                const usuario = await jwt.verify(token, process.env.SECRETA);

                return {
                    usuario
                };
                
            } catch(error){
                console.log("Hubo un error");
                console.log(error);
            }
        }
    }
});

// Iniciar el servidor.
server.listen().then(({url}) => {
    console.log(`Servidor listo en la URL ${url}`);
});