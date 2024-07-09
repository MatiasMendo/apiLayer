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
        this.databaseURL = process.env.MONGOURL ;
        this.databaseName = process.env.MONGODB  ;
        
        // Nuevos parámetros de usuario
        this.mongoUser = process.env.MONGOUSER  ;
        this.mongoPass = process.env.MONGOPASS  ;

        this.initialized = false;
    }

    async init() {
        try {
            // Construir la cadena de conexión con autenticación si es necesario
            const authPart = this.mongoUser && this.mongoPass ? `${encodeURIComponent(this.mongoUser)}:${encodeURIComponent(this.mongoPass)}@` : '';
            // const connectionString = process.env.MONGOURL
            const connectionString = 'mongodb://localhost:27017/'+this.databaseName;//`mongodb://${authPart}${this.databaseURL.replace(/^mongodb:\/\//, '')}/${this.databaseName}`;
            // const connectionString = `mongodb://docdb-voc-analytics-bac.cluster-cut4a8m5m6zz.us-east-1.docdb.amazonaws.com:27017/${this.databaseName}?ssl=true&retryWrites=false&replicaSet=rs0&readPreference=secondaryPreferred`
            console.log(connectionString)

            // mongodb://AdminSixbell:o5GgZ8CLs3@docdb-voc-analytics-bac.cluster-cut4a8m5m6zz.us-east-1.docdb.amazonaws.com:27017?ssl=true&retryWrites=false&replicaSet=rs0&readPreference=secondaryPreferred/Api_Layer
            // mongodb://Api_LayerUser:%40S%25%40P%24%40X%40%2F!qC%40%7CL%40%C2%B0C%40%26O%40%3F%40%24%40@127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.5/Api_Layer
            await mongoose.connect(connectionString, /*{
                // useNewUrlParser: true,
                // useUnifiedTopology: true,
                ssl: false,
                readPreference: "secondaryPreferred",
                replicaSet: "rs0",
                retryWrites: false,
                tlsAllowInvalidCertificates: true,
                tlsCAFile: caFilePath,
                dbName: this.databaseName,
                authSource: this.databaseName
            }*/);
            
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
