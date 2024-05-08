var mongoose = require('mongoose');
var mongoodb = require('./utils/MongooDB.js');
var RecordingDataSchema = require('./models/RecordingData.js');
const logger = require ("./utils/Logger.js");

class Mongoo {
    static instance() {
        if (Mongoo.singleton) return Mongoo.singleton;
        Mongoo.singleton = new Mongoo();
        return Mongoo.singleton;
    }

    constructor() {
        this.databaseURL = "mongodb+srv://rodrigotobar:QLUoe48d3viEOzZ7@cluster.9wvliio.mongodb.net/?retryWrites=true&w=majority&appName=Cluster";
        this.initialized = false; 
        this.connection = null;
        this.mytenants = [];
    }

    async init(connectionString) {
        try {
            this.connection = await mongoodb.instance().init(this.databaseURL, 'ingestorjob');
            this.initialized = true;
        } catch(error) {
            logger.error("[Mongo][Error] => No se realizó la conexión a MongoDB: ingestorjob ");
            throw Error (error);
        }
    }


    isInitialized() {return this.initialized}


    Models(tenant) {
        try {
            if (!(tenant in this.mytenants)) {
                this.mytenants[tenant] = {
                    RecordingDataSchema: mongoose.model(tenant, RecordingDataSchema)
                }
            }

            return this.mytenants[tenant];

        } catch (error) {
            throw error;
        }
    }
}

exports.instance = function () {
    return Mongoo.instance();
}