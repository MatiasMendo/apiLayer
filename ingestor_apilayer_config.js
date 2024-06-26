const logger = require('./utils/Logger.js');
const mongoo = require('./ingestor_apilayer_mongoo.js');

/** Config template 
 * 
 * 
 {
"tenant_id": "my_tenant_id",
"active":true,
"description": "my test tenant",
"folder_base": "/home/tenant",
"url": {
  "addon_downloader": "http://127.0.0.1/downloader"
  },
"microservices": {
  "input" : {
    "name": "input",
    "previous": "",
    "cron": "* *",
    "bucket": ""
    },
    "converter" : {
    "name": "converter",
    "previous": "addon_downloader",
    "cron": "* *",
    "bucket": ""
    },
    "zipper" : {
    "name": "zipper",
    "previous": "converter",
    "cron": "* *",
    "bucket": ""
    },
    "uploader" : {
    "name": "uploader",
    "previous": "zipper",
    "cron": "* *",
    "bucket": "s3://pruebitas"
    }
  }

}
 * 
 * 
 */


exports.get = async function (body, res) {

    if ((undefined == body.tenant_id) || (typeof body.tenant_id != "string")) {
        logger.info("[APILAYER][getconfig] Error in parameter tenant_id");
        res.status(400).send();
        return;
    }
   
    let ConfigData = mongoo.instance().ModelConfig();
    ConfigData.findOne({ tenant_id: body.tenant_id, active:true }).exec().then((query) => {
        if(null != query) {
            // Envia la respuesta con la configuración del tenant
            res.send(JSON.stringify(query));
        }
        else {
            logger.info("[APILAYER][getconfig] Error in parameter tenant_id, no exist this in db o is inactive");
            res.status(400).send();
        }


            

        
    })
}

     