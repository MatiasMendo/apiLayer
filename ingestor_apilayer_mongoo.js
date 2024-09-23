var mongoose = require('mongoose');
var mongoodb = require('./utils/MongooDB.js');
var RecordingDataSchema = require('./models/RecordingData.js');
var StatsjobDataSchema = require('./models/StatsjobData.js');
var ConfigDataSchema = require('./models/ConfigData.js');
const logger = require ("./utils/Logger.js");
const dotenv = require("dotenv")
var cachegoose = require('recachegoose');

cachegoose(mongoose, {
  engine: 'memory'
});


dotenv.config()

class Mongoo {
    static instance() {
        if (Mongoo.singleton) return Mongoo.singleton;
        Mongoo.singleton = new Mongoo();
        return Mongoo.singleton;
    }

    constructor() {
        this.initialized = false; 
        this.connection = null;
        this.mytenants = [];
        this.configdb = 'Api_Layer_configs';
        this.myconfig = null;
    }

    async init() {
        try {
            this.connection = await mongoodb.instance().init();
            this.initialized = true;
        } catch(error) {
            logger.error("[APILAYER][Mongoo][Error] No se realizó la conexión a MongoDB: ingestorjob ");
            throw Error (error);
        }
    }


    isInitialized() {return this.initialized}


    Models(tenant) {
        try {
            if (!(tenant in this.mytenants)) {
                this.mytenants[tenant] = {
                    RecordingDataSchema: mongoose.model(tenant + '_data', RecordingDataSchema),
                    StatsjobDataSchema: mongoose.model(tenant + '_stats', StatsjobDataSchema)
                }

                this.mytenants[tenant].RecordingDataSchema.createIndexes().then(() => {
                    logger.info("[APILAYER][Mongoo] => RecordingDataSchema indexes created ")
                  }).catch(err => {
                    logger.info( "[APILAYER][Mongoo] => RecordingDataSchema indexes creation error: " + err);
                  });

                  this.mytenants[tenant].StatsjobDataSchema.createIndexes().then(() => {
                    logger.info("[APILAYER][Mongoo] => StatsjobDataSchema indexes created "
                    )
                  }).catch(err => {
                    logger.info( "[APILAYER][Mongoo] => StatsjobDataSchema indexes creation error: " + err);
                  });
            }

            return this.mytenants[tenant];

        } catch (error) {
            throw error;
        }
    }

    ModelConfig() {
        try {
            if(null == this.myconfig) {
                let conn = mongoose.connection.useDb(this.configdb, { useCache: true });
                logger.info("[APILAYER][Mongoo] => Agrega conexión a DB: " + this.configdb );
                this.myconfig = conn.model('configs', ConfigDataSchema);
            }
    
            return this.myconfig;
        
        } catch(error) {
            throw error;
        }
    
    }
    
}




exports.instance = function () {
    return Mongoo.instance();
}