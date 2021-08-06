import BotUtil from "./BotUtil";

export default class Console {
    public static Log(msg : any, arg0 : any = null, arg1 : any = null, arg2 : any = null, arg3 : any = null, arg4 : any = null, arg5 : any = null, arg6 : any = null, arg7 : any = null, arg8 : any = null, arg9 : any = null) : void {
        console.log(BotUtil.Combine(msg, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9));
    }
}