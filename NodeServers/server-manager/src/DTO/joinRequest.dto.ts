import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export default class JoinRequestDTO {
    @IsNotEmpty()
    @IsString()
    @MinLength(4)
    @MaxLength(4)
    private _code: string;
    @IsNotEmpty()
    @IsString()
    @MinLength(1)
    @MaxLength(18)
    private _username: string;

    constructor(code: string, username: string){
        this._code = code;
        this._username = username;
    }

    /**
     * Getter code
     * @return {string}
     */
	public get code(): string {
		return this._code;
	}

    /**
     * Getter username
     * @return {string}
     */
	public get username(): string {
		return this._username;
	}

    /**
     * Setter code
     * @param {string} value
     */
	public set code(value: string) {
		this._code = value;
	}

    /**
     * Setter username
     * @param {string} value
     */
	public set username(value: string) {
		this._username = value;
	}
}