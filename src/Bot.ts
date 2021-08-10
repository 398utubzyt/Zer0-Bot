import * as Discord from "discord.js"; 
import Console from "./Console";
import API from "../api.json";
import Messages from "../messages.json";
import Election from "./Election/Election";
import Command from "./Commands/Command";
import BotUtil from "./BotUtil";
import File from "./IO/File";
import path from "path";
import Color from "./Graphics/Color";
import { JsonObjectExpression } from "typescript";

export default class Bot {
    public static readonly persistentPath : string = path.join(__dirname, '..\\persistent_data\\');
    public static client : Discord.Client;
    public static election : Election;
    
    public static Run(token : string) : void {
        this.client = new Discord.Client({intents: [
            Discord.Intents.FLAGS.DIRECT_MESSAGES,
            Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
            Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING,
            Discord.Intents.FLAGS.GUILDS,
            Discord.Intents.FLAGS.GUILD_BANS,
            Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
            Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
            Discord.Intents.FLAGS.GUILD_INVITES,
            Discord.Intents.FLAGS.GUILD_MEMBERS,
            Discord.Intents.FLAGS.GUILD_MESSAGES,
            Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
            Discord.Intents.FLAGS.GUILD_PRESENCES,
            Discord.Intents.FLAGS.GUILD_VOICE_STATES,
            Discord.Intents.FLAGS.GUILD_WEBHOOKS
        ]});

        this.client.on('ready', () => this.Ready());
        this.client.on('messageCreate', (message) => this.MessageCreate(message));

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

    public static SendEmbed(channel : string, embed : Discord.MessageEmbed) {
        this.client.guilds.fetch(API.serverId).then((guild) => {
            var cache : Discord.TextChannel = guild.channels.cache.find((value, key, collection) => {return value.name == channel;}) as Discord.TextChannel;
    
            if (cache == null) {
                return;
            }
            
            cache.send({embeds: [embed]}).catch((err) => this.Error(err));
        }).catch((err) => this.Error(err));
    }

    public static Send(channel : string, title? : string, description? : string, color? : Color) {
        this.client.guilds.fetch(API.serverId).then((guild) => {
            var cache : Discord.TextChannel = guild.channels.cache.find((value, key, collection) => {return value.name == channel;}) as Discord.TextChannel;
    
            if (cache == null) {
                return;
            }

            var embed : Discord.MessageEmbed = new Discord.MessageEmbed();

            if (title)
                embed.setTitle(title);

            if (description)
                embed.setDescription(description);

            if (color)
                embed.setColor(color.hexString as Discord.ColorResolvable);
            
            cache.send({embeds: [embed]}).catch((err) => this.Error(err));
        }).catch((err) => this.Error(err));
    }

    public static React(message : Discord.Message, emoji : string) {
        message.react(emoji);
    }

    public static InsufficientPermissions(channel : string, permissions : string) {
        this.Send(channel, "Invalid Permissions", BotUtil.Combine(Messages.Permissions, permissions), new Color(0.5, 0, 0));
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

    public static MessageCreate(message : Discord.Message) : void {
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

    public static ElectionStart() : void {
        this.election.channel.send("@everyone").then((msg) => {
            var announcement = new Discord.MessageEmbed();
            
            announcement.setTitle(BotUtil.Combine("{0} Election Started", BotUtil.GetElectionTerm()));
            announcement.setDescription(Messages.ElectionBegin);
            announcement.setColor("AQUA");

            this.election.channel.send({embeds: [announcement]}).then((msg) => {
                var embed = new Discord.MessageEmbed();
                
                embed.setTitle(BotUtil.Combine("{0} Candidates", BotUtil.GetElectionTerm()));
                embed.setDescription(this.election.CandidateList());
                embed.setColor("BLURPLE");

                this.election.channel.send({embeds: [embed]});
            });
        });
    }

    public static ElectionEnd() : void {
        this.election.channel.send("@everyone").then((msg) => {
            var announcement = new Discord.MessageEmbed();
            
            announcement.setTitle(BotUtil.Combine("{0} Election Ended", BotUtil.GetElectionTerm()));
            announcement.setDescription(BotUtil.Combine("The {0} election has ended early for some reason. Ask 398 for more details.", BotUtil.GetElectionTerm()));
            announcement.setColor("BLUE");

            this.election.channel.send({embeds: [announcement]}).then((msg) => {
                var embed = new Discord.MessageEmbed();
                
                embed.setTitle(BotUtil.Combine("{0} Results", BotUtil.GetElectionTerm()));
                embed.setDescription(this.election.CandidateLeaderboard());
                embed.setColor("BLURPLE");

                this.election.channel.send({embeds: [embed]});
            });
        });
    }
}