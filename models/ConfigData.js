var mongoose = require('mongoose');
var Schema = mongoose.Schema;


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


var UrlDataSchema = new Schema({
    addon_downloader: {
        type: Schema.Types.String,
        required: true
    }
})

var StatsconfigDataSchema = new Schema({
    tenant_id: {
        type: Schema.Types.String,
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
    url: {
        type: UrlDataSchema,
        required: true
    },
    microservices: {
        type: MicroservicesDataSchema,
        required: true
    }
})

module.exports = StatsconfigDataSchema;
