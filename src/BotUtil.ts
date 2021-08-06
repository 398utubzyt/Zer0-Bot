export default class BotUtil {
    /**
     * 
     * @param {string} message 
     * @param {any[]} arguments 
     * @returns {string} The modified string
     */
    public static Combine(message : string, ...args : any[]) : string{
        for (var i = 0; i < args.length; i++) {
            message = message.replace('{' + i + '}', args[i]);
        }
        
        return message;
    }

    /**
     * Loops the number `x` between `min` and `max`
     * @param {number} x The number to repeat
     * @param {number} min The minimum boundary
     * @param {number} max The maximum boundary
     * @returns 
     */
    public static Loop(x : number, min : number, max : number) : number {
        return ((x - min) % (max - min)) + min;
    }

    /**
     * Converts the string to be a double digit number.
     * @param {string} numStr The number string.
     * @returns The number represent as an 0X or XX number.
     */
    public static ForceDoubleDigit(numStr : string) : string {
        if (numStr.length != 2) { return '0' + numStr.toString(); }
        return numStr;
    }

    public static GetElectionTerm(termOffset : number = 0) : string {
        var date = new Date();
        var month = this.Loop(date.getMonth() + 2, 1, 13);
        var day = date.getDay();

        if (day < 10) {
            return this.ForceDoubleDigit(this.Loop(month + termOffset - 1, 1, 13).toString()) + '-' + this.ForceDoubleDigit(this.Loop(month + termOffset, 1, 13).toString());
        } else {
            return this.ForceDoubleDigit(this.Loop(month + termOffset, 1, 13).toString()) + '-' + this.ForceDoubleDigit(this.Loop(month + termOffset + 1, 1, 13).toString());
        }
    }
}