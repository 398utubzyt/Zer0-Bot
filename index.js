'use strict';
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
	if (msg.content.startsWith(CommandUtil.Prefix)) {
		var command = CommandUtil.StringToCommand(msg.content);
	}
});

client.login(API.Token);