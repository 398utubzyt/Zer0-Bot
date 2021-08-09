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
        this.client.on('messageReactionAdd', (reaction, user) => this.ReactionAdd(reaction as Discord.MessageReaction, user as Discord.User));
        this.client.on('messageReactionRemove', (reaction, user) => this.ReactionRemove(reaction as Discord.MessageReaction, user as Discord.User));

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

    public static ReactionAdd(reaction : Discord.MessageReaction, user : Discord.User) : void {
        if (reaction.message.channel.id == API.electionChannel) {
            if (reaction.message.author.id == this.client.user.id) {
                if (reaction.emoji.name == API.voteEmoji) {
                    if (!user.equals(this.client.user)) {
                        if (!user.dmChannel)
                            user.createDM().then((dm) => {
                                var embed = new Discord.MessageEmbed();
                                var candidate = this.election.GetCandidate(this.client.users.cache.find((user, id, map) => { if (user.username == reaction.message.embeds[0].description.replace('<@', '').replace('>', '')) return true; return false; }).id);
                
                                if (!this.election.Vote(user, candidate)) {
                                    embed.setTitle("Error trying to Vote");
                                    embed.setDescription("You have already voted for this candidate, but are still voting anyway. \nSince this is not possible, please report this to 398 immediately.");
                                    embed.setColor("#FF0000");
                                } else {
                                    embed.setTitle("Voting Successful");
                                    embed.setDescription(BotUtil.Combine("You have voted for {0} to be the {1} president.", candidate.user.username, BotUtil.GetElectionTerm()));
                                    embed.setColor("#00FF00");
                                }
                                
                                dm.send({embeds: [embed]});
                            });
                        else {
                            var embed = new Discord.MessageEmbed();
                            var candidate = this.election.GetCandidate(this.client.users.cache.find((user, id, map) => { if (user.username == reaction.message.embeds[0].description.replace('<@', '').replace('>', '')) return true; return false; }).id);
            
                            if (!this.election.Vote(user, candidate)) {
                                embed.setTitle("Error trying to Vote");
                                embed.setDescription("You have already voted for this candidate, but are still voting anyway. \nSince this is not possible, please report this to 398 immediately.");
                                embed.setColor("#FF0000");
                            } else {
                                embed.setTitle("Voting Successful");
                                embed.setDescription(BotUtil.Combine("You have voted for {0} to be the {1} president.", candidate.user.username, BotUtil.GetElectionTerm()));
                                embed.setColor("#00FF00");
                            }
                            
                            user.dmChannel.send({embeds: [embed]});
                        }
                    }
                }
            }
        }
    }

    public static ReactionRemove(reaction : Discord.MessageReaction, user : Discord.User) : void {
        if (reaction.message.channel.id == API.electionChannel) {
            if (reaction.message.author.id == this.client.user.id) {
                if (reaction.emoji.name == API.voteEmoji) {
                    if (!user.equals(this.client.user)) {
                        if (!user.dmChannel)
                            user.createDM().then((dm) => {
                                var embed = new Discord.MessageEmbed();
                                var candidate = this.election.GetCandidate(this.client.users.cache.find((user, id, map) => { if (user.username == reaction.message.embeds[0].description.replace('<@', '').replace('>', '')) return true; return false; }).id);
                
                                if (!this.election.Unvote(user, candidate)) {
                                    embed.setTitle("Error trying to Remove Vote");
                                    embed.setDescription("You haven't voted for this candidate, but are still removing your vote anyway. \nSince this is not possible, please report this to 398 immediately.");
                                    embed.setColor("#FF0000");
                                } else {
                                    embed.setTitle("Vote Remove Successful");
                                    embed.setDescription(BotUtil.Combine("You have removed your vote for {0} to be the {1} president.", candidate.user.username, BotUtil.GetElectionTerm()));
                                    embed.setColor("#00FF00");
                                }
                                
                                dm.send({embeds: [embed]});
                            });
                        else {
                            var embed = new Discord.MessageEmbed();
                            var candidate = this.election.GetCandidate(this.client.users.cache.find((user, id, map) => { if (user.username == reaction.message.embeds[0].description.replace('<@', '').replace('>', '')) return true; return false; }).id);
            
                            if (!this.election.Unvote(user, candidate)) {
                                embed.setTitle("Error trying to Remove Vote");
                                embed.setDescription("You haven't voted for this candidate, but are still removing your vote anyway. \nSince this is not possible, please report this to 398 immediately.");
                                embed.setColor("#FF0000");
                            } else {
                                embed.setTitle("Vote Remove Successful");
                                embed.setDescription(BotUtil.Combine("You have removed your vote for {0} to be the {1} president.", candidate.user.username, BotUtil.GetElectionTerm()));
                                embed.setColor("#00FF00");
                            }
                            
                            user.dmChannel.send({embeds: [embed]});
                        }
                    }
                }
            }
        }
    }

    public static ElectionStart() : void {
        for (var i : number = 0; i < this.election.candidateCount; i++) {
            var candidate = this.election.candidates[i];

            var embed = new Discord.MessageEmbed();
            
            embed.setTitle(BotUtil.Combine("{0} Candidate", BotUtil.GetElectionTerm()));
            embed.setDescription(candidate.user.username);
            embed.setColor("BLURPLE");

            this.election.channel.send({embeds: [embed]}).then((msg) => {
                candidate.message = msg;
                msg.react(API.voteEmoji);
            });
        }
    }
}