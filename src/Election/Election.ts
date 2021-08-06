import Console from "../Console";
import * as Discord from "discord.js";
import Bot from "../Bot";
import Candidate from "./Candidate";
import Vote from "./Vote";
import BotUtil from "../BotUtil";

export default class Election {
    public channel : Discord.Channel;
    public candidates : Candidate[];
    public started : boolean;

    public get candidateCount() : number {
        return this.candidates.length;
    }

    public get candidateIds() : string[] {
        var arr : string[] = [];

        for (var i : number = 0; i < this.candidateCount; i++) {
            arr.push(this.candidates[i].user.id);
        }

        return arr;
    }

    public get votes() : Vote[] {
        var arr : Vote[] = [];

        for (var i : number = 0; i < this.candidateCount; i++) {
            for (var l : number = 0; l < this.candidates[i].voteCount; l++) {
                arr.push(this.candidates[i].votes[l]);
            }
        }

        return arr;
    }

    public get cheaters() : Discord.User[] {
        var votes : Vote[] = this.votes;
        var usersVoted : Discord.User[] = [];
        var cheaters : Discord.User[] = [];

        for (var i : number = 0; i < votes.length; i++) {
            usersVoted.push(votes[i].voter);

            for (var l : number = 0; l < usersVoted.length; l++) {
                if (l != i) {
                    if (usersVoted[l] == usersVoted[i]) {
                        if (!cheaters.includes(usersVoted[i])) {
                            cheaters.push(usersVoted[i]);
                        }
                    }
                }
            }
        }

        return cheaters;
    }

    public Start() : void {
        this.started = true;
        Console.Log("Starting the {0} election!", BotUtil.GetElectionTerm());
        Bot.SendMessage("zer0-bot-testing", `Starting the ${BotUtil.GetElectionTerm()} election!`);
    }

    public Register(id : string) : void {
        if (this.started || this.candidateIds.includes(id))
            return;

        
        Bot.client.users.fetch(id).then((user : Discord.User) => {
            Console.Log("Register {0} ({1})", id, user.username);
            this.candidates.push(new Candidate(user));
        }).catch((err : any) => Bot.Error(err));
    }

    public Unregister(id : string) : void {
        if (this.started || !this.candidateIds.includes(id))
            return;

        Bot.client.users.fetch(id).then((user : Discord.User) => {
            this.candidates.push(new Candidate(user));
        }).catch((err : any) => Bot.Error(err));
    }

    public SetChannel(channel : Discord.TextChannel) : void {
        this.channel = channel;
    }

    public constructor() {
        this.candidates = [];
        this.started = false;
    }
}