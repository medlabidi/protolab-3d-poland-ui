import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { generateTokenPair, verifyRefreshToken, getRefreshTokenExpiry } from '../utils/jwt';
import { TokenPair } from '../types';
import { emailService } from './email.service';

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
    // Check for existing user (case-insensitive)
    const normalizedEmail = data.email.toLowerCase().trim();
    const existingUser = await User.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error('Email already registered. Please use a different email or login.');
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const password_hash = await bcrypt.hash(data.password, 10);
    
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
      email_verified: false, // Needs email verification
      status: 'approved', // Auto-approved, just needs email verification
      verification_token: verificationToken,
    });
    
    // Send verification email to user
    try {
      await emailService.sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email. Please try again.');
    }
    
    // Return user without sensitive data and without tokens
    const { password_hash: _, verification_token: __, ...userWithoutSensitive } = user;
    
    return { 
      user: userWithoutSensitive, 
      message: 'Registration successful! Please check your email to verify your account.'
    };
  }
  
  async login(email: string, password: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findByEmail(normalizedEmail);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    
    // Check email verification
    if (!user.email_verified) {
      throw new Error('Please verify your email address before logging in. Check your inbox for the verification link.');
    }
    
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    
    await RefreshToken.create({
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: getRefreshTokenExpiry().toISOString(),
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
      user_id: payload.id,
      token: newTokens.refreshToken,
      expires_at: getRefreshTokenExpiry().toISOString(),
    });
    
    return newTokens;
  }
  
  async logout(refreshToken: string): Promise<void> {
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  async verifyEmail(verificationToken: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const supabase = (await import('../config/database')).getSupabase();
    
    // Find user with this verification token
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('verification_token', verificationToken)
      .limit(1);
    
    if (error || !users || users.length === 0) {
      throw new Error('Invalid or expired verification token');
    }
    
    const user = users[0] as IUser;
    
    if (user.email_verified) {
      throw new Error('Email already verified. You can log in now.');
    }
    
    // Update user: verify email and clear token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Update error details:', updateError);
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
    
    await RefreshToken.create({
      user_id: verifiedUser.id,
      token: tokens.refreshToken,
      expires_at: getRefreshTokenExpiry().toISOString(),
    });
    
    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(verifiedUser.email, verifiedUser.name);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
    
    return { user: verifiedUser, tokens };
  }

  async approveUser(approvalToken: string, adminId?: string): Promise<{ message: string }> {
    const supabase = (await import('../config/database')).getSupabase();
    
    // Find user by approval token
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('approval_token', approvalToken)
      .eq('status', 'pending')
      .single();
    
    if (error || !users) {
      throw new Error('Invalid approval token or user already processed');
    }
    
    // Update user status to approved
    await User.updateById(users.id, {
      status: 'approved',
      approval_token: undefined,
      approved_at: new Date().toISOString(),
      approved_by: adminId || 'admin',
    });
    
    // Send approval email to user
    try {
      await emailService.sendApprovalEmail(users.email, users.name);
    } catch (error) {
      console.error('Failed to send approval email:', error);
    }
    
    return { message: `User ${users.name} (${users.email}) has been approved successfully.` };
  }

  async rejectUser(approvalToken: string, reason?: string): Promise<{ message: string }> {
    const supabase = (await import('../config/database')).getSupabase();
    
    // Find user by approval token
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('approval_token', approvalToken)
      .eq('status', 'pending')
      .single();
    
    if (error || !users) {
      throw new Error('Invalid approval token or user already processed');
    }
    
    // Update user status to rejected
    await User.updateById(users.id, {
      status: 'rejected',
      approval_token: undefined,
    });
    
    // Send rejection email to user
    try {
      await emailService.sendRejectionEmail(users.email, users.name, reason);
    } catch (error) {
      console.error('Failed to send rejection email:', error);
    }
    
    return { message: `User ${users.name} (${users.email}) has been rejected.` };
  }
}

export const authService = new AuthService();
