const logger = require('./utils/Logger.js');
const mongoo = require('./ingestor_apilayer_mongoo.js');

exports.get = async function (body, res) {

	if ((typeof body.tenant_id != "string") &&
		(typeof body.file_id != "string") 
	) {
		res.status(400).send();
		return
	}

	const RecordingData = mongoo.instance().Models(body.tenant_id).RecordingDataSchema;

	let filter = {
		"file_id": body.file_id
	};

	RecordingData.findOne(filter).exec().then((doc) => {
		if (null == doc) {
			logger.info("[APILAYER][metadata] file_id " + body.file_id + " not found ");
			res.status(400).send()
		}
		else {
			logger.info("[APILAYER][metadata] file_id " + body.file_id + " found ");
			res.send({
				"file_id": body.file_id,
				"metadata": JSON.stringify(doc.metadata)
			});
		}
	});
}
