var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var SecondsDataSchema = new Schema({
    finished: {
        type: Schema.Types.Number,
        required: true
    },
    error: {
        type: Schema.Types.Number,
        required: true
    }
 })


var FilesDataSchema = new Schema({
    total: {
        type: Schema.Types.Number,
        required: true
    },
    idle: {
        type: Schema.Types.Number,
        required: true
    },
    retrieved: {
        type: Schema.Types.Number,
        required: true
    },
    processing: {
        type: Schema.Types.Number,
        required: true
    },
    finished: {
        type: Schema.Types.Number,
        required: true
    },
    error: {
        type: Schema.Types.Number,
        required: true
    }
})

var StatsjobDataSchema = new Schema({
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
    last_time: {
        type: Schema.Types.Date,
        required: false
    },
    files: {
        type: FilesDataSchema,
        required: true
    },
    seconds: {
        type: SecondsDataSchema,
        required: true
    },
})

module.exports = StatsjobDataSchema;
