import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = client.auth?.token || client.handshake?.auth?.token;

    if (!token) {
      this.logger.warn(`Connection attempt without token from ${client.id}`);
      throw new UnauthorizedException('Token not provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      // Attach payload to client for later use
      (client as any).user = payload;
      return true;
    } catch (error) {
      this.logger.warn(`Invalid token from ${client.id}: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
