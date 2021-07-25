'use strict';

//#region Import/Require

//#region Classes and Shit

// This API is automatically gitignore-d.
// When testing, just create your own file
// and class called "api.json". For more
// info, just message Jaiden.
const API = require('./api.json');
const Messages = require('./messages.json');

const readline = require('readline').createInterface(process.stdin, process.stdout);
const Discord = require('discord.js');
const client = new Discord.Client();

/**
 * 
 * @param {string} message 
 * @param {any[]} arguments 
 * @returns {string} The modified string
 */
function Combine(message, ...args) {
	for (var i = 0; i < args.length; i++) {
		message = message.replace('{' + i + '}', args[i]);
	}

	return message;
}

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
 * Sends a message in the specified channel.
 * @param {number} channel 
 * @param {string} message 
 */
 function SendMessageID(channel, message) {
	client.guilds.fetch(API.serverId).then((guild) => {
		var cache = guild.channels.cache.get(channel);

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

	/**
	 * Help Command
	 * @param {any[]} args
	 */
	static Help(args) {
		SendMessage(args[0], "__**Command List**__ \nHelp: The command you just ran, eediot. \nPing: See how slow the bot is running.");
	}

	/**
	 * Ping Command
	 * @param {any[]} args
	 */
	static Ping(args) {
		client.guilds.fetch(API.serverId).then((guild) => {
			var cache = guild.channels.cache.find((value, key, collection) => {return value.name == args[1];});
			
			if (cache == null) {
				return;
			}

			cache.send('Pinging...').then((m) => {m.edit('My ping is about ' + (m.createdTimestamp - args[0]) + 'ms.')}).catch((err) => error(err));
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
		switch (cmdName.toLowerCase()) {
			case 'help':
				var arr = args;
				return new Command('help', [], args, message, this.Help);
			
			case 'ping':
				var arr = args;
				arr.push(message.createdTimestamp);
				return new Command('ping', [], arr, message, this.Ping);

			default:
				SendMessageID(message.channel.id, Combine(Messages.InvalidCommand, cmdName));
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

		// SUPER HELPFUL WHEN DEBUGGING!! DO NOT REMOVE!!
		// SendMessage(this.message.channel.name, 'Running command: ' + this.name + ' with args [' + arr.join(', ') + '] called by ' + this.message.author.username + '.');

		this.method.call(this, arr);
	}

	/**
	 * Creates a command.
	 * @param {string} name 
	 * @param {Discord.PermissionFlags} permissions
	 * @param {string[]} args
	 * @param {Discord.Message} message
	 * @param {function} method 
	 */
    constructor(name, permissions, args, message, method) {
        this.name = name;
        this.permissions = permissions;
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