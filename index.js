const express = require('express');
const bodyParser = require('body-parser');
const status = require('./ingestor_apilayer_stateupdate.js');
const metadata = require('./ingestor_apilayer_metadata.js');
const jobs = require('./ingestor_apilayer_jobs.js');
const mongoo = require('./ingestor_apilayer_mongoo.js');
const logger = require('./utils/Logger.js');



var app = express();


mongoo.instance().init().then(() => {
	let server = app.listen(8081, function () {
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
app.post(baseroute + '/new', bodyParser.json(), function (req, res) {
	logger.debug('[APILAYER][main] API new')
	jobs.new_job(req.body, res)
	
});

app.patch(baseroute + '/new', function (req, res) {
	logger.debug('[APILAYER][main] API new - patch')
	jobs.append_job(req.body, res);
});

app.get(baseroute + '/job', function (req, res) {
	logger.debug('[APILAYER][main] API get - job')
	jobs.get_job(req.body, res);
});

app.get(baseroute + '/stats/job', function (req, res) {
	logger.debug('[APILAYER][main] API get - job/stats')
	res.send()
});


//API para la extracción de metadata desde archivo
app.get(baseroute + '/metadata', function (req, res) {
	logger.debug('[APILAYER][main] API new - metadata');
	metadata.get(req.body, res);
});



//import * as status from './ingestor_apilayer_statusupdate.mjs';

//
// procesa todos los endpoint de cambio de estado
//

app.patch(baseroute + '/input/state', function (req, res) {
	logger.debug('[APILAYER][main] API input')

	status.update('input', req.body, res)
});

app.patch(baseroute + '/converter/state', function (req, res) {
	logger.debug('[APILAYER][main] API converter')

	status.update('converter', req.body, res)
});

app.patch(baseroute + '/zipper/state', function (req, res) {
	logger.debug('[APILAYER][main] API zipper')

	status.update('zipper', req.body, res)
});

app.patch(baseroute + '/uploader/state', function (req, res) {
	logger.debug('[APILAYER][main] API uploader')

	status.update('uploader', req.body, res)
});
