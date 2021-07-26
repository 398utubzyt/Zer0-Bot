'use strict';

//#region Import/Require

// This API is automatically gitignore-d.
// When testing, just create your own file
// and class called "api.json". For more
// info, look at the README file.
const API = require('./api.json');
const Messages = require('./messages.json');

const readline = require('readline').createInterface(process.stdin, process.stdout);
const io = require('fs');
const Discord = require('discord.js');
const { time } = require('console');
const client = new Discord.Client();
const persistentPath = __dirname + '\\persistent_data\\';

var electionIds = [];

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
 * Loops the number `x` between `min` and `max`
 * @param {number} x The number to repeat
 * @param {number} min The minimum boundary
 * @param {number} max The maximum boundary
 * @returns 
 */
function Loop(x, min, max) {
	return ((x - min) % (max - min)) + min;
}

/**
 * Converts the string to be a double digit number.
 * @param {string} numStr The number string.
 * @returns The number represent as an 0X or XX number.
 */
function ForceDoubleDigit(numStr) {
	if (numStr.length != 2) { return '0' + numStr.toString(); }
	return numStr;
}

function GetElectionTerm(termOffset = 0) {
	var date = new Date();
	var month = Loop(date.getMonth() + 2, 1, 13);
	var day = date.getDay();

	if (day < 10) {
		return ForceDoubleDigit(Loop(month + termOffset - 1, 1, 13)) + '-' + ForceDoubleDigit(Loop(month + termOffset, 1, 13));
	} else {
		return ForceDoubleDigit(Loop(month + termOffset, 1, 13)) + '-' + ForceDoubleDigit(Loop(month + termOffset + 1, 1, 13));
	}
}

//#region File I/O

/**
 * Creates a file in the persistent directory.
 * @param {string} name The name of the file. 
 * @param {string} content The content to write to the file.
 */
function CreateFile(name, content = '') {
	io.writeFileSync(persistentPath + name, content);
}

/**
 * Creates a file in the persistent directory.
 * @param {string} name The name of the file. 
 * @param {string} content The content to write to the file.
 */
 function WriteFile(name, content = '') {
	io.writeFileSync(persistentPath + name, content);
}

/**
 * Creates a file in the persistent directory.
 * @param {string} name The name of the file. 
 * @param {string} content The content to write to the file.
 */
 function AppendFile(name, content = '') {
	io.appendFileSync(persistentPath + name, content);
}

/**
 * Reads a file in the persistent directory.
 * @param {string} name The name of the file.
 * @returns {string} Contents of the file.
 */
function ReadFile(name) {
	return io.readFileSync(persistentPath + name).toString();
}

/**
 * Deletes a file in the persistent directory.
 * @param {string} name The name of the file.
 */
function DeleteFile(name) {
	io.unlinkSync(persistentPath + name);
}

/**
 * Checks if a file exists, and returns true if it does.
 * @param {string} name The name of the file.
 * @returns {boolean} If the file exists.
 */
function FileExists(name) {
	return io.existsSync(persistentPath + name);
}

//#endregion

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

//#endregion

//#region Classes and Shit

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
		SendMessage(args[0], "__**Command List**__ \nHelp: The command you just ran, eediot. \nPing: See how slow the bot is running. \nElection-Register: Register yourself in the next election. \nElection-Unregister: Unregister yourself from the next election.");
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

	/**
	 * Election-Register Command
	 * @param {any[]} args
	 */
	static ElectionRegister(args) {
		var id = parseInt(args[0]);

		if (isNaN(id)) { SendMessage(args[1], 'invalid user id lel.'); return; }

		var guild = client.guilds.cache.get(API.serverId);

		if (guild == null) { SendMessage(args[1], 'invalid server id lel.'); return; }

		var user = guild.members.cache.get(args[0]);

		if (user == null) { SendMessage(args[1], 'invalid member id lel.'); return; }

		if (electionIds.includes(args[0])) { SendMessage(args[1], 'You are already registered for the ' + GetElectionTerm() + ' election.'); return; }

		electionIds.push(args[0]);

		if (ReadFile('presidential-candidates.txt').length > 0) { AppendFile('presidential-candidates.txt', '\n');}
		AppendFile('presidential-candidates.txt', args[0]);

		var date = new Date();
		SendMessage(args[1], 'You are now registered for the ' + GetElectionTerm() + ' election.');
	}

	/**
	 * Election-Unregister Command
	 * @param {any[]} args
	 */
	static ElectionUnregister(args) {
		var id = parseInt(args[0]);

		if (isNaN(id)) { SendMessage(args[1], 'invalid user id lel.'); return; }

		var guild = client.guilds.cache.get(API.serverId);

		if (guild == null) { SendMessage(args[1], 'invalid server id lel.'); return; }

		var user = guild.members.cache.get(args[0]);

		if (user == null) { SendMessage(args[1], 'invalid member id lel.'); return; }

		if (!electionIds.includes(user.id)) { SendMessage(args[1], 'You haven\'t been registered for the ' + GetElectionTerm() + ' election yet.'); return; }

		electionIds = electionIds.join(':::').replace(args[0] + ':::', '').split(':::');
		electionIds.forEach((value, index, array) => {value.replace(':::', '');});

		var fileContent = ReadFile('presidential-candidates.txt');
		if (fileContent.includes(args[0] + '\n')) {
			WriteFile('presidential-candidates.txt', fileContent.replace(args[0] + '\n', ''));
		} else {
			WriteFile('presidential-candidates.txt', fileContent.replace(args[0] + '', ''));
		}

		var date = new Date();
		SendMessage(args[1], 'You have been unregistered from the ' + GetElectionTerm() + ' election.');
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
				return new Command('help', [], [], message, this.Help);
			
			case 'ping':
				return new Command('ping', [], [message.createdTimestamp], message, this.Ping);

			case 'election-register':
				return new Command('election-register', [], [message.author.id], message, this.ElectionRegister);

			case 'election-unregister':
				return new Command('election-unregister', [], [message.author.id], message, this.ElectionUnregister);

			case 'register':
				return new Command('election-register', [], [message.author.id], message, this.ElectionRegister);

			case 'unregister':
				return new Command('election-unregister', [], [message.author.id], message, this.ElectionUnregister);

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
            throw Combine(Messages.Error, 'Message is not a command.');
        }

        var content = message.content.substr(this.Prefix.length);
        var args = content.split(' ');

        return Command.GetFromName(args[0].trim().toLowerCase(), content.substr(args[0].length).trimStart().split(' '), message);
    }
}

//#endregion

//#region Events

client.on('ready', () => {
  	console.log(Combine(Messages.Startup, client.user.tag));
	
	if (!io.existsSync(persistentPath)) {
		io.mkdirSync(persistentPath);
	}

	if (!FileExists('presidential-candidates.txt')) {
		CreateFile('presidential-candidates.txt');
	} else {
		var content = ReadFile('presidential-candidates.txt');
		electionIds = content.split('\n');
		electionIds.forEach((value, index, array) => {value.replace('\n', '');});
	}
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
