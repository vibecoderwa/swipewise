import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../lib/jwt.js';

declare global {
  namespace Express {
    interface Request { userId: string }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  try {
    const payload = verifyAccess(header.slice(7));
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
