const logger = require('./Logger.js');
const config = require('./../ingestor_apilayer_config.js');
const stats = require('./../ingestor_apilayer_statsjob.js');

class Quota {

    constructor(tenantid) {
        this.quota=null;
        this.mytenantid = tenantid;
        this.jobusage = [];
        this.tmonthlyusage = null;
    }

    //
    // retorna la quota que ha sido configurada para el tenant
    //
    async updateQuotas() {
        if(null == this.quota) {
            try {
                let myconfigobj = await config.getConfigurationObject(this.mytenantid);
                this.quota = {
                    monthly: myconfigobj[0].quota.monthly,
                    job: myconfigobj[0].quota.job
                }
               // logger.info("[APILAYER][getmyquota] Getting "+ this.mytenantid +" configuration OK");
            }
            catch(e) {
                logger.info("[APILAYER][getmyquota] Error with tenant_id "+ this.mytenantid +": "+ e);
                throw(e);
            }
        }
    }

    //
    // retorna los segundos de audio que han sido subidos exitosamente 
    // al bucket s3 por el tenant
    async getmonthlyfinished() {
        if(null == this.tmonthlyusage) {
            try {
                let monthlystats = await stats.getStatsTenantMonthly(this.mytenantid);
                this.tmonthlyusage =  monthlystats[0].finished;
            }
            catch(e) {
                throw(e);
            }
        }

        return this.tmonthlyusage;
    }

    // retorna los segundos de audio que han sido exitosamente 
    // subidos al bucket s3
    async getjobfinished(jobid) {
        if(!(jobid in this.jobusage)) {
            try {
                let jobstats = await stats.getStatsObject(this.mytenantid, jobid);
                if(null == jobstats) {
                    logger.info("[APILAYER][reached] "+ this.mytenantid +" error getting quota, returning reached as 0");
                    this.jobusage[jobid] = 0;
                    throw(new Error('Error getting quota object'));
                }
                else {
                    this.jobusage[jobid] = jobstats.seconds.finished;
                }
            }
            catch(e) {
                throw(e);
            }
        }

        return this.jobusage[jobid]; 
    }

    //
    //true if si la quota ha sido alcanzada
    async reached(jobid){
        try {
            await this.updateQuotas(); //obtener cuota configurada
            let monthlyfinished = await this.getmonthlyfinished();//obtiene lo usado en este mes por el tenant
            if (monthlyfinished >= this.quota.monthly) {
                logger.info("[APILAYER][reached] monthly quota reached tenantid: "+ this.mytenantid);
                return true;//true iplica que quota mensual fue alcanzada
            }

            //chequeo de cuota por job si la quota mensual no fue alcanzada
            let jobfinished = await this.getjobfinished(jobid);
            if (jobfinished >= this.quota.job) {
                logger.info("[APILAYER][reached] job quota reached tenantid: "+ this.mytenantid + ", jobid: " + jobid);
                return true;
            }

            return false;//false aun no alcanza la quota del job
        }
        catch(e){
            throw(e)
        }
      
    }
}

exports.getObject = function(tenantid) {
    return new Quota(tenantid)
}




