const MongoClient = require("mongodb");
const logger = require ("./Logger.js");

class MongoDB {
    static instance() {
        if (MongoDB.singleton) return MongoDB.singleton;
        MongoDB.singleton = new MongoDB();
        return MongoDB.singleton;
    }

    constructor() {
        this.client = null;
        this.databaseURL = process.env.MONGOURL;
        this.databaseName = process.env.MONGODB;
        this.db = null;        
    }
    get connected() {return this.client?true:false}

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async init(connectionString, dbName) {
        try {
            this.client = new MongoClient.MongoClient(connectionString, {useNewUrlParser:true, useUnifiedTopology:true});
            await this.client.connect();
            this.databaseURL = connectionString;
            this.databaseName = dbName;
            this.db = this.client.db(dbName); 
            logger.info("[MongoDB][Connect] => Conexión establecida a MongoDB: '"+ this.databaseName + "'");        
        } catch(error) {
            logger.error("[MongoDB][Error] => No se realizó la conexión a MongoDB: " + error);
            console.error(error);            
        }
    }

    isInitialized() {return this.db?true:false}

    async collection(name) {
        try {
            if (!this.db) throw "MongoDB connection to '" + this.databaseName + "' not initialized";
            return this.db.collection(name);
        } catch (error) {
            throw error;
        }
    }
}

exports.instance = function () {
    return MongoDB.instance();
}