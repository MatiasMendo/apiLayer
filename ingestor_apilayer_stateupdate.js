
const logger = require('./utils/Logger.js');
const mongoo = require('./ingestor_apilayer_mongoo.js');


exports.update = function (module, body, res) {

	if ((typeof body.tenant_id != "string") &&
		(typeof body.file_id != "string") &&
		(typeof body.state != "string")
	) {
		res.status(400).send();
		return
	}

	//
	//chequea los stados válidos
	if ((body.state !== "STARTING") &&
		(body.state !== "FINISHED") &&
		(body.state !== "BAD_FILE") &&
		(body.state !== "ERROR")) {
		res.status(400).send()
		return
	}

	const RecordingData = mongoo.instance().Models(body.tenant_id).RecordingDataSchema;

	let update = {};
	switch (module) {
		case 'input':
		case 'converter':
		case 'zipper':
		case 'uploader':
			update['stage.'+ module] = body.state;
			break;
	}

	if (0 != update.size ) {
		let filter = {
			"file_id": body.file_id
		};

		RecordingData.updateOne(filter, update).exec().then((result) => {
			if (0 == result.matchedCount) {
				logger.info("[APILAYER][status update] file_id " + body.file_id + " not found ");
			}
			else {
				logger.info("[APILAYER][status update] file_id " + body.file_id + ", updated stage " + module + " to " + body.state);
			}
			res.send();
		})
	}
	else {
		logger.error("[APILAYER][status update] Error, modulo no existe " + module)
		res.status(400).send()
	}
}
