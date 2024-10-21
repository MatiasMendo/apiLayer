var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StageDataSchema = new Schema({
    verificator: {
        type: Schema.Types.String,
        required: true
    },
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
    original_source: {
        type: Schema.Types.String,
        required: true,
        unique: true
    },
    duration: {
        type: Schema.Types.Number,
        required: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        required: true
    },
    customdata: {
        type: Schema.Types.Mixed,
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

RecordingDataSchema.index({ file_id: 1 }, { unique: true });
RecordingDataSchema.index({ job_id: 1 });
RecordingDataSchema.index({ status: 1,
    "stage.verificator": 1,
    "stage.input": 1,
    "stage.converter": 1,
    "stage.zipper": 1,
    "stage.uploader": 1
  });
//const RecordingData = mongoose.model('GenericRecordingData', RecordingDataSchema);
module.exports = RecordingDataSchema;
