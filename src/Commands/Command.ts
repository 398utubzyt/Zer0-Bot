import Bot from "../Bot";
import BotUtil from "../BotUtil";
import API from "../../api.json";
import Messages from "../../messages.json";
import File from "../IO/File";
import * as Discord from "discord.js";

/**
 * @class An internal class called Command, that holds information about a command.
 */
export default class Command {

    public name : string;
    public permissions : number;
    public args : string[];
    public message : Discord.Message;
    public method : Function;

	//#region Command Functions

	private static Help(args : any[]) : void {
		Bot.SendMessage(args[0], "__**Command List**__ \nHelp: The command you just ran, eediot. \nPing: See how slow the bot is running. \nElection-Register: Register yourself in the next election. \nElection-Unregister: Unregister yourself from the next election. \nElection-Candidates: View the current candidates for the election.");
	}

	private static Ping(args : any[]) : void {
		Bot.client.guilds.fetch(API.serverId).then((guild) => {
			var cache : Discord.TextChannel = guild.channels.cache.find((value, key, collection) => {return value.name == args[1];}) as Discord.TextChannel;
			
			if (cache == null) {
				return;
			}

			cache.send('Pinging...').then((m) => {m.edit('My ping is about ' + (m.createdTimestamp - args[0]) + 'ms.')}).catch((err) => Bot.Error(err));
		}).catch((err) => Bot.Error(err));
	}

	/**
	 * Election-Register Command
	 * @param {any[]} args
	 */
	private static ElectionRegister(args : any[]) : void {
		var id = parseInt(args[0]);

		if (isNaN(id)) { Bot.SendMessage(args[1], 'invalid user id lel.'); return; }

		var guild = Bot.client.guilds.cache.get(API.serverId);

		if (guild == null) { Bot.SendMessage(args[1], 'invalid server id lel.'); return; }

		var user = guild.members.cache.get(args[0]);

		if (user == null) { Bot.SendMessage(args[1], 'invalid member id lel.'); return; }

		if (Bot.election.candidates.includes(args[0])) { Bot.SendMessage(args[1], 'You are already registered for the ' + BotUtil.GetElectionTerm() + ' election.'); return; }

		Bot.election.Register(args[0]);

		if (File.Read('presidential-candidates.txt').length > 0) { File.Append('presidential-candidates.txt', '\n');}
		File.Append('presidential-candidates.txt', args[0]);

		Bot.SendMessage(args[1], 'You are now registered for the ' + BotUtil.GetElectionTerm() + ' election.');
	}

	/**
	 * Election-Unregister Command
	 * @param {any[]} args
	 */
	private static ElectionUnregister(args : any[]) {
		var id = parseInt(args[0]);

		if (isNaN(id)) { Bot.SendMessage(args[1], 'invalid user id lel.'); return; }

		var guild = Bot.client.guilds.cache.get(API.serverId);

		if (guild == null) { Bot.SendMessage(args[1], 'invalid server id lel.'); return; }

		var user = guild.members.cache.get(args[0]);

		if (user == null) { Bot.SendMessage(args[1], 'invalid member id lel.'); return; }

		if (!Bot.election.candidateIds.includes(args[0])) { Bot.SendMessage(args[1], 'You haven\'t been registered for the ' + BotUtil.GetElectionTerm() + ' election yet.'); return; }

		Bot.election.Unregister(args[0]);

		var fileContent = File.Read('presidential-candidates.txt');
		if (fileContent.includes(args[0] + '\n')) {
			File.Write('presidential-candidates.txt', fileContent.replace(args[0] + '\n', ''));
		} else {
			File.Write('presidential-candidates.txt', fileContent.replace(args[0] + '', ''));
		}

		Bot.SendMessage(args[1], 'You have been unregistered from the ' + BotUtil.GetElectionTerm() + ' election.');
	}

    /**
	 * Election-Unregister Command
	 * @param {any[]} args
	 */
	private static ElectionCandidates(args : any[]) {
		if (Bot.election.candidateCount < 1) {
            Bot.SendMessage(args[0], BotUtil.Combine("No one has registered for the {0} election.", BotUtil.GetElectionTerm()));
            return;
        }
		
        var candidates : string;
        for (var i : number = 0; i < Bot.election.candidateCount; i++) {
            candidates += Bot.election.candidates[i].user.username;
            if (i < Bot.election.candidateCount - 1)
                candidates += '\n';
        }

        Bot.SendMessage(args[0], BotUtil.Combine("__**{0} Candidates:**__\n\n{1}", BotUtil.GetElectionTerm(), candidates));
	}

	//#endregion

	/**
	 * 
	 * @param {string} cmdName The name of the command
	 * @param {string[]} args The arguments of the command
	 * @param {Discord.Message} message The message that was sent
	 */
	public static GetFromName(cmdName : string, args : string[], message : Discord.Message)
	{
		switch (cmdName.toLowerCase()) {
			case 'help':
				return new Command('help', 0, [], message, this.Help);
			
			case 'ping':
				return new Command('ping', 0, [message.createdTimestamp.toString()], message, this.Ping);

			case 'election-register':
				return new Command('election-register', 0, [message.author.id], message, this.ElectionRegister);

			case 'election-unregister':
				return new Command('election-unregister', 0, [message.author.id], message, this.ElectionUnregister);

			case 'register':
				return new Command('election-register', 0, [message.author.id], message, this.ElectionRegister);

			case 'unregister':
				return new Command('election-unregister', 0, [message.author.id], message, this.ElectionUnregister);
                
			case 'election-candidates':
				return new Command('election-candidates', 0, [], message, this.ElectionCandidates);

            case 'candidates':
				return new Command('election-candidates', 0, [], message, this.ElectionCandidates);

			default:
				Bot.SendMessage(message.channel.id, BotUtil.Combine(Messages.InvalidCommand, cmdName));
				return null;
		}
	}

	/**
	 * Runs the command.
	 */
	public Run() {
		var arr = this.args;
		if (arr.length > 0 && arr[0] == '') {
			arr = arr.reverse();
			arr.pop();
			arr = arr.reverse();
		}

		arr.push((this.message.channel as Discord.TextChannel).name);

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
	 * @param {Function} method 
	 */
    constructor(name : string, permissions : number, args : string[], message : Discord.Message, method : Function) {
        this.name = name;
        this.permissions = permissions;
		this.args = args;
        this.message = message;
        this.method = method;
    }
}