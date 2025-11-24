import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    if (err || !user) {
      console.log('JwtAuthGuard Error:', err);
      console.log('JwtAuthGuard Info:', info);
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
