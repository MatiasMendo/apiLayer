const logger = require('./utils/Logger.js');
const quota = require('./utils/Quota.js');
const mongoo = require('./ingestor_apilayer_mongoo.js');
const statsjob = require('./ingestor_apilayer_statsjob.js');
const config = require('./ingestor_apilayer_config.js');
const newfiles = require('./ingestor_apilayer_newfiles.js');
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
        //return false;
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
        obj.stage.verificator = "IDLE";
        obj.stage.input = "IDLE";
        obj.stage.converter = "IDLE";
        obj.stage.zipper = "IDLE";
        obj.stage.uploader = "IDLE";

        obj.status = "IDLE";

        if(o.customdata != undefined) {
            obj.customdata = o.customdata;
        }
        else {
            obj.customdata = "";
        }

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
        logger.info('[APILAYER][new] Bad body, returning code 400 ' + e)
        res.status(400).send(e.message)
        return;
    }
    
    if (0 == mydocuments.length) {
        if(newjob == false) { //
            logger.debug('[APILAYER][new] audios array is empty appending data to job, returning code 400')
            res.status(400).send()
        }
        else { //solo para nuevos jobs, se puede crear vacío
            logger.debug('[APILAYER][new] audios array is empty, returning an empty job');
            let mytenant_id = body.tenant_id;
            let myjob_id = uuidv4();

            res.send({
                'tenant_id': mytenant_id,
                'job_id': myjob_id,
                'total': 0
            });

            statsjob.initjob(mytenant_id, myjob_id, new Date(), 0);
        }
        return;
    }

    let mytenant_id = mydocuments[0].tenant_id;
    let myjob_id = mydocuments[0].job_id;
    let myjob_time = mydocuments[0].job_time;

    let RecordingData = mongoo.instance().Models(mytenant_id).RecordingDataSchema;
    RecordingData.insertMany(mydocuments, { lean: false, throwOnValidationError: true })
        .then((docs) => {
            logger.debug("[APILAYER][new] Inserted " + docs.length + " documents to DB");
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
    if ((undefined == body.tenant_id) || (typeof body.tenant_id != "string")) {
        logger.info("[APILAYER][append] Error in parameter tenant_id");
        res.status(400).send("tenant_id empty");
        return;
    }
    if ((undefined == body.job_id) || (typeof body.job_id != "string")) {
        logger.info("[APILAYER][append] Error in parameter job_id");
        res.status(400).send("job_id empty");
        return;
    }

    statsjob.getStatsObject(body.tenant_id, body.job_id).then((obj)=>{
        if(obj != null) {
            insert_job(body, res, false);
        } 
        else {
            logger.error("[APILAYER][append] Error appending, no exist job_id: " + body.job_id);
            res.status(400).send("no exist job_id");
        }
    });

    
}

//
//extrae registros desde mongodb. Gatillado por microservicios input 
//
async function get_myjob(body, res, uservice) {

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

     // Setea la query a realizar a los rgistros de acuerdo a la configuración y el uservicio q 
    // realiza la consulta
    //
    let myquery = {
        "status": "IDLE"
    };
        
    let qt = quota.getObject(body.tenant_id); //chequeará quota
    const overhead = 5;
    let RecordingData = mongoo.instance().Models(body.tenant_id).RecordingDataSchema;
    RecordingData.find(myquery).limit(overhead * body.limit).exec().then(async (query) => {
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

                if(quotareached == true) { //entra si quota está alcanzada
                    doc.status = "QUOTA_EXCEEDED";
                    doc.input_time = new Date();
                    await doc.save();
                    statsjob.retrieved(doc.tenant_id, doc.job_id, true);
                }
                else if(quotareached == false) { //entra si quota no está alcanzada
                    
                    if(uservice == 'input') {
                        documents[idx] = {
                            "tenant_id": doc.tenant_id,
                            "job_id": doc.job_id,
                            "source": doc.source,
                            "duration": doc.duration,
                            "file_id": doc.file_id,
                            "type": doc.type
                        };

                        //INPUT fuerza stage verificator a terminado
                        doc.stage.verificator = "FINISHED";
                        
                    }
                    else if(uservice == 'verificator'){
                        documents[idx] = {
                            "tenant_id": doc.tenant_id,
                            "job_id": doc.job_id,
                            "source": doc.source,
                            "duration": doc.duration,
                            "file_id": doc.file_id,
                            "customdata": doc.customdata,
                            "metadata": doc.metadata,
                            "type": doc.type
                        };
                    }

                    doc.status = "PROCESSING";
                    doc.input_time = new Date();
                    await doc.save();
                    await statsjob.retrieved(doc.tenant_id, doc.job_id, false);

                }
                else {
                    logger.info("[APILAYER][getjob] Error, invalid quotareached: " + quotareached);
                }
                idx++;
            }
        } 
            // Envia los audios
        res.send({
            "total": idx,
            "audios": documents
        })

    })
}


//gatillado por algún microservicio INPUT
exports.get_job = async function (body, res) {

    if ((undefined == body.tenant_id) || (typeof body.tenant_id != "string")) {
        logger.info("[APILAYER][getjob] Error in parameter tenant_id");
        res.status(400).send();
        return;
    }

    try {
        if('input' == await config.getFirstuService(body.tenant_id)) {
            await get_myjob(body, res, 'input');
        }
        else { //si no es el primer uservice se comporta como cualquier otro
            await newfiles.get('input', body, res);
        }
    }
    catch(e) {
        logger.error("[APILAYER][getjob] Error in get_job");
        res.status(500).send();
    }
}


//gatillado por algún microservicio verificator
exports.verify_job = async function (body, res) {
    if ((undefined == body.tenant_id) || (typeof body.tenant_id != "string")) {
        logger.info("[APILAYER][verifyjob] Error in parameter tenant_id");
        res.status(400).send();
        return;
    }

    try {
        if('verificator' == await config.getFirstuService(body.tenant_id)) {
            await get_myjob(body, res, 'verificator');
        }
        else { //si no es el primer uservice rtorna un 4XX
            res.status(400).send();
        }
    }
    catch(e) {
        logger.error("[APILAYER][verifyjob] Error in get_job");
        res.status(500).send();
    }
}


exports.remove_job = async function (tenant_id, _job_id) {
    let RecordingData = mongoo.instance().Models(tenant_id).RecordingDataSchema;
    RecordingData.deleteMany({job_id: _job_id}).exec().then((o) => {
        logger.info("[APILAYER][removejob] Tenant: "+ tenant_id +", job: "+ _job_id + ", removed: " + o.deletedCount +" objects");
    });
}

     
