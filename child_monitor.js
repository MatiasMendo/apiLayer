
const mongoo = require('./ingestor_apilayer_mongoo.js');
const monitor = require('./ingestor_apilayer_monitor.js');
const logger = require('./utils/Logger.js');
const dotenv = require ('dotenv');
const cron = require('node-cron');

dotenv.config();

mongoo.instance().init().then(async () => {

    cron.schedule('0 0 * * *', monitor.tenant);
    await monitor.jobs();
    cron.schedule('0 0-23 * * *', monitor.jobs);
	})
.catch((e) => {
	logger.error("[APILAYER][monitor] Error " + e)
});




