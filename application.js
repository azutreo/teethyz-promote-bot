const Express = require("express");
const Noblox = require('noblox.js');
const { MessageEmbed, WebhookClient } = require('discord.js');
require("dotenv").config();

const Application = Express();
Application.use(Express.static("public"));

const webhookClient = new WebhookClient({ url: process.env.WEBHOOK });

async function StartApplication() {
	const currentUser = await Noblox.setCookie(process.env.COOKIE)
	console.log(`Logged in as ${currentUser.UserName} [${currentUser.UserID}]`)
}

Application.get("/", (request, response) => {
	response.send("Website application for Teethyz Promote Bot. Nothing to see here if you do not belong here.");
});

Application.get("/log/:api_key/:user_id1/:user_id2", (request, response) => {
	const apiKey = request.params.api_key;
	const user1 = request.params.user_id1;
	const user2 = request.params.user_id2;

	if (apiKey != process.env.API_KEY) {
		return response.json("Error");
	}

	const embed = new MessageEmbed()
		.setTitle('Some Title')
		.setColor('#0099ff');

	webhookClient.send({
		content: 'Webhook test',
		username: 'some-username',
		avatarURL: 'https://i.imgur.com/AfFp7pu.png',
		embeds: [embed],
	});

	response.json("Success");
});

Application.get("/promote/:api_key/:user_id", (request, response) => {
	const apiKey = request.params.api_key;
	const user = request.params.user_id;

	if (apiKey != process.env.API_KEY) {
		return response.json("Error");
	}

	Noblox.changeRank(process.env.GROUP_ID, parseInt(user), 1);
	response.json("Success");
});

const listener = Application.listen(process.env.PORT, () => {
	console.log(`Application is listening on port ${listener.address().port}`);
});

StartApplication();