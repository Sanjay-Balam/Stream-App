import { Context } from 'elysia';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export const authMiddleware = async (context: Context) => {
  try {
    const authHeader = context.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'No token provided'
      };
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
        isLive: user.isLive
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid token'
    };
  }
};

export const generateTokens = (user: any) => {
  try {
    console.log('GenerateTokens: Creating payload for user:', user.username);
    const payload: JWTPayload = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    };
    console.log('GenerateTokens: Payload created:', payload);

    console.log('GenerateTokens: Signing access token...');
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
    console.log('GenerateTokens: Access token created, length:', accessToken.length);

    console.log('GenerateTokens: Signing refresh token...');
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    console.log('GenerateTokens: Refresh token created, length:', refreshToken.length);

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('GenerateTokens: Error generating tokens:', error);
    throw error;
  }
};