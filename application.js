const Express = require("express");
const Noblox = require('noblox.js');
const { MessageEmbed, WebhookClient } = require('discord.js');
require("dotenv").config();

const Application = Express();
Application.use(Express.static("public"));

const webhookClient = new WebhookClient({ id: process.env.WEBHOOK_ID, token: process.env.WEBHOOK_TOKEN });

async function StartApplication() {
	const currentUser = await Noblox.setCookie(process.env.COOKIE)
	console.log(`Logged in as ${currentUser.UserName} [${currentUser.UserID}]`)
}

Application.get("/", (request, response) => {
	response.send("Website application for Teethyz Promote Bot. Nothing to see here if you do not belong here.");
});

Application.get("/log/:api_key/:hrUserId/:hrUsername/:lrUsername/:lrRole", (request, response) => {
	console.log(request);

	const apiKey = request.params.api_key;
	const hrUserId = request.params.hrUserId;
	const hrUsername = request.params.hrUsername;
	const lrUsername = request.params.lrUsername;
	const lrRole = request.params.lrRole;

	if (apiKey != process.env.API_KEY) {
		return response.json("Error");
	}

	const embed = new MessageEmbed()
		.setTitle("Promotion!")
		.setColor("#0099ff")
		.setDescription(`**${hrUsername}** successfully promoted **${lrUsername}** to **${lrRole}**`);

	webhookClient.send({
		username: hrUsername,
		avatarURL: `https://www.roblox.com/headshot-thumbnail/image?userId=${hrUserId}&width=420&height=420&format=png`,
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