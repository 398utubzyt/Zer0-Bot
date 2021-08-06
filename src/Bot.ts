import * as Discord from "discord.js"; 
import Console from "./Console";
import API from "../api.json";
import Messages from "../messages.json";
import Election from "./Election/Election";
import Command from "./Commands/Command";
import BotUtil from "./BotUtil";
import File from "./IO/File";
import path from "path";

export default class Bot {
    public static readonly persistentPath : string = path.join(__dirname, '..\\persistent_data\\');
    public static client : Discord.Client;
    public static election : Election;
    
    public static Run(token : string) : void {
        this.client = new Discord.Client();
        this.client.on('ready', () => this.Ready());
        this.client.on('message', (message) => this.Message(message));
        this.client.on('messageReactionAdd', (reaction, user) => this.ReactionAdd(reaction, user as Discord.PartialUser));
        this.client.on('messageReactionRemove', (reaction, user) => this.ReactionRemove(reaction, user as Discord.PartialUser));

        this.election = new Election();

        this.client.login(token);
    }

    public static SendMessage(channel : string, message : string) {
        this.client.guilds.fetch(API.serverId).then((guild) => {
            var cache : Discord.TextChannel = guild.channels.cache.find((value, key, collection) => {return value.name == channel;}) as Discord.TextChannel;
    
            if (cache == null) {
                return;
            }
            
            cache.send(message).catch((err) => this.Error(err));
        }).catch((err) => this.Error(err));
    }

    public static InsufficientPermissions(channel : string, permissions : string) {
        this.SendMessage(channel, BotUtil.Combine(Messages.Permissions, permissions));
    }

    public static Error(err : any) : void {
        Console.Log(Messages.Error, err);
    }

    public static Ready() : void {
        this.election.SetChannel(this.client.channels.cache.get(API.electionChannel) as Discord.TextChannel);

        if (File.Exists('presidential-candidates.txt')) {
            var candidates : string[] = File.Read('presidential-candidates.txt').split('\n');

            for (var i : number = 0; i < candidates.length; i++) {
                if (candidates[i].length > 5) {
                    this.election.Register(candidates[i]);
                }
            }
        } else {
            File.Create('presidential-candidates.txt');
        }

        Console.Log(BotUtil.Combine(Messages.Startup, this.client.user.username));
    }

    public static Message(message : Discord.Message) : void {
        if (message.content.startsWith(API.prefix)) {
            var content = message.content.substr(API.prefix.length);
            var args = content.split(' ');
    
            var command = Command.GetFromName(args[0].trim().toLowerCase(), content.substr(args[0].length).trimStart().split(' '), message);
            
            if (command == null) {
                return;
            }
    
            command.Run();
        }
    }

    public static ReactionAdd(reaction : Discord.MessageReaction, user : Discord.PartialUser) {
        if (reaction.message.channel.id == API.electionChannel) {
            if (!user.equals(this.client.user)) {
                
            }
        }
    }

    public static ReactionRemove(reaction : Discord.MessageReaction, user : Discord.PartialUser) {
        if (reaction.message.channel.id == API.electionChannel) {
            if (!user.equals(this.client.user)) {
                
            }
        }
    }
}