const logger = require('./utils/Logger.js');
const quota = require('./utils/Quota.js');
const mongoo = require('./ingestor_apilayer_mongoo.js');
const statsjob = require('./ingestor_apilayer_statsjob.js');
const { v4: uuidv4 } = require('uuid');

const max_files_newjob = 75;


function check_andbuild(body, newjob, maxelem) {

    let audios_array = [];

    if ((undefined == body.tenant_id) || (typeof body.tenant_id != "string")) {
        logger.info("[APILAYER][new] Error in parameter tenant_id");
        throw Error("Error in parameter tenant_id");
    }

    if ((undefined == body.audios) || (typeof body.audios != "object") || (false == Array.isArray(body.audios))) {
        logger.info("[APILAYER][new] Error in parameter audios");
        throw Error("Error in parameter audios");
    }

    //setea el uuid identificador del job
    let myjob_id = null;
    if (undefined == newjob || true == newjob) {
        myjob_id = uuidv4();
    }
    else if ((undefined == body.job_id) || (typeof body.job_id != "string")) {
        logger.info("[APILAYER][new] Error in parameter job_id");
        throw Error("Error in parameter job_id");
        return false;
    }
    else {
        myjob_id = body.job_id;
    }

    let idx = 0; 
    body.audios.forEach((o) => {
        let obj = {}
        obj.tenant_id = body.tenant_id;
        obj.job_id = myjob_id;
        obj.job_time = new Date();
        obj.source = o.source;
        obj.duration = o.duration;
        obj.metadata = o.metadata;
        obj.file_id = uuidv4();
        obj.type = "AUDIO";
        obj.stage = {};
        obj.stage.input = "IDLE";
        obj.stage.converter = "IDLE";
        obj.stage.zipper = "IDLE";
        obj.stage.uploader = "IDLE";
        obj.status = "IDLE";

        audios_array.push(obj);
        idx++;

        if(idx > maxelem) throw Error('Max lements ' + maxelem + ' reached, aborting')

    })

    return audios_array;
}



async function insert_job(body, res, newjob) {

    let mydocuments = null;
    try {
        mydocuments = check_andbuild(body, newjob, max_files_newjob);
    }
    catch (e) {
        logger.info('[APILAYER][new] Bad body, returning code 400 ' + e.message)
        res.status(400).send(e.message)
        return;
    }
    
    if (false == mydocuments) {
        logger.debug('[APILAYER][new] Bad body, returning code 400')
        res.status(400).send()
        return;
    }

    if (0 == mydocuments.length) {
        logger.debug('[APILAYER][new] audios array is empty, returning code 400')
        res.status(400).send()
        return;
    }

    let mytenant_id = mydocuments[0].tenant_id;
    let myjob_id = mydocuments[0].job_id;
    let myjob_time = mydocuments[0].job_time;

    let RecordingData = mongoo.instance().Models(mytenant_id).RecordingDataSchema;
    RecordingData.insertMany(mydocuments, { lean: false, throwOnValidationError: true })
        .then((docs) => {
            logger.debug("[APILAYER][new] Inserted " + docs.length + "documents to DB");
            res.send({
                'tenant_id': mytenant_id,
                'job_id': myjob_id,
                'total': docs.length
            });

            //inserta estad sticas
            if (newjob) {
                statsjob.initjob(mytenant_id, myjob_id, myjob_time, docs.length);
            }
            else {
                statsjob.appendjob(mytenant_id, myjob_id, docs.length);
            }
 
        }).catch((e) => {
            logger.error('[APILAYER][new] catching db InsertMany error ' + e);
            res.status(500).send();
        });
}




exports.new_job = async function (body, res) {
    insert_job(body, res, true);
}

exports.append_job = async function (body, res) {
    insert_job(body, res, false);
}


//extrae registros desde mongodb. Gatillado por microservicios input 
exports.get_job = async function (body, res) {

    if ((undefined == body.tenant_id) || (typeof body.tenant_id != "string")) {
        logger.info("[APILAYER][getjob] Error in parameter tenant_id");
        res.status(400).send();
        return;
    }
    
    if ((undefined == body.limit) || (typeof body.limit != "number")) {
        logger.info("[APILAYER][getjob] Error in parameter limit");
        res.status(400).send();
        return;
    }

    let qt = quota.getObject(body.tenant_id); //chequeará quota
    const overhead = 5;
    let RecordingData = mongoo.instance().Models(body.tenant_id).RecordingDataSchema;
    RecordingData.find({ status: 'IDLE' }).limit(overhead * body.limit).exec().then(async (query) => {
        let documents = [];
        let idx = 0;
        if (null != query) {
            for(let i=0; ((i < query.length) && (idx < body.limit)); i++) {
                let doc = query[i];
                let quotareached = null;

                try {
                    quotareached = await qt.reached(doc.job_id);
                }
                catch(e) {
                    logger.info("[APILAYER][getjob] Error getting quota: " + e);
                }

                if(quotareached == false) { //entra si quota no está alcanzada
                    documents[idx] = {
                        "tenant_id": doc.tenant_id,
                        "job_id": doc.job_id,
                        "source": doc.source,
                        "duration": doc.duration,
                        "file_id": doc.file_id,
                        "type": doc.type
                    };
                    idx++;
                    //update el documento a processing
                    doc.status = "PROCESSING";
                    doc.input_time = new Date();
                    doc.save();
                
                    statsjob.retrieved(doc.tenant_id, doc.job_id, false);
                }
                else if(quotareached == true) { //entra si quota está alcanzada
                    doc.status = "QUOTA_EXECEEDED";
                    doc.input_time = new Date();
                    doc.save();

                    statsjob.retrieved(doc.tenant_id, doc.job_id, true);
                }
                else {
                    logger.info("[APILAYER][getjob] Error, invalid quotareached: " + quotareached);
                }
            }
        } 
            // Envia los audios
        res.send({
            "total": idx,
            "audios": documents
        })

    })
}


exports.remove_job = async function (tenant_id, _job_id) {
    let RecordingData = mongoo.instance().Models(tenant_id).RecordingDataSchema;
    RecordingData.deleteMany({job_id: _job_id}).exec().then((o) => {
        logger.info("[APILAYER][removejob] job " + _job_id +", tenant "+ tenant_id +", Removed: " + o.deletedCount +" objects");
    });
}

     
