const Express = require("express");
const Noblox = require('noblox.js');
const { MessageEmbed, WebhookClient } = require('discord.js');
require("dotenv").config();

const GROUP_ID = process.env.GROUP_ID
const RANK_PROMOTER = process.env.RANK_PROMOTER
const RANK_DEMOTER = process.env.RANK_DEMOTER
const RANK_MAX = process.env.RANK_MAX
const RANK_MIN = process.env.RANK_MIN
const API_KEY = process.env.API_KEY
const WEBHOOK_ID = process.env.WEBHOOK_ID
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN
const COOKIE = process.env.COOKIE

const COLOR_PROMOTION = "#4caf50"
const COLOR_DEMOTION = "#ef5350"
const COLOR_ERROR = "#795548"

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

async function LogSuccess(delta, hrUserId, lrUserId, lrPreviousRankName) {
	let hrUsername = await Noblox.getUsernameFromId(hrUserId)
	let lrUsername = await Noblox.getUsernameFromId(lrUserId)
	let lrNewRankName = await Noblox.getRankNameInGroup(GROUP_ID, lrUserId);

	const embed = new MessageEmbed()
		.setColor(delta > 0 ? COLOR_PROMOTION : COLOR_DEMOTION)
		.setAuthor({
			name: `${hrUsername} [${hrUserId}]`,
			iconURL: `https://www.roblox.com/headshot-thumbnail/image?userId=${hrUserId}&width=420&height=420&format=png`,
			url: `https://www.roblox.com/users/${hrUserId}/profile`
		})
		.setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${lrUserId}&width=420&height=420&format=png`)
		.addField("Staff Member", `${lrUsername} [${lrUserId}]`)
		.addField("Role Change", `${lrPreviousRankName} → ${lrNewRankName}`)
		.setTimestamp()
		.setFooter({ text: 'Created by Azutreo', iconURL: 'https://www.roblox.com/headshot-thumbnail/image?userId=9221415&width=420&height=420&format=png' });

	webhookClient.send({
		username: "Teethyz Promotion Bot",
		avatarURL: `https://tr.rbxcdn.com/138f16052ce9c587817e282b4b7c6fa8/150/150/Image/Png`,
		embeds: [embed],
	});
}

async function LogError(errorCode, delta, hrUserId, lrUserId, lrPreviousRankName) {
	let hrUsername = await Noblox.getUsernameFromId(hrUserId)
	let lrUsername = await Noblox.getUsernameFromId(lrUserId)
	let hrRankName = await Noblox.getRankNameInGroup(GROUP_ID, hrUserId);

	let errorText;
	switch (errorCode) {
		case -2:
			errorText = "Promoter is too low rank (must be Assistant Manager+)";
			break;
		case -3:
			errorText = "Demoter is too low rank (must be Dental Board+)";
			break;
		case -4:
			errorText = "Staff member is too high rank (must be under Oral Surgeon)";
			break;
		case -5:
			errorText = "Staff member is too low rank (must at least be Awaiting Training)";
			break;
		default:
			errorText = "Unknown (contact Azutreo for error log)";
	}

	const embed = new MessageEmbed()
		.setColor(COLOR_ERROR)
		.setDescription(`Failed to ${delta > 0 ? "promote" : "demote"}. Error: ${errorText}`)
		.setAuthor({
			name: `${hrUsername} [${hrUserId}]`,
			iconURL: `https://www.roblox.com/headshot-thumbnail/image?userId=${hrUserId}&width=420&height=420&format=png`,
			url: `https://www.roblox.com/users/${hrUserId}/profile`
		})
		.setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${lrUserId}&width=420&height=420&format=png`)
		.addField("Staff Member", `${lrUsername} [${lrUserId}]`)
		.addField("Manager Role", hrRankName, true)
		.addField("Staff Member Role", lrPreviousRankName, true)
		.setTimestamp()
		.setFooter({ text: 'Created by Azutreo', iconURL: 'https://www.roblox.com/headshot-thumbnail/image?userId=9221415&width=420&height=420&format=png' });

	webhookClient.send({
		username: "Teethyz Promotion Bot",
		avatarURL: `https://tr.rbxcdn.com/138f16052ce9c587817e282b4b7c6fa8/150/150/Image/Png`,
		embeds: [embed],
	});
}

async function ChangeRank(response, hrUserId, lrUserId, delta) {
	let hrRank = await Noblox.getRankInGroup(GROUP_ID, hrUserId);
	let lrRank = await Noblox.getRankInGroup(GROUP_ID, lrUserId);
	let lrPreviousRankName = await Noblox.getRankNameInGroup(GROUP_ID, lrUserId);

	if (delta > 0 && hrRank < RANK_PROMOTER) {
		LogError(-2, delta, hrUserId, lrUserId, lrPreviousRankName);
		return response.json(-2);
	} else if (hrRank < RANK_DEMOTER) {
		LogError(-3, delta, hrUserId, lrUserId, lrPreviousRankName);
		return response.json(-3);
	}

	if (delta > 0 && lrRank >= RANK_MAX) {
		LogError(-4, delta, hrUserId, lrUserId, lrPreviousRankName);
		return response.json(-4);
	} else if (delta < 0 && lrRank > RANK_MAX) {
		LogError(-4, delta, hrUserId, lrUserId, lrPreviousRankName);
		return response.json(-4);
	} else if (lrRank < RANK_MIN) {
		LogError(-5, delta, hrUserId, lrUserId, lrPreviousRankName);
		return response.json(-5);
	}

	await Noblox.changeRank(GROUP_ID, lrUserId, delta);
	await LogSuccess(delta, hrUserId, lrUserId, lrPreviousRankName);

	return response.json(1);
}

Application.get("/promote/:api_key/:hrUserId/:lrUserId", (request, response) => {
	const apiKey = request.params.api_key;
	const hrUserId = parseInt(request.params.hrUserId);
	const lrUserId = parseInt(request.params.lrUserId);

	if (apiKey != API_KEY) {
		return response.json(-1);
	}

	ChangeRank(response, hrUserId, lrUserId, 1);
});

/*Application.get("/demote/:api_key/:hrUserId/:lrUserId", (request, response) => {
	const apiKey = request.params.api_key;
	const hrUserId = parseInt(request.params.hrUserId);
	const lrUserId = parseInt(request.params.lrUserId);

	if (apiKey != API_KEY) {
		return response.json(-1);
	}

	ChangeRank(response, hrUserId, lrUserId, -1);
});*/

const listener = Application.listen(process.env.PORT, () => {
	console.log(`Application is listening on port ${listener.address().port}`);
});

StartApplication();