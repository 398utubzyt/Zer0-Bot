export default class Color {
    public r : number;
    public g : number;
    public b : number;
    public get hexString() : string {
        return '#' + Math.floor(this.r * 255).toString(16) + Math.floor(this.g * 255).toString(16) + Math.floor(this.b * 255).toString(16);
    }

    public toString() {
        return this.hexString;
    }

    public static readonly red = new Color(1, 0, 0);
    public static readonly green = new Color(0, 1, 0);
    public static readonly blue = new Color(0, 0, 1);
    public static readonly yellow = new Color(1, 1, 0);
    public static readonly cyan = new Color(0, 1, 1);
    public static readonly pink = new Color(1, 0, 1);
    public static readonly white = new Color(1, 1, 1);
    public static readonly black = new Color(1, 1, 1);

    constructor(r : number, g : number, b : number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}