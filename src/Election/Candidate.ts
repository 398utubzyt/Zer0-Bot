import * as Discord from "discord.js";
import Vote from "./Vote";

export default class Candidate {
    public user : Discord.User;
    public votes : Vote[];
    public get voteCount() : number {
        return this.votes.length;
    }

    public constructor(user : Discord.User) {
        this.user = user;
        this.votes = [];
    }
}