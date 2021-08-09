# Zer0 Bot

## About

This is a bot made for Michael's Hangout Server, the only reason he has Discord anymore, and a private server for his friends to hang out.

## Setup

For Discord API functionality (which you will definitely need), you need to create a file called `api.json`. I gitignored this file so that people can't steal the bot token, so if you want to create your own bot or test the code you can use this example to get started: 
```json
{
    "token": "bot-token-here",
    "serverId": "server-id-here",
    "testChannel": "testing-channel-id-here",
    "electionChannel": "election-channel-id-here",
    "ownerRole": "owner-role-id-here",
    "voteEmoji": "emoji-id-here",
    "prefix": "prefix-text-here"
}
```

## Progress

### *Commands:*

- [x] Execution
- [x] Data Class
- [x] Help Command
- [x] Ping Command
- [x] Response Message Json
- [x] Permission Checks
- [ ] Custom Commands

### *Levels:*

- [ ] Store Data
- [x] Persistent Data
- [ ] Level Up Message
- [ ] Leaderboard

### *Moderation:*

- [ ] Ban Command
- [ ] Kick Command
- [x] Warn Command
- [ ] Mute Command
- [ ] Admin-Abuse Detection
- [ ] Admin Log

### *Fun:*

- [ ] Send message as a Webhook

### *Elections:*

- [x] Add Candidates
- [x] Set/Manage Reactions
- [x] Detect Cheating (removing votes etc.)
      ^^ This is redundent since it uses commands instead of reactions now

Please leave any suggestions you have in the issues section. 
