var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*
var MicroserviceDataSchema = new Schema({
    name: {
        type: Schema.Types.String,
        required: true
    },
    previous: {
        type: Schema.Types.String,
        required: true
    },
    cron: {
        type: Schema.Types.String,
        required: true
    },
    bucket: {
        type: Schema.Types.String,
        required: true
    }
  })



var MicroservicesDataSchema = new Schema({
    input: {
        type: MicroserviceDataSchema,
        required: true
    },
    converter: {
        type: MicroserviceDataSchema,
        required: true
    },
    zipper: {
        type: MicroserviceDataSchema,
        required: true
    },
    uploader: {
        type: MicroserviceDataSchema,
        required: true
    }
 })

*/
var QuotaDataSchema = new Schema({
    job: {
        type: Schema.Types.Number,
        required: true
    },
    monthly: {
        type: Schema.Types.Number,
        required: true
    }
})

var StatsconfigDataSchema = new Schema({
    tenant_id: {
        type: Schema.Types.String,
        required: true
    },
    version: {
        type: Schema.Types.Number,
        required: true
    },
    active: {
        type: Schema.Types.Boolean,
        required: true
    },
    description: {
        type: Schema.Types.String,
        required: true
    },
    folder_base: {
        type: Schema.Types.String,
        required: true
    },
    quota: {
        type: QuotaDataSchema,
        required: true
    },
    microservices: {
        type: Schema.Types.Mixed,
        required: true
    }
})

module.exports = StatsconfigDataSchema;
