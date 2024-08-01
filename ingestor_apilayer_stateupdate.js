
const logger = require('./utils/Logger.js');
const mongoo = require('./ingestor_apilayer_mongoo.js');
const statsjob = require('./ingestor_apilayer_statsjob.js');


exports.update = async function (module, body, res) {

	if ((typeof body.tenant_id != "string") &&
		(typeof body.file_id != "string") &&
		(typeof body.state != "string")
	) {
		res.status(400).send();
		return
	}

	//
	//chequea los stados v�lidos
	if ((body.state !== "STARTING") &&
		(body.state !== "FINISHED") &&
		(body.state !== "BAD_FILE") &&
		(body.state !== "ERROR")) {
		res.status(400).send()
		return
	}

	const RecordingData = mongoo.instance().Models(body.tenant_id).RecordingDataSchema;

	let update = {};
	//actualiza el estado en que va el procesamiento del archivo
	switch (module) {
		case "verificator":
		case "input":
		case "converter":
		case "zipper":
		case "uploader":
			update["stage." + module] = body.state;
			break;
	}
	//este caso es particular y es cuando termina el proceso del audio
	// termina con la subida al repositorio 
	if (((body.state == "FINISHED") && (module == "uploader")) ||
		(body.state == "BAD_FILE") ||
		(body.state == "ERROR")) {
		update["status"] = body.state;
		update["finished_time"] = new Date();
	}

	//este otro caso ocurre cuando el microservicio verificator termina su proceso
	// y se le permite hacer un update de algunos campos del registro del audio
	// puede modificar el source
	if((module == "verificator") && (body.state == "FINISHED")) {
		if(typeof body.source == "string") {
			//hace update del campo source del registro
			update["source"] = body.source;
		}
	}

	if (0 != update.size ) {
		let filter = {
			"file_id": body.file_id
		};

		RecordingData.findOneAndUpdate(filter, update).exec().then((doc) => {
			if (null == doc) {
				logger.info("[APILAYER][status update] file_id " + body.file_id + " not found ");
			}
			else {
				statsjob.updatestate(body.tenant_id, doc.job_id, module, body.state, doc.duration)
				logger.info("[APILAYER][status update] file_id " + body.file_id + ", updated stage " + module + " to " + body.state);
			}
			res.send();
		})
		//res.send();
	}
	else {
		logger.error("[APILAYER][status update] Error, modulo no existe " + module)
		res.status(400).send()
	}
}
