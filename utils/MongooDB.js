var mongoose = require('mongoose');
const logger = require ("./Logger.js");
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
        this.databaseURL = process.env.MONGOURL;
        this.databaseName = process.env.MONGODB;
	this.mongoUser = process.env.MONGOUSER  ;
        this.mongoPass = process.env.MONGOPASS  ;

        this.initialized = false;        
    }

    async init() {
          
        try {
		// Construir la cadena de conexión con autenticación si es necesario
            const authPart = this.mongoUser && this.mongoPass ? `${encodeURIComponent(this.mongoUser)}:${encodeURIComponent(this.mongoPass)}@` : '';
	    const connectionString = `mongodb://${authPart}${this.databaseURL.replace(/^mongodb:\/\//, '')}/${this.databaseName}`;

	    await mongoose.connect(connectionString, {
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
            });

            this.initialized = true;
        } catch(error) {
            logger.error("[APILAYER][MongooDB][error] No se realizó la conexión a MongoDB: " + error);
            if (!this.initialized) { //solo lanzará excepción si no se conecta la primera vez
                throw Error(error);
            }
        }
    }

    isInitialized() {return this.initialized}
 
}


exports.instance = function () {
    return MongooDB.instance();
}


mongoose.connection.on('connecting', () => {
    logger.info("[APILAYER][MongooDB][connecting] => Estableciendo conexión a MongoDB DB: '" + MongooDB.instance().databaseName + "'");
    MongooDB.instance().client = true;
})

mongoose.connection.on('connected', () => {
    logger.info("[APILAYER][MongooDB][connected] => Conexión establecida a MongoDB DB: '" + MongooDB.instance().databaseName + "'");       
    MongooDB.instance().client = true;
})

mongoose.connection.on('disconnected', () => {
    logger.info("[APILAYER][MongooDB][disconnected] => Desconexión a MongoDB DB: '" + MongooDB.instance().databaseName + "'");
    MongooDB.instance().client = false;
})


mongoose.connection.on('error', (e) => {
    logger.info("[APILAYER][MongooDB][error] => Error en conexión a MongoDB DB: '" + e + "'");
})
