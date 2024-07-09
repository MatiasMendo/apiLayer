const mongoose = require('mongoose');
const logger = require("./Logger.js");
const dotenv = require('dotenv');
const path = require('path');

const caFilePath = path.join(__dirname, '../global-bundle.pem');
dotenv.config({path: path.join(__dirname, '../.env')});

class MongooDB {
    static instance() {
        if (MongooDB.singleton) return MongooDB.singleton;
        MongooDB.singleton = new MongooDB();
        return MongooDB.singleton;
    }

    constructor() {
        // Parámetros de conexión local
        this.connectionString = process.env.MONGOSTRCONNECTION
        this.databaseName = process.env.MONGODB  ;

        this.initialized = false;
    }

    async init() {
        try {

            let object = {
                dbName: this.databaseName
            };

            if(process.env.DOCUMENTDB == 'true') {
                object = {
                    // useNewUrlParser: true,
                    // useUnifiedTopology: true,
                    ssl: true,
                    readPreference: "secondaryPreferred",
                    replicaSet: "rs0",
                    retryWrites: false,
                    tlsAllowInvalidCertificates: true,
                    tlsCAFile: caFilePath,
                    dbName: this.databaseName,
                    authSource: this.databaseName
                }

            }


             await mongoose.connect(this.connectionString, object);
            
            // await mongoose.connect(connectionString, {
            //     useNewUrlParser: true,
            //     useUnifiedTopology: true,
            //     dbName: this.databaseName,
            //     authSource: this.databaseName // Si necesitas autenticación en una base de datos específica
            // });


            this.initialized = true;
            logger.info("[APILAYER][MongooDB][init] Conexión a MongoDB establecida correctamente.");
        } catch (error) {
            logger.error("[APILAYER][MongooDB][error] No se realizó la conexión a MongoDB: " + error);
            if (!this.initialized) { // Solo lanzará excepción si no se conecta la primera vez
                throw Error(error);
            }
        }
    }

    isInitialized() {
        return this.initialized;
    }
}

exports.instance = function () {
    return MongooDB.instance();
}

mongoose.connection.on('connecting', () => {
    logger.info("[APILAYER][MongooDB][connecting] => Estableciendo conexión a MongoDB: '" + MongooDB.instance().databaseName + "'");
    MongooDB.instance().client = true;
});

mongoose.connection.on('connected', () => {
    logger.info("[APILAYER][MongooDB][connected] => Conexión establecida a MongoDB: '" + MongooDB.instance().databaseName + "'");
    MongooDB.instance().client = true;
});

mongoose.connection.on('disconnected', () => {
    logger.info("[APILAYER][MongooDB][disconnected] => Desconexión a MongoDB: '" + MongooDB.instance().databaseName + "'");
    MongooDB.instance().client = false;
});

mongoose.connection.on('error', (e) => {
    logger.error("[APILAYER][MongooDB][error] => Error en conexión a MongoDB: '" + e + "'");
});
