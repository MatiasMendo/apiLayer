const logger = require('./utils/Logger.js');
const mongoo = require('./ingestor_apilayer_mongoo.js');
var mongoose = require('mongoose');
var cachegoose = require('recachegoose');

cachegoose(mongoose, {
  engine: 'memory'
});


exports.getConfigurationObject = async function(tenantid_) {
  return getConfigurationObjectQuery(tenantid_);
}


async function getConfigurationObjectQuery(tenantid) {
  let ConfigData = mongoo.instance().ModelConfig();
  return ConfigData.find({ tenant_id: tenantid, active:true }).sort({version: -1}).limit(1).cache(15).exec();
}


// Esta función se utiliza para enviar la configuración
// via endpoint
//
exports.get = async function (body, res) {

    if ((undefined == body.tenant_id) || (typeof body.tenant_id != "string")) {
        logger.info("[APILAYER][getconfig] Error in parameter tenant_id");
        res.status(400).send();
        return;
    }
    
    getConfigurationObjectQuery(body.tenant_id).then((query) => {
        if(null != query) {
            // Envia la respuesta con la configuración del tenant
            res.send(query[0]);
            logger.info("[APILAYER][getconfig] Returning configuration version "+ query[0].version +", to tenant_id: "+ body.tenant_id );
        }
        else {
            logger.info("[APILAYER][getconfig] Error in parameter tenant_id "+ body.tenant_id +", no exist this in db o is inactive");
            res.status(400).send();
        }
    })
}

//retorna un listado de tenants_id
//
exports.getAllTenants = async function() {
  let ConfigData = mongoo.instance().ModelConfig();
  try {
    let mbuckets = await ConfigData.aggregate([
      { 
        $match : {
           active:true } },
      { 
        $bucketAuto : {
          groupBy: "$tenant_id",
          buckets: 100000
        }
      }
    ]).exec();

    let toret = [];
    mbuckets.forEach((b) => {
      toret.push(b._id.min)
    });

    return toret;
  } catch(e) {
    logger.error("[APILAYER][getAllTenants] getting all tenants: " + e);
  }
 
}


//
//retorna el primer microservicio
//
exports.getFirstuService = async function (tenantid){
  try {
    let first = 'input';

    let config = await getConfigurationObjectQuery(tenantid);
    if('verificator' in config[0].microservices) {
      first = 'verificator'
    }

    return first;

  } catch(e) {
    logger.error("[APILAYER][getFirstuService] : " + e);
  }
}

//
//retorna el último microservicio
//
exports.getLastuService = async function (tenantid){

    let last = 'uploader';

    //aquí se pone lógica para poder devolver el último
    //por mientras siempre es uploader el último

    return last;

}



     
