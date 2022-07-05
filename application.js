const Express = require("express");
const Noblox = require('noblox.js');
const { MessageEmbed, WebhookClient } = require('discord.js');
require("dotenv").config();

const GROUP_ID = process.env.GROUP_ID
const RANK_PROMOTER = process.env.RANK_PROMOTER
const RANK_MAX = process.env.RANK_MAX
const RANK_MIN = process.env.RANK_MIN
const API_KEY = process.env.API_KEY
const WEBHOOK_ID = process.env.WEBHOOK_ID
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN
const COOKIE = process.env.COOKIE

const Application = Express();
Application.use(Express.static("public"));

const webhookClient = new WebhookClient({ id: WEBHOOK_ID, token: WEBHOOK_TOKEN });

async function StartApplication() {
	const currentUser = await Noblox.setCookie(COOKIE)
	console.log(`Logged in as ${currentUser.UserName} [${currentUser.UserID}]`)
}

Application.get("/", (request, response) => {
	response.send("Website application for Teethyz Promote Bot. Nothing to see here if you do not belong here.");
});

async function LogSuccess(hrUserId, lrUserId, lrPreviousRankName) {
	let hrUsername = await Noblox.getUsernameFromId(hrUserId)
	let lrUsername = await Noblox.getUsernameFromId(lrUserId)
	let lrNewRankName = await Noblox.getRankNameInGroup(GROUP_ID, lrUserId);

	const embed = new MessageEmbed()
		.setTitle("Promotion!")
		.setColor("#81c784")
		.addField("High Rank", hrUsername)
		.addField("Low Rank", lrUsername)
		.addField("Role Change", `**${lrPreviousRankName}** -> **${lrNewRankName}**`);

	webhookClient.send({
		username: hrUsername,
		avatarURL: `https://www.roblox.com/headshot-thumbnail/image?userId=${hrUserId}&width=420&height=420&format=png`,
		embeds: [embed],
	});
}

Application.get("/promote/:api_key/:hrUserId/:lrUserId", (request, response) => {
	const apiKey = request.params.api_key;
	const hrUserId = parseInt(request.params.hrUserId);
	const lrUserId = parseInt(request.params.lrUserId);

	if (apiKey != API_KEY) {
		return response.json("Error");
	}

	let hrRank = Noblox.getRankInGroup(GROUP_ID, hrUserId);
	let lrRank = Noblox.getRankInGroup(GROUP_ID, lrUserId);
	let lrPreviousRankName = Noblox.getRankNameInGroup(GROUP_ID, lrUserId);

	if (hrRank < RANK_PROMOTER) {
		return response.json("Error");
	}

	if (lrRank >= RANK_MAX) {
		return response.json("Error");
	} else if (lrRank < RANK_MIN) {
		return response.json("Error");
	}

	Noblox.changeRank(GROUP_ID, hrUserId, 1);
	LogSuccess(hrUserId, lrUserId, lrPreviousRankName);

	response.json("Success");
});

const listener = Application.listen(process.env.PORT, () => {
	console.log(`Application is listening on port ${listener.address().port}`);
});

StartApplication();