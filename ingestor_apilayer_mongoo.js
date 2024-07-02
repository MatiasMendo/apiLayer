var mongoose = require('mongoose');
var mongoodb = require('./utils/MongooDB.js');
var RecordingDataSchema = require('./models/RecordingData.js');
var StatsjobDataSchema = require('./models/StatsjobData.js');
var ConfigDataSchema = require('./models/ConfigData.js');
const logger = require ("./utils/Logger.js");
const dotenv = require("dotenv");

dotenv.config();


class Mongoo {
    static instance() {
        if (Mongoo.singleton) return Mongoo.singleton;
        Mongoo.singleton = new Mongoo();
        return Mongoo.singleton;
    }

    constructor() {
	this.databaseURL = process.env.MONGOURL;
	this.initialized = false; 
        this.connection = null;
        this.mytenants = [];
        this.jobsdb = 'ingestorjob';
        this.configdb = 'ingestorconfig';
        this.myconfig = null;
    }

    async init(connectionString) {
        try {
            this.connection = await mongoodb.instance().init();//this.databaseURL, this.jobsdb);
            this.initialized = true;
        } catch(error) {
            logger.error("[APILAYER][Mongoo][Error] No se realizó la conexión a MongoDB DB: " + this.jobsdb);
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
