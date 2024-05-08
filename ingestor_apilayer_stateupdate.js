

exports.update = function (module, body, res) {

	if ((typeof body.tenant_id != "string") &&
		(typeof body.file_id != "string") &&
		(typeof body.state != "string")
	) {
		res.sendStatus(400)
		return
	}

	//
	//chequea los stados válidos
	if ((body.state !== "STARTING") &&
		(body.state !== "FINISHED") &&
		(body.state !== "ERROR")) {
		res.sendStatus(400)
		return
	}


    console.log("actualizando " + module + " a " + body.state)
    res.send()
}
