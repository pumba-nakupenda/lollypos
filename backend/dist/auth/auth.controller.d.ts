import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    log(body: {
        userId: string;
        email: string;
        device: string;
        ip: string;
    }): Promise<void>;
    getLogs(): Promise<any[]>;
}
