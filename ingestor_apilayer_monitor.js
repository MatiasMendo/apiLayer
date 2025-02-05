
const stats = require('./ingestor_apilayer_statsjob.js');
const apijobs = require('./ingestor_apilayer_jobs.js');
const config = require('./ingestor_apilayer_config.js');
const logger = require('./utils/Logger.js');
const dotenv = require ('dotenv');
//const cloudwatchMetrics = require('cloudwatch-metrics');

dotenv.config();

const default_retention = 60; //retención ed data máximo 90 días
// cloudwatchMetrics.initialize({
//     region: 'us-east-1'
// });


// Extrea indicadores que se ejecutan una vez al día
exports.tenant = async function(tenant) {

    try {
        let mytenants = await config.getAllTenants();
        for(let myidx = 0; myidx < mytenants.length; myidx++) {
            let tenant = mytenants[myidx];
            logger.info("[APILAYER][tenant monitor] Analyzing tenant "+ (myidx + 1) +"/"+ mytenants.length +": "+ tenant);
            //
            //analiza los segundos subidos por tenant hasta este mes
            let s = await stats.getStatsTenantMonthly(tenant);
            let seconds = 0;
            if(undefined != s[0]) seconds = s[0].finished;
            let hours = Math.floor(seconds / 3600);
            seconds %= 3600;
            let minutes = Math.floor(seconds / 60);
            seconds %= 60;

            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;

            //envía registro a cloudwatch
            let myMetric = new cloudwatchMetrics.Metric('VoC CORE', 'Count', [{
                Name: 'Ingestor',
                Value: tenant
                }], 
                {                 
                    sendCallback: (err) => {
                        if (!err) return;
                        logger.error("Error creating cloudwatch metrics " + err);

                    }
                }
            );
            
            myMetric.put(hours, 'HTM', "Count");
            //
            //logea registro
            logger.info("[APILAYER][tenant monitor] {'tenant': '"+ tenant + "', 'uploaded': '"+ hours +":"+ minutes + ":" + seconds +"'}")
            //
            //
        }
    }
    catch(e) {
        logger.error("[APILAYER][monitor] Error tenant " + e.message)
    }
 }


exports.jobs = async function() {

    try {
        let mytenants = await config.getAllTenants();
        for(let myidx = 0; myidx < mytenants.length; myidx++) {

            let tenant = mytenants[myidx];
            //envía registro a cloudwatch
            let myMetric = new cloudwatchMetrics.Metric('VoC CORE', 'Count', [{
                Name: 'Ingestor',
                Value: tenant
                }], 
                {                 
                    sendCallback: (err) => {
                            if (!err) return;
                                logger.error("Error creating cloudwatch metrics " + err);
        
                        }
                }
            );
            
            let init = new Date();
            init.setHours(0,0,0,0); //setea a 0 horas de este día

            let mo_total = 0;
            let mo_processing = 0;
            let mo_finished = 0;
            let mo_error = 0;
            let ms_finished = 0;

            let jobs = await stats.getJobsinInterval(tenant, init, new Date());
            for(let idx=0; idx < jobs.length; idx++) {
                mo_total += jobs[idx].files.total;
                mo_processing += jobs[idx].files.processing;
                mo_finished += jobs[idx].files.finished;
                mo_error += jobs[idx].files.error;
                ms_finished += jobs[idx].seconds.finished;
            }
            
            myMetric.put(ms_finished, 'procesado', "Count");
            myMetric.put(mo_error, 'error', "Count");
            myMetric.put(mo_finished, 'objetos', "Count");
            myMetric.put(mo_processing, 'processing', "Count");
            myMetric.put(mo_total, 'total', "Count");
                //
            //logea registro
            logger.info("[APILAYER][jobs monitor] {'tenant': '"+ tenant + "', 'input': "+ mo_total +", 'uploaded': "+ mo_finished +", 'seconds': "+ ms_finished +"}")
        }
    }
    catch(e) {
        logger.error("[APILAYER][monitor] Error hourly " + e)
    }
}


exports.remove_oldjobs = async function() {

    try{
        logger.info("[APILAYER][removeoldjobs] Remove oldjobs process started");
        let mytenants = await config.getAllTenants();
        for(let idx = 0; idx < mytenants.length; idx++) {
            let tenant = mytenants[idx];
            let cfg = await config.getConfigurationObject(tenant);
            let retention = cfg[0].data_retention;
            if(retention == null) retention = default_retention;
            let init = new Date();
            init.setHours(init.getHours() - (24 * retention));
            logger.info("[APILAYER][removeoldjobs] Checking tenant: " + tenant + " for older jobs than " + retention + " days");
            let jobs = await stats.getJobsOlderThan(tenant, init);
            jobs.forEach( (el) => {
                logger.info("[APILAYER][removeoldjobs] Tenant: " + tenant + ", job: " + el.job_id + ", removing");
                apijobs.remove_job(tenant, el.job_id);
                stats.remove_job(tenant, el.job_id);
            })
        }
        logger.info("[APILAYER][removeoldjobs] Remove oldjobs process end");
    }
    catch(e){
        logger.error("[APILAYER][monitor] Error oldjobs " + e)
    }
}








