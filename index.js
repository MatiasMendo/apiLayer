const express = require('express');
const bodyParser = require('body-parser');
const status = require('./ingestor_apilayer_stateupdate.js');
const metadata = require('./ingestor_apilayer_metadata.js');
const jobs = require('./ingestor_apilayer_jobs.js');
const statsjob = require('./ingestor_apilayer_statsjob.js');
const config = require('./ingestor_apilayer_config.js');
const mongoo = require('./ingestor_apilayer_mongoo.js');
const newfiles = require('./ingestor_apilayer_newfiles.js');
const logger = require('./utils/Logger.js');
const dotenv = require ('dotenv');
const { fork } = require('node:child_process');

logger.info("[APILAYER][main] API Layer starting ");

dotenv.config();
const port = process.env.PORT ;
const ip = process.env.IP ;

var app = express();


async function monitor() {
	var monitor_child = fork('./child_monitor.js');
	if(monitor_child != null) {
		logger.info("[APILAYER][main] API Layer, monitor started with PID " + monitor_child.pid);

		monitor_child.on('close', () => {
			logger.info("[APILAYER][main] API Layer, monitor close event ");
			monitor();
		})

		monitor_child.on('exit', () => {
			logger.info("[APILAYER][main] API Layer, monitor exit event ");
			//monitor();
		})
	}
	else {
		logger.error("[APILAYER][main] API Layer, error starting monitor");
	}
}
monitor();

mongoo.instance().init().then(() => {
	let server = app.listen(port, ip, function () {
		let host = server.address().address;
		let port = server.address().port;

		logger.info("[APILAYER][main] API Layer listening at http://" + host + ":" + port);
	})
}).catch((e) => {
	logger.error("[APILAYER][main] Error " + e.message)
});



app.use(bodyParser.json())
//Maneja error de parsing de data
app.use((err, req, res, next) => {
	if (err) {
		logger.debug('[APILAYER][main] Error parsing data from request ' + req.url)
		res.status(400).send('error parsing data')
	} else {
		next()
	}
})


//
//Endpoints
//

let baseroute = '/ingestor/v1'

//Endpoints relacionados a crear nuevas ejecuciones o Jobs
app.post(baseroute + '/new', bodyParser.json({ limit: '1000mb' }), function (req, res) {
	logger.debug('[APILAYER][main] API new')
	jobs.new_job(req.body, res)
	
});

app.patch(baseroute + '/new', bodyParser.json({ limit: '1000mb' }),function (req, res) {
	logger.debug('[APILAYER][main] API new - patch')
	jobs.append_job(req.body, res);
});

app.get(baseroute + '/job', function (req, res) {
	logger.debug('[APILAYER][main] API get - job')
	if (Object.keys(req.query).length > 0) {//axios
		jobs.get_job(JSON.parse(req.query.body), res);
	}
	else { //postman
		jobs.get_job(req.body, res);
	}
});

app.get(baseroute + '/verify', function (req, res) {
	logger.debug('[APILAYER][main] API get - verify')
	if (Object.keys(req.query).length > 0) {//axios
		jobs.verify_job(JSON.parse(req.query.body), res);
	}
	else { //postman
		jobs.verify_job(req.body, res);
	}
});

//API para estad�sticas
app.get(baseroute + '/stats/job', function (req, res) {
	logger.debug('[APILAYER][main] API new - statsjob');
	if (Object.keys(req.query).length > 0) {//axios
		statsjob.get(JSON.parse(req.query.body), res);
	}
	else { //postman
		statsjob.get(req.body, res);
	}
});


//API para la extracci�n de metadata desde archivo
app.get(baseroute + '/metadata', function (req, res) {
	logger.debug('[APILAYER][main] API new - metadata');
	if (Object.keys(req.query).length > 0) {//axios
		metadata.get(JSON.parse(req.query.body), res);
	}
	else { //postman
		metadata.get(req.body, res);
	}
});

//API para la extracción de las configuraciones
app.get(baseroute + '/configuration', function (req, res) {
	logger.debug('[APILAYER][main] API configuration');
	if (Object.keys(req.query).length > 0) {//axios
		config.get(JSON.parse(req.query.body), res);
	}
	else { //postman
		config.get(req.body, res);
	}
});


//
// procesa todos los endpoint de cambio de estado
// y extracción de audios a procesar
//

app.patch(baseroute + '/verificator/state', function (req, res) {
	logger.debug('[APILAYER][main] API state verificator')

	status.update('verificator', req.body, res)
});

app.patch(baseroute + '/input/state', function (req, res) {
	logger.debug('[APILAYER][main] API state input')

	status.update('input', req.body, res)
});

app.patch(baseroute + '/converter/state', function (req, res) {
	logger.debug('[APILAYER][main] API state converter')

	status.update('converter', req.body, res)
});

app.get(baseroute + '/converter/newfiles', function (req, res) {
	logger.debug('[APILAYER][main] API newfiles converter');
	if (Object.keys(req.query).length > 0) {//axios
		newfiles.get('converter', JSON.parse(req.query.body), res);
	}
	else { //postman
		newfiles.get('converter', req.body, res);
	}
});

app.patch(baseroute + '/zipper/state', function (req, res) {
	logger.debug('[APILAYER][main] API state zipper')

	status.update('zipper', req.body, res)
});

app.get(baseroute + '/zipper/newfiles', function (req, res) {
	logger.debug('[APILAYER][main] API newfiles zipper');
	if (Object.keys(req.query).length > 0) {//axios
		newfiles.get('zipper', JSON.parse(req.query.body), res);
	}
	else { //postman
		newfiles.get('zipper', req.body, res);
	}
});

app.patch(baseroute + '/uploader/state', function (req, res) {
	logger.debug('[APILAYER][main] API state uploader')

	status.update('uploader', req.body, res)
});

app.get(baseroute + '/uploader/newfiles', function (req, res) {
	logger.debug('[APILAYER][main] API newfiles uploader');
	if (Object.keys(req.query).length > 0) {//axios
		newfiles.get('uploader', JSON.parse(req.query.body), res);
	}
	else { //postman
		newfiles.get('uploader', req.body, res);
	}
});
