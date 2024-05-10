const logger = require('./utils/Logger.js');
const mongoo = require('./ingestor_apilayer_mongoo.js');

//inserta nuevo job e inicializa contadores
exports.initjob = async function (otenant_id, ojob_id, ojob_time, ototal) {

    let document = {
        tenant_id: otenant_id,
        job_id: ojob_id,
        job_time: ojob_time,
        files: {
            total: ototal,
            idle: ototal,
            retrieved: 0,
            processing: 0,
            finished: 0,
            error:0
        },
        seconds: {
            finished: 0,
            error: 0
        }
    }

    const StatsjobData = mongoo.instance().Models(otenant_id).StatsjobDataSchema;
    var sjddoc = new StatsjobData(document);
    sjddoc.save();
}

//agrega archivos a job existente, incrementa contadores iniciales
exports.appendjob = async function (otenant_id, ojob_id, ototal) {

    const StatsjobData = mongoo.instance().Models(otenant_id).StatsjobDataSchema;
    StatsjobData.findOneAndUpdate({ "job_id": ojob_id }, {
        $inc: {
            "files.total": ototal,
            "files.idle": ototal
        }
    }).exec().then((doc) => {
        if (null == doc) {
            logger.info("[APILAYER][appendjob-stats] Error in parameter job_id " + ojob_id);
        }
    });
}

//se toman archivos, cambia de estado archivos de idle a retreived
exports.retrieved = async function (otenant_id, ojob_id) {

    const StatsjobData = mongoo.instance().Models(otenant_id).StatsjobDataSchema;
    StatsjobData.findOneAndUpdate({ "job_id": ojob_id }, {
        $inc: {
            "files.idle": -1,
            "files.retrieved": 1,
        }
    }).exec().then((doc) => {
        if (null == doc) {
            logger.info("[APILAYER][appendjob-stats] Error in parameter job_id " + ojob_id);
        }
    });
}

//actualiza estados
exports.updatestate = async function (otenant_id, ojob_id, omodule, ostate, oduration) {

    console.log(omodule + " " + ostate)

    let update = {};
    if (("input" == omodule) && ("STARTING" == ostate)) {
        update.$inc = {};
        update.$inc['files.processing'] = 1;
    }
    else if (("uploader" == omodule) && ("FINISHED" == ostate)) {
        update.$inc = {};
        update.$inc['files.finished'] = 1;
        update.$inc['files.processing'] = -1;
        update.$inc['seconds.finished'] = oduration;
    }
    else if ((ostate == "ERROR") || (ostate == "BAD_FILE")) {
        update.$inc = {};
        update.$inc['files.error'] = 1;
        update.$inc['files.processing'] = -1;
        update.$inc['seconds.error'] = oduration;
    }
    else {
        return;
    }

    const StatsjobData = mongoo.instance().Models(otenant_id).StatsjobDataSchema;
    update.last_time = new Date();

    StatsjobData.findOneAndUpdate({ "job_id": ojob_id }, update).exec().then((doc) => {
        if (null == doc) {
            logger.info("[APILAYER][updatestate-stats] Error in parameter job_id " + ojob_id);
        }
    });
}

