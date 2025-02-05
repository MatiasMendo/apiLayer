//const logger = require('./utils/Logger.js');
const mongoo = require('./ingestor_apilayer_mongoo.js');
///const statsjob = require('./ingestor_apilayer_statsjob.js');

const return_limit = 48;


exports.get = async function (module, body, res) {

	if ((typeof body.tenant_id != "string")) {
		res.status(400).send();
		return
	}

	const RecordingData = mongoo.instance().Models(body.tenant_id).RecordingDataSchema;

	let query = {};
	//actualiza el estado en que va el procesamiento del archivo
	switch (module) {
        case "input":
            query = {
                "status": "PROCESSING",
                "stage.verificator": "FINISHED",
                "stage.input": "IDLE",
                "stage.converter": "IDLE",
                "stage.zipper": "IDLE",
                "stage.uploader": "IDLE"
            };
            break;
		case "converter":
            query = {
                "status": "PROCESSING",
                "stage.verificator": "FINISHED",
                "stage.input": "FINISHED",
                "stage.converter": "IDLE",
                "stage.zipper": "IDLE",
                "stage.uploader": "IDLE"
            };
            break;
		case "zipper":
            query = {
                "status": "PROCESSING",
                "stage.verificator": "FINISHED",
                "stage.input": "FINISHED",
                "stage.converter": "FINISHED",
                "stage.zipper": "IDLE",
                "stage.uploader": "IDLE"
            };
            break;
		case "uploader":
			query = {
                "status": "PROCESSING",
                "stage.verificator": "FINISHED",
                "stage.input": "FINISHED",
                "stage.converter": "FINISHED",
                "stage.zipper": "FINISHED",
                "stage.uploader": "IDLE"
            };
			break;
        default:
            res.status(500).send();
            return;
	}
	
	RecordingData.find(query).limit(return_limit).exec().then((result) => {
        let documents = [];
        let idx = 0; 

        if(result != null) {
            result.forEach((doc) => {
                if('input' == module) {
                    documents[idx] = {
                        "tenant_id": doc.tenant_id,
                        "job_id": doc.job_id,
                        "source": doc.source,
                        "duration": doc.duration,
                        "file_id": doc.file_id,
                        "type": doc.type
                    }
                }
                else {
                    documents[idx] = doc.file_id;
                }

                idx++;
            });
        }

        if('input' == module) {
            res.send({ "total": idx, "audios": documents })
        }
        else {
            res.send({ audios: documents })
        }
     
    })
}
