const Express = require("express");
const Noblox = require('noblox.js');
require("dotenv").config();

const Application = Express();
Application.use(Express.static("public"));

async function StartApplication() {
	const currentUser = await Noblox.setCookie(process.env.COOKIE)
	console.log(`Logged in as ${currentUser.UserName} [${currentUser.UserID}]`)
}

Application.get("/", (request, response) => {
	response.send("Website application for Teethyz Promote Bot. Nothing to see here if you do not belong here.");
});

Application.get("/promote/:api_key/:user_id", (request, response) => {
	const apiKey = request.params.api_key;
	const user = request.params.user_id;

	if (apiKey != process.env.API_KEY) {
		return response.json("Error");
	}

	Noblox.changeRank(process.env.GROUP_ID, parseInt(user));
	response.json("Success");
});

const listener = Application.listen(process.env.PORT, () => {
	console.log(`Application is listening on port ${listener.address().port}`);
});

StartApplication();