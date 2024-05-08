var mongoose = require('mongoose');
const logger = require ("./Logger.js");


class MongooDB {
    static instance() {
        if (MongooDB.singleton) return MongooDB.singleton;
        MongooDB.singleton = new MongooDB();
        return MongooDB.singleton;
    }

    constructor() {
        this.databaseURL = process.env.MONGOURL;
        this.databaseName = process.env.MONGODB;
        this.initialized = false;        
    }
    get connected() {return this.client?true:false}

    async init(connectionString, dbName) {
          
        try {
            this.databaseName = dbName;
            await mongoose.connect(connectionString, { dbName: this.databaseName })
            this.databaseURL = connectionString;
            this.initialized = true;
        } catch(error) {
            logger.error("[MongoDB][error] => No se realizó la conexión a MongoDB: " + error);
            throw Error(error);
        }
    }



    isInitialized() {return this.initialized}
 
}


exports.instance = function () {
    return MongooDB.instance();
}


mongoose.connection.on('connected', () => {
    logger.info("[MongoDB][connected] => Conexión establecida a MongoDB: '" + MongooDB.instance().databaseName + "'");       
    MongooDB.instance().client = true;
})

mongoose.connection.on('disconnected', () => {
    logger.info("[MongoDB][disconnected] => Desconexión a MongoDB: '" + MongooDB.instance().databaseName + "'");
    MongooDB.instance().client = false;
})


mongoose.connection.on('error', (e) => {
    logger.info("[MongoDB][error] => Error en conexión a MongoDB: '" + e + "'");
})