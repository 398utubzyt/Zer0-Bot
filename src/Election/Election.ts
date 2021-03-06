import Console from "../Console";
import * as Discord from "discord.js";
import Bot from "../Bot";
import Candidate from "./Candidate";
import Vote from "./Vote";
import BotUtil from "../BotUtil";
import Cheater from "./Cheater";

export default class Election {
    public channel : Discord.TextChannel;
    public candidates : Candidate[];
    public cheaters : Cheater[];
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

    public get multiVoteCheaters() : Discord.User[] {
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

    public AddCheater(user? : Discord.User) : void {

    }

    public UserVotedAmount(user : Discord.User) : number {
        var amount = 0;

        for (var i = 0; i < this.candidates.length; i++) {
            for (var l = 0; l < this.candidates[i].votes.length; l++) {
                if (this.candidates[i].votes[l].voter.id == user.id)
                    amount++;
            }
        }

        return amount;
    }

    public UserCurrentlyVoted(user : Discord.User) : Candidate {
        for (var i = 0; i < this.candidates.length; i++) {
            for (var l = 0; l < this.candidates[i].votes.length; l++) {
                if (this.candidates[i].votes[l].voter.id == user.id)
                    return this.candidates[i];
            }
        }

        return null;
    }

    public Vote(user : Discord.User, candidate : Candidate) : Candidate {
        var candidate = this.GetCandidate(candidate.user.id);
        var votes = candidate.votes.find((vote, index, arr) => { return vote.voter.id == user.id; });

        if (votes) {
            return this.GetCandidate(votes.recipient.id);
        }

        if (this.UserVotedAmount(user) > 0) {
            return this.UserCurrentlyVoted(user);
        }

        candidate.votes.push(new Vote(user, candidate.user));
        return null;
    }

    public Unvote(user : Discord.User, candidate : Candidate) : boolean {
        var candidate = this.GetCandidate(candidate.user.id);

        if (!candidate.votes.find((vote, index, arr) => { return vote.voter.id == user.id; })) {
            return true;
        }

        if (this.UserVotedAmount(user) < 1) {
            return true;
        }

        candidate.votes.splice(candidate.votes.indexOf(candidate.votes.find((vote, index, arr) => { return vote.voter.id == user.id; })), 1);
        return false;
    }

    public Start() : void {
        this.started = true;
        Console.Log("Starting the {0} election!", BotUtil.GetElectionTerm());
        Bot.ElectionStart();
    }

    public End() : void {
        this.started = false;
        Console.Log("Ending the {0} election!", BotUtil.GetElectionTerm());
        Bot.ElectionEnd();
    }

    public HasCandidate(id : string) : boolean {
        return this.candidateIds.includes(id);
    }

    public GetCandidate(id : string) : Candidate {
        return this.candidates[this.candidateIds.indexOf(id)];
    }

    public CandidateList(seperator : string = '\n') : string {
        var list : string = "";
        for (var i : number = 0; i < this.candidateCount; i++) {
            list += this.candidates[i].user.username;

            if (i < this.candidateCount - 1)
                list += seperator;
        }
        return list;
    }

    public CandidateLeaderboard(seperator : string = '\n') : string {
        var list : string[] = [];
        for (var i : number = 0; i < this.candidateCount; i++) {
            list.push(BotUtil.Combine("{0} - {1}", this.candidates[i].user.username, this.candidates[i].voteCount));
        }
        return list.sort((a, b) => { return parseInt(b.split(' ')[2]) - parseInt(a.split(' ')[2]); }).join(seperator);
    }

    public Register(id : string) : void {
        if (this.started || this.HasCandidate(id))
            return;
        
        Bot.client.users.fetch(id).then((user : Discord.User) => {
            Console.Log("Register {0} ({1})", id, user.username);
            this.candidates.push(new Candidate(user));
        }).catch((err : any) => Bot.Error(err));
    }

    public Unregister(id : string) : void {
        if (this.started || !this.HasCandidate(id))
            return;

        Bot.client.users.fetch(id).then((user : Discord.User) => {
            Console.Log("Unegister {0} ({1})", id, user.username);
            this.candidates.splice(this.candidates.indexOf(this.GetCandidate(id)), 1);
        }).catch((err : any) => Bot.Error(err));
    }

    public SetChannel(channel : Discord.TextChannel) : void {
        this.channel = channel;
    }

    public GetLeadCandidate() : Candidate {
        var candidate : Candidate = null;
        var temp : Candidate = null;

        for (var i = 0; i < this.candidates.length; i++) {
            if (temp != null) {
                if (this.candidates[i].voteCount > temp.voteCount)
                    temp = this.candidates[i];
            } else {
                temp = this.candidates[i];
            }
        }

        if (temp.voteCount > 0)
            candidate = temp;

        return candidate;
    }

    public GetSecondLeadCandidate() : Candidate {
        var candidate : Candidate = null;
        var temp : Candidate = null;
        var second : Candidate = null;

        for (var i = 0; i < this.candidates.length; i++) {
            if (temp != null) {
                if (this.candidates[i].voteCount > temp.voteCount) {
                    second = temp;
                    temp = this.candidates[i];
                }
            } else {
                temp = this.candidates[i];
            }
        }

        if (second) {
            if (second.voteCount > 0)
                candidate = second;
        }

        return candidate;
    }

    public constructor() {
        this.candidates = [];
        this.started = false;
    }
}