import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { generateTokenPair, verifyRefreshToken, getRefreshTokenExpiry } from '../utils/jwt';
import { TokenPair } from '../types';
import { emailService } from './email.service';

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ user: Partial<IUser>; message: string }> {
    // Validate input
    if (!data.email || !data.password || !data.name) {
      throw new Error('Name, email, and password are required');
    }

    // Check for existing user (case-insensitive)
    const normalizedEmail = data.email.toLowerCase().trim();
    const existingUser = await User.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error('Email already registered');
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const password_hash = await bcrypt.hash(data.password, 10);
    
    // Create user with auto-verified status (no approval workflow)
    const user = await User.create({
      name: data.name,
      email: normalizedEmail,
      password_hash,
      phone: data.phone,
      address: data.address,
      city: data.city,
      zip_code: data.zipCode,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      role: 'user',
      email_verified: false,
      status: 'approved',
      verification_token: verificationToken,
      verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    
    // Send registration confirmation email
    try {
      await emailService.sendRegistrationConfirmation(user.email, user.name);
    } catch (error) {
      console.error('Failed to send registration confirmation:', error);
      // Don't throw - user is already created, continue with verification email
    }

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Registration successful but failed to send verification email. Please contact support.');
    }
    
    return { 
      user: { ...user, password_hash: undefined, verification_token: undefined }, 
      message: 'Registration successful! Please check your email to verify your account.'
    };
  }
  
  async login(email: string, password: string): Promise<{ user: IUser; tokens: TokenPair }> {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findByEmail(normalizedEmail);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    
    // Check email verification
    if (!user.email_verified) {
      throw new Error('Please verify your email address first. Check your inbox for the verification link.');
    }
    
    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    
    // Store refresh token
    await RefreshToken.create({
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: getRefreshTokenExpiry().toISOString(),
    });
    
    return { user, tokens };
  }
  
  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      
      // Find and delete old token
      const storedToken = await RefreshToken.findOne({ token: refreshToken });
      if (!storedToken) {
        throw new Error('Invalid refresh token');
      }
      
      await RefreshToken.deleteOne({ token: refreshToken });
      
      // Generate new tokens
      const newTokens = generateTokenPair(payload);
      
      // Store new refresh token
      await RefreshToken.create({
        user_id: payload.id,
        token: newTokens.refreshToken,
        expires_at: getRefreshTokenExpiry().toISOString(),
      });
      
      return newTokens;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
  
  async logout(refreshToken: string): Promise<void> {
    try {
      await RefreshToken.deleteOne({ token: refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw - logout should succeed even if token doesn't exist
    }
  }

  async verifyEmail(verificationToken: string): Promise<{ user: IUser; tokens: TokenPair }> {
    try {
      const supabase = (await import('../config/database')).getSupabase();
      
      // Find user with this verification token
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('verification_token', verificationToken)
        .single();
      
      if (error || !users) {
        throw new Error('Invalid or expired verification token');
      }
      
      const user = users as IUser;
      
      if (user.email_verified) {
        throw new Error('Email already verified');
      }
      
      // Update user: verify email and clear token
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email_verified: true,
          verification_token: null,
          verification_token_expires: null,
        })
        .eq('id', user.id);
      
      if (updateError) {
        throw new Error(`Failed to verify email: ${updateError.message}`);
      }
      
      // Get updated user
      const verifiedUser: IUser = { ...user, email_verified: true, verification_token: undefined };
      
      // Generate tokens for auto-login
      const tokens = generateTokenPair({
        id: verifiedUser.id,
        email: verifiedUser.email,
        role: verifiedUser.role,
      });
      
      // Store refresh token
      await RefreshToken.create({
        user_id: verifiedUser.id,
        token: tokens.refreshToken,
        expires_at: getRefreshTokenExpiry().toISOString(),
      });
      
      // Send welcome/congratulations email
      try {
        await emailService.sendWelcomeEmail(verifiedUser.email, verifiedUser.name);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't throw - email verified, user can proceed
      }
      
      return { user: verifiedUser, tokens };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Email verification failed');
    }
  }

  async googleAuth(idToken: string): Promise<{ user: IUser; tokens: TokenPair; isNewUser: boolean }> {
    try {
      // Verify Google token (requires google-auth-library)
      // For now, we'll create a placeholder
      const googleUser = await this.verifyGoogleToken(idToken);
      
      const normalizedEmail = googleUser.email.toLowerCase().trim();
      let user = await User.findByEmail(normalizedEmail);
      let isNewUser = false;
      
      if (!user) {
        // Create new user from Google profile
        isNewUser = true;
        user = await User.create({
          name: googleUser.name,
          email: normalizedEmail,
          password_hash: 'google_' + crypto.randomBytes(16).toString('hex'), // Dummy password
          email_verified: true, // Trust Google's verification
          role: 'user',
          status: 'approved',
        });

        // Send welcome email for new users
        try {
          await emailService.sendWelcomeEmail(user.email, user.name);
        } catch (error) {
          console.error('Failed to send welcome email:', error);
        }
      }
      
      // Generate tokens
      const tokens = generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      
      // Store refresh token
      await RefreshToken.create({
        user_id: user.id,
        token: tokens.refreshToken,
        expires_at: getRefreshTokenExpiry().toISOString(),
      });
      
      return { user, tokens, isNewUser };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Google authentication failed');
    }
  }

  private async verifyGoogleToken(idToken: string): Promise<{ email: string; name: string; picture?: string }> {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token payload');
      }

      if (!payload.email || !payload.name) {
        throw new Error('Missing required Google profile information');
      }

      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    } catch (error: any) {
      console.error('Google token verification error:', error);
      
      // Check for clock skew error
      if (error?.message?.includes('used too late') || error?.message?.includes('used too early')) {
        throw new Error('System clock error detected. Please ensure your computer\'s date and time are set correctly and try again.');
      }
      
      throw new Error('Failed to verify Google token: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

export const authService = new AuthService();
