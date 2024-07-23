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
            error:0,
            quota:0
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
exports.retrieved = async function (otenant_id, ojob_id, quotaxceeded) {

    const StatsjobData = mongoo.instance().Models(otenant_id).StatsjobDataSchema;
    let query = {
        "files.idle": -1,
        "files.retrieved": 1,
    };

    if (quotaxceeded) { //si la cuota está excedida, se agrega a estadísticas
        query = {
            "files.idle": -1,
            "files.retrieved": 1,
            "files.quota": 1
        };
    } 

    StatsjobData.findOneAndUpdate({ "job_id": ojob_id }, {
        $inc: query
    }).exec().then((doc) => {
        if (null == doc) {
            logger.info("[APILAYER][appendjob-stats] Error in parameter job_id " + ojob_id);
        }
    });
}



//actualiza estados para la ejecución de cada audio
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


//
// retorna un objeto JSON con las estadísticas asociadas al job en consulta 
//
async function getStatsObjectQuery(tenantid, jobid) {
    let StatsjobData = mongoo.instance().Models(tenantid).StatsjobDataSchema;
    return StatsjobData.findOne({ "job_id": jobid }).exec();
}

//
// retorna un objeto JSON con las estadísticas asociadas al job en consulta 
// como módulo
//
exports.getStatsObject = async function(tenantid, jobid) {
    return getStatsObjectQuery(tenantid, jobid);
}

//
//maneja respuestas a la API de consulta de estadísticas por job
//
exports.get_statsjob = async function (body, res) {

    if ((typeof body.tenant_id != "string") &&
        (typeof body.job_id != "string")
    ) {
        res.status(400).send();
        return
    }

    getStatsObjectQuery(body.tenant_id, body.job_id).then((doc) => {
        if (null == doc) {
            logger.info("[APILAYER][getstatsjob] Error in parameter job_id " + body.job_id);
            res.status(400).send();
            return
        }

        res.send({
            "duration": doc.seconds.finished,
            "job_time": doc.job_time,
            "last_time": doc.last_time,
            "files": {
                "total": doc.files.total,
                "processing": doc.files.retrieved - (doc.files.finished + doc.files.error),
                "finished": doc.files.finished,
                "error": doc.files.error
            }
        });
    });
}



// retorna un objeto JSON que contiene los segundos de audio
// que han sido correctamente procesados para el tenant
exports.getStatsTenantMonthly = async function(tenantid) {
    let StatsjobData = mongoo.instance().Models(tenantid).StatsjobDataSchema;
    let date = new Date();
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return StatsjobData.aggregate([
        { $match: { $and: [ {"tenant_id": tenantid}, {"job_time": { $gte: firstDay, $lte: lastDay }}] }},
        { $group: {_id: null, "finished" : { $sum: "$seconds.finished" } } }
    ]).exec();
}


// retorna info de los últimos jobs ejecutados dado el intervalo de entrada
//
exports.getJobsinInterval = async function (tenantid, init, end) {

    let StatsjobData = mongoo.instance().Models(tenantid).StatsjobDataSchema;
    return StatsjobData.find(
        { "tenant_id": tenantid,
            "last_time": {$gte: init, $lte: end }
     }).exec();
}

// retorna info de los últimos jobs ejecutados dado el intervalo de entrada
//
exports.getJobsOlderThan = async function (tenantid, date) {

    let StatsjobData = mongoo.instance().Models(tenantid).StatsjobDataSchema;
    return StatsjobData.find(
        { "tenant_id": tenantid,
            "last_time": {$lte: date }
     }).exec();
} 


//borrar las estadística del job
exports.remove_job = async function (tenant_id, _job_id) {
    let StatsjobData = mongoo.instance().Models(tenant_id).StatsjobDataSchema;
    StatsjobData.deleteMany({job_id: _job_id}).exec().then((o) => {
        logger.info("[APILAYER][removestatsjob] Tenant: "+ tenant_id +", job: "+ _job_id + ", removed: " + o.deletedCount +" objects");
    });
}

