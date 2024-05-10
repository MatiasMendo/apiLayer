var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StageDataSchema = new Schema({
    input: {
        type: Schema.Types.String,
        required: true
    },
    converter: {
        type: Schema.Types.String,
        required: true
    },
    zipper: {
        type: Schema.Types.String,
        required: true
    },
    uploader: {
        type: Schema.Types.String,
        required: true
    },
})

var RecordingDataSchema = new Schema({
    tenant_id: {
        type: Schema.Types.String,
        required: true
    },
    job_id: {
        type: Schema.Types.String,
        required: true
    },
    job_time: {
        type: Schema.Types.Date,
        required: true
    },
    source: {
        type: Schema.Types.String,
        required: true
    },
    duration: {
        type: Schema.Types.Number,
        required: true
    },
    metadata: {
        type: Schema.Types.String,
        required: true
    },
    file_id: {
        type: Schema.Types.String,
        required: true
    },
    type: {
        type: Schema.Types.String,
        required: true
    },
    stage: {
        type: StageDataSchema,
        required: true
    },
    status: {
        type: Schema.Types.String,
        required: true
    },
    input_time: {
        type: Schema.Types.Date,
        required: false
    },
    finished_time: {
        type: Schema.Types.Date,
        required: false
    }
})

//const RecordingData = mongoose.model('GenericRecordingData', RecordingDataSchema);
module.exports = RecordingDataSchema;
