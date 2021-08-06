import * as io from "fs";
import Bot from "../Bot";

export default class File {
    /**
     * Creates a file in the persistent directory.
     * @param {string} name The name of the file. 
     * @param {string} content The content to write to the file.
     */
    public static Create(name : string, content : string = '') : void {
        io.writeFileSync(Bot.persistentPath + name, content);
    }

    /**
     * Creates a file in the persistent directory.
     * @param {string} name The name of the file. 
     * @param {string} content The content to write to the file.
     */
    public static Write(name : string, content : string = '') : void {
        io.writeFileSync(Bot.persistentPath + name, content);
    }

    /**
     * Creates a file in the persistent directory.
     * @param {string} name The name of the file. 
     * @param {string} content The content to write to the file.
     */
    public static Append(name : string, content : string = '') : void {
        io.appendFileSync(Bot.persistentPath + name, content);
    }

    /**
     * Reads a file in the persistent directory.
     * @param {string} name The name of the file.
     * @returns {string} Contents of the file.
     */
    public static Read(name : string) : string{ 
        return io.readFileSync(Bot.persistentPath + name).toString();
    }

    /**
     * Deletes a file in the persistent directory.
     * @param {string} name The name of the file.
     */
    public static Delete(name : string) : void {
        io.unlinkSync(Bot.persistentPath + name);
    }

    /**
     * Checks if a file exists, and returns true if it does.
     * @param {string} name The name of the file.
     * @returns {boolean} If the file exists.
     */
    public static Exists(name : string) : boolean {
        return io.existsSync(Bot.persistentPath + name);
    }
}