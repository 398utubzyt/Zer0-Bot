import Bot from "../Bot";
import BotUtil from "../BotUtil";
import API from "../../api.json";
import Messages from "../../messages.json";
import File from "../IO/File";
import * as Discord from "discord.js";
import Color from "../Graphics/Color";
import Console from "../Console";

/**
 * @class An internal class called Command, that holds information about a command.
 */
export default class Command {

    public name : string;
    public permissions : bigint;
    public args : string[];
    public message : Discord.Message;
    public method : Function;

	//#region Command Functions

	private static Help(cmd : Command, args : any[]) : void {
		Bot.Send(args[0], "Command List", 
		"Help: The command you just ran, eediot. \
		\nPing: See how slow the bot is running. \
		\nElection-Help: The help menu for the election commands."
		
		, Color.cyan);
	}

	private static Ping(cmd : Command, args : any[]) : void {
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
	private static ElectionRegister(cmd : Command, args : any[]) : void {
		var id = parseInt(args[0]);

		if (isNaN(id)) { Bot.SendMessage(args[1], 'invalid user id lel.'); return; }

		var guild = Bot.client.guilds.cache.get(API.serverId);

		if (guild == null) { Bot.SendMessage(args[1], 'invalid server id lel.'); return; }

		var user = guild.members.cache.get(args[0]);

		if (user == null) { Bot.SendMessage(args[1], 'invalid member id lel.'); return; }

		if (Bot.election.HasCandidate(args[0])) { Bot.Send(args[1], BotUtil.Combine("{0} Election Registration", BotUtil.GetElectionTerm()), 'You are already registered for the ' + BotUtil.GetElectionTerm() + ' election.', Color.red); return; }

        if (Bot.election.started) {
            Bot.Send(args[1], BotUtil.Combine("{0} Election Registration", BotUtil.GetElectionTerm()), "The election has already started! You can't register now!", Color.red);
            return;
        }

		Bot.election.Register(args[0]);

		if (File.Read('presidential-candidates.txt').length > 0) { File.Append('presidential-candidates.txt', '\n');}
		File.Append('presidential-candidates.txt', args[0]);

		Bot.Send(args[1], BotUtil.Combine("{0} Election Registration", BotUtil.GetElectionTerm()), 'You are now registered for the ' + BotUtil.GetElectionTerm() + ' election.', Color.green);
	}

	/**
	 * Election-Unregister Command
	 * @param {any[]} args
	 */
	private static ElectionUnregister(cmd : Command, args : any[]) : void {

		var id = parseInt(args[0]);

		if (isNaN(id)) { Bot.SendMessage(args[1], 'invalid user id lel.'); return; }

		var guild = Bot.client.guilds.cache.get(API.serverId);

		if (guild == null) { Bot.SendMessage(args[1], 'invalid server id lel.'); return; }

		var user = guild.members.cache.get(args[0]);

		if (user == null) { Bot.SendMessage(args[1], 'invalid member id lel.'); return; }

		if (!Bot.election.HasCandidate(args[0])) { Bot.Send(args[1], 'You haven\'t been registered for the ' + BotUtil.GetElectionTerm() + ' election yet.'); return; }

        if (Bot.election.started) {
            Bot.Send(args[1], BotUtil.Combine("{0} Election Registration", BotUtil.GetElectionTerm()), "The election has already started! You can't unregister now!", Color.red);
            return;
        }

		Bot.election.Unregister(args[0]);

		var fileContent = File.Read('presidential-candidates.txt');
		if (fileContent.includes(args[0] + '\n')) {
			File.Write('presidential-candidates.txt', fileContent.replace(args[0] + '\n', ''));
		} else {
			File.Write('presidential-candidates.txt', fileContent.replace(args[0] + '', ''));
		}

		Bot.Send(args[1], BotUtil.Combine("{0} Election Registration", BotUtil.GetElectionTerm()), 'You have been unregistered from the ' + BotUtil.GetElectionTerm() + ' election.', Color.green);
	}

    /**
	 * Election-Candidates Command
	 * @param {any[]} args
	 */
	private static ElectionCandidates(cmd : Command, args : any[]) : void {
		if (Bot.election.candidateCount < 1) {
            Bot.Send(args[0], BotUtil.Combine("{0} Election Cadidates", BotUtil.GetElectionTerm()), BotUtil.Combine("No one has registered for the {0} election.", BotUtil.GetElectionTerm()), Color.red);
            return;
        }

        Bot.Send(args[0], BotUtil.Combine("{0} Election Cadidates", BotUtil.GetElectionTerm()), Bot.election.CandidateList(), Color.green);
	}

    /**
	 * Election-Start Command
	 * @param {any[]} args
	 */
	private static ElectionStart(cmd : Command, args : any[]) : void {
		if (Bot.election.started || cmd.message.channel.id != API.testChannel) {
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Invalid Command", BotUtil.Combine(Messages.InvalidCommand, cmd.name), Color.red);
			return;
		}

        Bot.election.Start();
	}

	/**
	 * Election-End Command
	 * @param {any[]} args
	 */
	private static ElectionEnd(cmd : Command, args : any[]) : void {
		if (!Bot.election.started || cmd.message.channel.id != API.testChannel) {
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Invalid Command", BotUtil.Combine(Messages.InvalidCommand, cmd.name), Color.red);
			return;
		}

        Bot.election.End();
	}

	/**
	 * Election-Vote Command
	 * @param {any[]} args
	 */
	 private static ElectionVote(cmd : Command, args : any[]) : void {
		if (args.length < 2) {
			Bot.Send(args[0], "Insufficient Parameters", "Please specify the candidate to vote for.", Color.red);
			return;
		}

		if (!Bot.election.started) {
			
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Election Not Started", BotUtil.Combine("The {0} election has not started yet!", BotUtil.GetElectionTerm()), Color.red);
			return;
		}

		var candidate = Bot.election.GetCandidate((args[0] as string).replace('<@!', '').replace('>', ''));
		if (!candidate) {
			
			Bot.Send(args[1], "Invalid Candidate", BotUtil.Combine("{0} is not a valid candidate.", args[0]), Color.red);
			return;
		}

		Console.Log("{0} is voting for {1}", cmd.message.author.tag, candidate.user.tag);

		if (candidate.user.id == cmd.message.author.id) {
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Vote Error", "You can't vote for yourself, cheater.", Color.red);
			return;
		}

        if (!Bot.election.Vote(cmd.message.author, candidate)) {
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Vote Successful", BotUtil.Combine("You have successfully voted for {0} for the {1} election!", candidate.user.username, BotUtil.GetElectionTerm()), Color.green);
		} else
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Vote Error", BotUtil.Combine("You have already voted for {0}.", Bot.election.UserCurrentlyVoted(cmd.message.author).user.username), Color.red);
	}

	/**
	 * Election-Unvote Command
	 * @param {any[]} args
	 */
	private static ElectionUnvote(cmd : Command, args : any[]) : void {
		if (args.length < 2) {
			Bot.Send(args[0], "Insufficient Parameters", "Please specify the candidate to remove the vote from.", Color.red);
			return;
		}

		if (!Bot.election.started) {
			
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Election Not Started", BotUtil.Combine("The {0} election has not started yet!", BotUtil.GetElectionTerm()), Color.red);
			return;
		}

		var candidate = Bot.election.GetCandidate((args[0] as string).replace('<@!', '').replace('>', ''));

		if (!candidate) {
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Invalid Candidate", BotUtil.Combine("{0} is not a candidate for the election.", args[0]), Color.red);
			return;
		}

		if (candidate.user.id == cmd.message.author.id) {
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Vote Removal Error", "You haven't voted for yourself, because you can't.", Color.red);
			return;
		}

		Console.Log("{0} is removing their vote for {1}", cmd.message.author.tag, candidate.user.tag);

        if (!Bot.election.Unvote(cmd.message.author, candidate))
        	Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Vote Removal Successful", BotUtil.Combine("Successfully removed your vote for {0} for the {1} election.", candidate.user.username, BotUtil.GetElectionTerm(), BotUtil.Combine("<@{0}>", cmd.message.author.id)), Color.green);
		else
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Vote Removal Error", BotUtil.Combine("You haven't voted for {0}.", candidate.user.username), Color.red);
	}

	/**
	 * Election-Voting Command
	 * @param {any[]} args
	 */
	private static ElectionVoting(cmd : Command, args : any[]) : void {
		var candidate = Bot.election.UserCurrentlyVoted(cmd.message.author);

		if (!candidate)
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, BotUtil.Combine("{0} Election", BotUtil.GetElectionTerm()), "You're not voting for anyone!", Color.blue);
		else
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, BotUtil.Combine("{0} Election", BotUtil.GetElectionTerm()), BotUtil.Combine("You're currently voting for {0}!", candidate.user.username), Color.cyan);
	}

	/**
	 * Election-Leaderboard Command
	 * @param {any[]} args
	 */
	private static ElectionLeaderboard(cmd : Command, args : any[]) : void {
		var leaderboard = Bot.election.CandidateLeaderboard();

		if (leaderboard.length < 4)
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Election Error", "There are no canidates??!", Color.red);
		else
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, BotUtil.Combine("{0} Leaderboard", BotUtil.GetElectionTerm()), leaderboard, Color.cyan);
	}

	/**
	 * Election-Help Command
	 * @param {any[]} args
	 */
	 private static ElectionHelp(cmd : Command, args : any[]) : void {
		Bot.Send(args[0], "Election Command List", 
		"Election-Register: Register yourself in the next election. \
		\nElection-Unregister: Unregister yourself from the next election. \
		\nElection-Candidates: View the current candidates for the election. \
		\nElection-Leaderboard: View the current election leaderboard to see who's winning. \
		\nElection-Vote <user-mention>: Vote for the specified candidate. \
		\nElection-Unvote <user-mention>: Removes your vote from the specified candidate. \
		\nElection-Voting: See who you're voting for, in case you forgot."
		
		, Color.cyan);
	}

	/**
	 * Warn Command
	 * @param {any[]} args
	 */
	private static Warn(cmd : Command, args : any[]) : void {
        if (args.length < 2) {
			Bot.Send(args[0], "Insufficient Parameters", "Please specify the user to warn.", Color.red);
			return;
		}

		var user = Bot.client.guilds.cache.get(API.serverId).members.cache.get((args[0] as string).replace('<@', '').replace('>', ''));

		if (!user) {
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "Invalid User", "Could not find the user you specified. Please either use a member ID or mention.", Color.red);
			return;
		}

		if (args.length < 3) {
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "User Warned", BotUtil.Combine("<@{0}> has been warned.", user.id), Color.yellow);
		} else {
			args.pop();
			args.shift();
			Bot.Send((cmd.message.channel as Discord.TextChannel).name, "User Warned", BotUtil.Combine("<@{0}> has been warned for {1}", user.id, args.join(' ').trimStart().trimEnd()), Color.yellow);
		}
	}

	//#endregion

	/**
	 * 
	 * @param {string} cmdName The name of the command
	 * @param {string[]} args The arguments of the command
	 * @param {Discord.Message} message The message that was sent
	 */
	public static GetFromName(cmdName : string, args : string[], message : Discord.Message) : Command
	{
		switch (cmdName.toLowerCase()) {
			case 'help':
				return new Command('help', 0n, [], message, this.Help);
			
			case 'ping':
				return new Command('ping', 0n, [message.createdTimestamp.toString()], message, this.Ping);

			case 'election-help':
				return new Command('election-help', 0n, [], message, this.ElectionHelp);

			case 'election-register':
				return new Command('election-register', 0n, [message.author.id], message, this.ElectionRegister);

			case 'election-unregister':
				return new Command('election-unregister', 0n, [message.author.id], message, this.ElectionUnregister);
                
            case 'election-candidates':
                return new Command('election-candidates', 0n, [], message, this.ElectionCandidates);

			case 'election-vote':
				return new Command('election-vote', 0n, args, message, this.ElectionVote);
				
			case 'election-unvote':
				return new Command('election-unvote', 0n, args, message, this.ElectionUnvote);
				
			case 'election-voting':
				return new Command('election-voting', 0n, [], message, this.ElectionVoting);
				
			case 'election-leaderboard':
				return new Command('election-leaderboard', 0n, [], message, this.ElectionLeaderboard);

			case 'register':
				return new Command('election-register', 0n, [message.author.id], message, this.ElectionRegister);

			case 'unregister':
				return new Command('election-unregister', 0n, [message.author.id], message, this.ElectionUnregister);

            case 'candidates':
				return new Command('election-candidates', 0n, [], message, this.ElectionCandidates);

			case 'vote':
				return new Command('election-vote', 0n, args, message, this.ElectionVote);
				
			case 'unvote':
				return new Command('election-unvote', 0n, args, message, this.ElectionUnvote);
				
			case 'voting':
				return new Command('election-voting', 0n, [], message, this.ElectionVoting);

            case 'election-start':
                return new Command('election-start', Discord.Permissions.FLAGS.ADMINISTRATOR, [message.author.id], message, this.ElectionStart);

			case 'election-end':
                return new Command('election-end', Discord.Permissions.FLAGS.ADMINISTRATOR, [message.author.id], message, this.ElectionEnd);

			case 'warn':
				return new Command('warn', Discord.Permissions.FLAGS.KICK_MEMBERS | Discord.Permissions.FLAGS.BAN_MEMBERS, args, message, this.Warn);

			default:
				Bot.Send((message.channel as Discord.TextChannel).name, "Invalid Command", BotUtil.Combine(Messages.InvalidCommand, cmdName), Color.red);
				return null;
		}
	}

	/**
	 * Runs the command.
	 */
	public Run() : void {
		var arr = this.args;
		if (arr.length > 0 && arr[0] == '') {
			arr = arr.reverse();
			arr.pop();
			arr = arr.reverse();
		}

		arr.push((this.message.channel as Discord.TextChannel).name);

		var guild = Bot.client.guilds.cache.get(API.serverId);

		if (guild == null) { Bot.SendMessage((this.message.channel as Discord.TextChannel).name, 'invalid server id lel.'); return; }

		var user = guild.members.cache.get(this.message.author.id);

		if (user == null) { Bot.SendMessage((this.message.channel as Discord.TextChannel).name, 'invalid member id lel.'); return; }

        if ((user.permissions.bitfield & this.permissions) != this.permissions) {
            Bot.InsufficientPermissions((this.message.channel as Discord.TextChannel).name, new Discord.Permissions(this.permissions).toArray().join(', '));
            return;
        }

		// SUPER HELPFUL WHEN DEBUGGING!! DO NOT REMOVE!!
		// SendMessage(this.message.channel.name, 'Running command: ' + this.name + ' with args [' + arr.join(', ') + '] called by ' + this.message.author.username + '.');

		this.method.call(this, this, arr);
	}

	/**
	 * Creates a command.
	 * @param {string} name 
	 * @param {Discord.PermissionFlags} permissions
	 * @param {string[]} args
	 * @param {Discord.Message} message
	 * @param {Function} method 
	 */
    constructor(name : string, permissions : bigint, args : string[], message : Discord.Message, method : Function) {
        this.name = name;
        this.permissions = permissions;
		this.args = args;
        this.message = message;
        this.method = method;
    }
}