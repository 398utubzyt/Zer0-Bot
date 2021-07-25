'use strict';

//#region Classes and Shit

/**
 * @class An internal class called Command, that holds information about a command.
 */
 class Command {
    constructor(name, aliases, user, method) {
        this.name = name;
        this.aliases = aliases;
        this.user = user;
        this.method = method;
    }
}

class CommandUtil {
    static get Prefix() {
        return ':';
    }

    /**
     * 
     * @param {Discord.Message} message
     * @returns {Command} The command sent in the message
     */
    static MessageToCommand(message) {
        if (typeof(message) != String) {
            throw 'Message content is not a string.';
        }

        if (!message.content.startsWith(this.Prefix)) {
            throw 'Message is not a command.';
        }

        var content = message.content.substr(this.Prefix.length, message.content.length - this.Prefix.length);
        var args = content.split(' ');

        return new Command();
    }
}

//#endregion

//#region Import/Require

// This API is automatically gitignore-d.
// When testing, just create your own file
// and class called "api.json". For more
// info, just message Jaiden.
const API = require('./api.json');

const readline = require('readline').createInterface(process.stdin, process.stdout);
const Discord = require('discord.js');
const client = new Discord.Client();

//#endregion

//#region Events

client.on('ready', () => {
  	console.log(`${client.user.tag} is ready for Mod Abuse.`);
});

client.on('message', msg => {
	if (msg.content.startsWith(CommandUtil.Prefix)) {
		var command = CommandUtil.MessageToCommand(msg);
	}
});

client.on('error', () => {
	exit();
});

client.on('disconnect', () => {
	exit();
});

readline.on('line', (line) => {
	var args = line.split(' ');
	if (args.length < 2) {
		return;
	}

	client.guilds.fetch(API.serverId).then((guild) => {
		var channel = guild.channels.cache.find((value, key, collection) => {return value.name == args[0];});

		if (channel == null) {
			return;
		}
		
		channel.send(line.substring(args[0].length).trimStart()).catch((err) => error(err));
	}).catch((err) => error(err));
});

function error(err) {
	console.log('Error: ' + err);
}

function exit() {
	readline.close();
}

client.login(API.token);

//#endregion