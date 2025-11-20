import bcrypt from 'bcrypt';
import { User, IUser } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { generateTokenPair, verifyRefreshToken, getRefreshTokenExpiry } from '../utils/jwt';
import { TokenPair } from '../types';

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }): Promise<{ user: IUser; tokens: TokenPair }> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      address: data.address,
      role: 'user',
    });
    
    const tokens = generateTokenPair({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    
    await RefreshToken.create({
      userId: user._id,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });
    
    return { user, tokens };
  }
  
  async login(email: string, password: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    const tokens = generateTokenPair({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    
    await RefreshToken.create({
      userId: user._id,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });
    
    return { user, tokens };
  }
  
  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = verifyRefreshToken(refreshToken);
    
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      throw new Error('Invalid refresh token');
    }
    
    await RefreshToken.deleteOne({ token: refreshToken });
    
    const newTokens = generateTokenPair(payload);
    
    await RefreshToken.create({
      userId: payload.id,
      token: newTokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });
    
    return newTokens;
  }
  
  async logout(refreshToken: string): Promise<void> {
    await RefreshToken.deleteOne({ token: refreshToken });
  }
}

export const authService = new AuthService();
