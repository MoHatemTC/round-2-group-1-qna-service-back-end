import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

/** Placeholder until Auth slot wires real admin role checks. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
