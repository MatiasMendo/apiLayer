
const stats = require('./ingestor_apilayer_statsjob.js');
const apijobs = require('./ingestor_apilayer_jobs.js');
const config = require('./ingestor_apilayer_config.js');
const logger = require('./utils/Logger.js');
const dotenv = require ('dotenv');
const cloudwatchMetrics = require('cloudwatch-metrics');

dotenv.config();

const default_retention = 60; //retención ed data máximo 90 días
cloudwatchMetrics.initialize({
    region: 'us-east-1'
});


// Extrea indicadores que se ejecutan una vez al día
exports.tenant = async function(tenant) {

    try {
        let mytenants = await config.getAllTenants();
        for(idx = 0; idx < mytenants.length; idx++) {
            let tenant = mytenants[idx];
            //
            //analiza los segundos subidos por tenant hasta este mes
            let s = await stats.getStatsTenantMonthly(tenant);
            let seconds = 0;
            if(undefined != s[0].finished) seconds = s[0].finished;
            let hours = Math.floor(seconds / 3600);
            seconds %= 3600;
            let minutes = Math.floor(seconds / 60);
            seconds %= 60;

            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;

            //envía registro a cloudwatch
            var myMetric = new cloudwatchMetrics.Metric('VoC CORE', 'Count', [{
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




var jobsdata = [];

async function updatejobsdata(tenant, init, end) {
    jobsdata[tenant] = { // inicializa
        last: end,
        total: 0,
        o_finished: 0,
        s_finished: 0,
        s_error: 0
    }

    let jobs = await stats.getJobsinInterval(tenant, init, end);
    for(let idx=0; idx < jobs.length; idx++) {
        jobsdata[tenant].total += jobs[idx].files.total;
        jobsdata[tenant].o_finished += jobs[idx].files.finished;
        jobsdata[tenant].s_finished += jobs[idx].seconds.finished;
        jobsdata[tenant].s_error += jobs[idx].seconds.error;
    }
    jobsdata[tenant].last = end;
}
 

exports.jobs = async function() {

    try {
        let mytenants = await config.getAllTenants();
        for(idx = 0; idx < mytenants.length; idx++) {
            let tenant = mytenants[idx];
            if(!(tenant in jobsdata)) { // si no existe inicializa
                let init = new Date();
                let end = new Date();
                init.setHours(init.getHours() - 1); //por defecto toma lo q pasó desde una hora atrás si no existe el datos
                await updatejobsdata(tenant, init, end);
            }
            else {
                let myjobsdata = { // inicializa con data guardada
                    last: jobsdata[tenant].last,
                    total: jobsdata[tenant].total,
                    o_finished: jobsdata[tenant].o_finished,
                    s_finished: jobsdata[tenant].s_finished,
                    s_error: jobsdata[tenant].s_error
                }
       
                let init = jobsdata[tenant].last;
                let end = new Date();
                await updatejobsdata(tenant, init, end);

                let mtotal = (myjobsdata.total <= jobsdata[tenant].total)? (jobsdata[tenant].total - myjobsdata.total) : jobsdata[tenant].total;
                let mo_finished = (myjobsdata.o_finished <= jobsdata[tenant].o_finished)? (jobsdata[tenant].o_finished - myjobsdata.o_finished) : jobsdata[tenant].o_finished;
                let ms_finished = (myjobsdata.s_finished <= jobsdata[tenant].s_finished)? (jobsdata[tenant].s_finished - myjobsdata.s_finished) : jobsdata[tenant].s_finished;
                let ms_error = (myjobsdata.s_error <= jobsdata[tenant].s_error)? (jobsdata[tenant].s_error - myjobsdata.s_error) : jobsdata[tenant].s_error;

                //envía registro a cloudwatch
                var myMetric = new cloudwatchMetrics.Metric('VoC CORE', 'Count', [{
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
                
                myMetric.put(ms_finished, 'procesado', "Count");
                myMetric.put(ms_error, 'error', "Count");
                myMetric.put(mo_finished, 'objetos', "Count");
                //
                //logea registro
                logger.info("[APILAYER][jobs monitor] {'tenant': '"+ tenant + "', 'input': "+ mtotal +", 'uploaded': "+ mo_finished +", 'seconds': "+ ms_finished +"}")
            }

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








