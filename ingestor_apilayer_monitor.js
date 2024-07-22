
const stats = require('./ingestor_apilayer_statsjob.js');
const config = require('./ingestor_apilayer_config.js');
const logger = require('./utils/Logger.js');
const dotenv = require ('dotenv');

dotenv.config();

// Extrea indicadores que se ejecutan una vez al día
exports.tenant = async function(tenant) {

    try {
        let mytenants = await config.getAllTenants();
        for(idx = 0; idx < mytenants.length; idx++) {
            let tenant = mytenants[idx];
            //
            //analiza los segundos subidos por tenant hasta este mes
            let s = await stats.getStatsTenantMonthly(tenant);
            let seconds = s[0].finished;
            let hours = Math.floor(seconds / 3600);
            seconds %= 3600;
            let minutes = Math.floor(seconds / 60);
            seconds %= 60;

            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;
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
                
                logger.info("[APILAYER][jobs monitor] {'tenant': '"+ tenant + "', 'input': "+ mtotal +", 'uploaded': "+ mo_finished +", 'seconds': "+ ms_finished +"}")
            }

        }
    }
    catch(e) {
        logger.error("[APILAYER][monitor] Error hourly " + e.message)
    }
 

}








