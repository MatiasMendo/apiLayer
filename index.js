var express = require('express');
var bodyParser = require('body-parser');



var app = express();




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://rodrigotobar:QLUoe48d3viEOzZ7@cluster.9wvliio.mongodb.net/?retryWrites=true&w=majority&appName=Cluster";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	}
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();
		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log("Pinged your deployment. You successfully connected to MongoDB!");
	} finally {
		// Ensures that the client will close when you finish/error
		await client.close();
	}
}
run().catch(console.dir);


var server = app.listen(8081, function () {
	let host = server.address().address;
	let port = server.address().port;

	console.log("API Layer listening at http://%s:%s", host, port);
}) 






//
//Endpoints
//

let baseroute = '/ingestor/v1'
app.post(baseroute + '/new', bodyParser.json(), function (req, res) {
	console.log('API new')
	res.send()
});





var status = require('./ingestor_apilayer_statusupdate.js')
//
// procesa todos los endpoint de cambio de estado
//

app.patch(baseroute + '/input/state', bodyParser.json(), function (req, res) {
	console.log('API input')

	status.update('input', req.body, res)
});

app.patch(baseroute + '/converter/state', bodyParser.json(), function (req, res) {
	console.log('API converter')

	status.update('converter', req.body, res)
});

app.patch(baseroute + '/zipper/state', bodyParser.json(), function (req, res) {
	console.log('API zipper')

	status.update('zippper', req.body, res)
});



app.patch(baseroute + '/uploader/state', bodyParser.json(), function (req, res) {
	console.log('API uploader')

	status.update('uploader', req.body, res)
});
