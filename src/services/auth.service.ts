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
    
    // Generate approval token
    const approvalToken = crypto.randomBytes(32).toString('hex');
    
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
      email_verified: true, // No email verification needed
      status: 'pending', // New users start as pending, waiting for admin approval only
      approval_token: approvalToken,
    });
    
    // Send submission confirmation to user
    try {
      await emailService.sendSubmissionConfirmation(user.email, user.name);
    } catch (error) {
      console.error('Failed to send submission confirmation:', error);
    }
    
    // Send notification to admin
    try {
      await emailService.sendAdminNotification(
        user.name,
        user.email,
        user.phone,
        user.address,
        user.city,
        user.zip_code,
        user.country,
        approvalToken
      );
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }
    
    // Return user without sensitive data and without tokens
    const { password_hash: _, approval_token: __, ...userWithoutSensitive } = user;
    
    return { 
      user: userWithoutSensitive, 
      message: 'Your registration request has been submitted successfully. You will receive an email confirmation once your account is approved by our admin team.'
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
    
    // Check approval status
    if (user.status === 'pending') {
      throw new Error('Your account is pending approval. Please wait for admin confirmation. You will receive an email once approved.');
    }
    
    if (user.status === 'rejected') {
      throw new Error('Your account registration was not approved. Please contact support for more information.');
    }
    
    if (user.status !== 'approved') {
      throw new Error('Account access denied. Please contact support.');
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
