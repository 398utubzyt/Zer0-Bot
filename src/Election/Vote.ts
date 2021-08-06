import * as Discord from "discord.js";

export default class Vote {
    public voter : Discord.User;
    public recipient : Discord.User;

    public constructor(voter : Discord.User, recipient : Discord.User) {
        this.voter = voter;
        this.recipient = recipient;
    }
}