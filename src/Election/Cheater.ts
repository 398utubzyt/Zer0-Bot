import * as Discord from "discord.js";
import Vote from "./Vote";

enum CheaterType {
    MULTI_VOTE,
    REMOVE_VOTE,
    SELF_VOTE
}

export default class Cheater {
    public vote : Vote;
    public user : Discord.User;
    public type : CheaterType;

    public constructor(vote : Vote, type : CheaterType) {
        this.vote = vote;
        this.user = vote.voter;
        this.type = type;
    }
}