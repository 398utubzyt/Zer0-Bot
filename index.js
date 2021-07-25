'use strict';

//#region Import/Require

//#region Classes and Shit

// This API is automatically gitignore-d.
// When testing, just create your own file
// and class called "api.json". For more
// info, just message Jaiden.
const API = require('./api.json');

const readline = require('readline').createInterface(process.stdin, process.stdout);
const Discord = require('discord.js');
const client = new Discord.Client();

/**
 * Sends a message in the specified channel.
 * @param {string} channel 
 * @param {string} message 
 */
function SendMessage(channel, message) {
	client.guilds.fetch(API.serverId).then((guild) => {
		var cache = guild.channels.cache.find((value, key, collection) => {return value.name == channel;});

		if (cache == null) {
			return;
		}
		
		cache.send(message).catch((err) => error(err));
	}).catch((err) => error(err));
}

/**
 * @class An internal class called Command, that holds information about a command.
 */
 class Command {

	//#region Command Functions

	static Help(channel) {
		SendMessage(channel, "__**Command List**__ \nHelp: The command you just ran, eediot. \nPing: See how slow the bot is running.");
	}

	static Ping(time, channel) {
		client.guilds.fetch(API.serverId).then((guild) => {
			var cache = guild.channels.cache.find((value, key, collection) => {return value.name == channel;});
	
			if (cache == null) {
				return;
			}
			
			cache.send('Pinging...').then((m) => {m.edit('Your ping is: ' + m.createdTimestamp - time + 'ms.')}).catch((err) => error(err));
		}).catch((err) => error(err));
	}

	//#endregion

	/**
	 * 
	 * @param {string} cmdName The name of the command
	 * @param {string[]} args The arguments of the command
	 * @param {Discord.Message} message The message that was sent
	 */
	static GetFromName(cmdName, args, message)
	{
		switch (cmdName) {
			case 'help':
				var arr = args;
				return new Command('help', [], args, message, this.Help);
			
			case 'ping':
				var arr = args;
				arr.push(message.createdTimestamp);
				return new Command('ping', [], args, message, this.Ping);

			default:
				SendMessage(message.channel.name, 'Invalid command!');
				return null;
		}
	}

	/**
	 * Runs the command.
	 */
	Run() {
		var arr = this.args;
		if (arr.length > 0 && arr[0] == '') {
			arr = arr.reverse();
			arr.pop();
			arr = arr.reverse();
		}

		arr.push(this.message.channel.name);

		//SendMessage(this.message.channel.name, 'Running command: ' + this.name + ' with args [' + arr.join(', ') + '] called by ' + this.message.author.username + '.');
		this.method.call(this, arr);
	}

	/**
	 * Creates a command.
	 * @param {string} name 
	 * @param {string[]} aliases 
	 * @param {string[]} args
	 * @param {Discord.Message} message
	 * @param {function} method 
	 */
    constructor(name, aliases, args, message, method) {
        this.name = name;
        this.aliases = aliases;
		this.args = args;
        this.message = message;
        this.method = method;
    }
}

class CommandUtil {
    static get Prefix() {
        return '::';
    }

    /**
     * 
     * @param {Discord.Message} message
     * @returns {Command} The command sent in the message
     */
    static MessageToCommand(message) {
        if (!message.content.startsWith(this.Prefix)) {
            throw 'Message is not a command.';
        }

        var content = message.content.substr(this.Prefix.length);
        var args = content.split(' ');

        return Command.GetFromName(args[0].trim().toLowerCase(), content.substr(args[0].length).trimStart().split(' '), message);
    }
}

//#endregion

//#endregion

//#region Events

client.on('ready', () => {
  	console.log(`${client.user.tag} is ready for Mod Abuse.`);
});

client.on('message', msg => {
	if (msg.content.startsWith(CommandUtil.Prefix)) {
		var command = CommandUtil.MessageToCommand(msg);
		
		if (command == null) {
			return;
		}

		command.Run();
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

	SendMessage(args[0], line.substring(args[0].length).trimStart());
});

function error(err) {
	console.log('Error: ' + err);
}

function exit() {
	readline.close();
}

client.login(API.token);

//#endregion