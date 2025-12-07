import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Type definition for authenticated requests
interface AuthenticatedRequest extends VercelRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Lazy imports to catch module errors
let bcrypt: any;
let getSupabase: any;
let generateTokenPair: any;
let verifyRefreshToken: any;
let getRefreshTokenExpiry: any;
let verifyAccessToken: any;
let cors: any;
let requireAuth: any;
let sendVerificationEmail: any;
let sendPasswordResetEmail: any;
let sendWelcomeEmail: any;

const initModules = async () => {
  if (!bcrypt) {
    bcrypt = (await import('bcryptjs')).default;
  }
  if (!getSupabase) {
    const supabaseModule = await import('./_lib/supabase');
    getSupabase = supabaseModule.getSupabase;
  }
  if (!generateTokenPair) {
    const jwtModule = await import('./_lib/jwt');
    generateTokenPair = jwtModule.generateTokenPair;
    verifyRefreshToken = jwtModule.verifyRefreshToken;
    getRefreshTokenExpiry = jwtModule.getRefreshTokenExpiry;
    verifyAccessToken = jwtModule.verifyAccessToken;
  }
  if (!cors) {
    const middlewareModule = await import('./_lib/middleware');
    cors = middlewareModule.cors;
    requireAuth = middlewareModule.requireAuth;
  }
  if (!sendVerificationEmail) {
    const emailModule = await import('./_lib/email');
    sendVerificationEmail = emailModule.sendVerificationEmail;
    sendPasswordResetEmail = emailModule.sendPasswordResetEmail;
    sendWelcomeEmail = emailModule.sendWelcomeEmail;
  }
};

// Main API router
export default async (req: VercelRequest, res: VercelResponse) => {
  // Set CORS headers immediately
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  
  try {
    // Initialize modules lazily
    await initModules();
    // Auth routes
    if (path === '/auth/register' && req.method === 'POST') {
      return await handleRegister(req, res);
    }
    if (path === '/auth/login' && req.method === 'POST') {
      return await handleLogin(req, res);
    }
    if (path === '/auth/refresh' && req.method === 'POST') {
      return await handleRefresh(req, res);
    }
    if (path === '/auth/logout' && req.method === 'POST') {
      return await handleLogout(req, res);
    }
    if (path === '/auth/me' && req.method === 'GET') {
      return await handleGetMe(req as AuthenticatedRequest, res);
    }
    if (path === '/auth/profile' && req.method === 'PUT') {
      return await handleUpdateProfile(req as AuthenticatedRequest, res);
    }
    if (path === '/auth/change-password' && req.method === 'POST') {
      return await handleChangePassword(req as AuthenticatedRequest, res);
    }
    if (path === '/auth/forgot-password' && req.method === 'POST') {
      return await handleForgotPassword(req, res);
    }
    if (path === '/auth/reset-password' && req.method === 'POST') {
      return await handleResetPassword(req, res);
    }
    if (path === '/auth/verify-email' && req.method === 'GET') {
      return await handleVerifyEmail(req, res);
    }
    if (path === '/auth/google' && req.method === 'POST') {
      return await handleGoogleAuth(req, res);
    }
    
    // Order routes
    if (path === '/orders/my' && req.method === 'GET') {
      return await handleGetMyOrders(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/orders\/[^/]+$/) && req.method === 'GET') {
      return await handleGetOrder(req as AuthenticatedRequest, res);
    }
    if (path === '/orders' && req.method === 'POST') {
      return await handleCreateOrder(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/orders\/[^/]+$/) && req.method === 'PUT') {
      return await handleUpdateOrder(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/orders\/[^/]+$/) && req.method === 'DELETE') {
      return await handleDeleteOrder(req as AuthenticatedRequest, res);
    }
    
    // User routes  
    if (path === '/users/profile' && req.method === 'GET') {
      return await handleGetProfile(req as AuthenticatedRequest, res);
    }
    if (path === '/users/profile' && req.method === 'PUT') {
      return await handleUpdateUserProfile(req as AuthenticatedRequest, res);
    }
    
    // Upload routes
    if (path === '/upload/presigned-url' && req.method === 'POST') {
      return await handleGetPresignedUrl(req as AuthenticatedRequest, res);
    }
    if (path === '/upload/analyze' && req.method === 'POST') {
      return await handleAnalyzeFile(req as AuthenticatedRequest, res);
    }
    
    // Credits routes
    if (path === '/credits/balance' && req.method === 'GET') {
      return await handleGetCreditsBalance(req as AuthenticatedRequest, res);
    }
    
    // Conversations routes
    if (path === '/conversations' && req.method === 'GET') {
      return await handleGetConversations(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/[^/]+\/messages$/) && req.method === 'GET') {
      return await handleGetMessages(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/[^/]+\/messages$/) && req.method === 'POST') {
      return await handleSendMessage(req as AuthenticatedRequest, res);
    }
    
    // Default: API info
    return res.status(200).json({
      message: 'ProtoLab API',
      version: '1.0.0',
      status: 'running',
      path: path,
      availableEndpoints: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/google',
        'POST /api/auth/refresh',
        'POST /api/auth/logout',
        'GET /api/auth/me',
        'PUT /api/auth/profile',
        'POST /api/auth/change-password',
        'POST /api/auth/forgot-password',
        'POST /api/auth/reset-password',
        'GET /api/auth/verify-email',
        'GET /api/orders/my',
        'GET /api/orders/:id',
        'POST /api/orders',
        'PUT /api/orders/:id',
        'DELETE /api/orders/:id',
        'GET /api/users/profile',
        'PUT /api/users/profile',
        'POST /api/upload/presigned-url',
        'POST /api/upload/analyze',
        'GET /api/credits/balance',
        'GET /api/conversations',
        'GET /api/conversations/:id/messages',
        'POST /api/conversations/:id/messages',
      ]
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ==================== AUTH HANDLERS ====================

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  const { name, email, password, phone, address, city, zipCode, country } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  
  const supabase = getSupabase();
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check existing user
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .single();
  
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  
  const password_hash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  console.log(`📝 [REGISTER] Creating user ${normalizedEmail} with token: ${verificationToken.substring(0, 10)}...`);
  
  const { data: user, error } = await supabase
    .from('users')
    .insert([{
      name,
      email: normalizedEmail,
      password_hash,
      phone,
      address,
      city,
      zip_code: zipCode,
      country,
      role: 'user',
      email_verified: false,
      status: 'approved',
      verification_token: verificationToken,
      verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }])
    .select()
    .single();
  
  if (error) {
    console.error(`📝 [REGISTER] Failed to create user:`, JSON.stringify(error));
    return res.status(500).json({ error: 'Failed to create user' });
  }
  
  console.log(`📝 [REGISTER] User created with ID: ${user.id}`);
  
  // Send verification email
  try {
    const emailResult = await sendVerificationEmail(normalizedEmail, name, verificationToken);
    console.log(`📝 [REGISTER] Email result:`, JSON.stringify(emailResult));
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    // Don't fail registration if email fails
  }
  
  return res.status(201).json({
    message: 'Registration successful! Please check your email to verify your account.',
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}

async function handleGoogleAuth(req: VercelRequest, res: VercelResponse) {
  const { googleToken } = req.body;
  
  if (!googleToken) {
    return res.status(400).json({ error: 'Google token required' });
  }
  
  try {
    // Verify the Google token
    const googleResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`
    );
    
    if (!googleResponse.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    
    const googleData = await googleResponse.json();
    const { email, name, picture, email_verified } = googleData;
    
    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }
    
    const supabase = getSupabase();
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();
    
    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          name: name || email.split('@')[0],
          email: normalizedEmail,
          password_hash: '', // No password for Google users
          role: 'user',
          email_verified: email_verified || true,
          status: 'approved',
          avatar_url: picture,
          google_id: googleData.sub,
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to create Google user:', createError);
        return res.status(500).json({ error: 'Failed to create account' });
      }
      
      user = newUser;
      
      // Send welcome email
      try {
        await sendWelcomeEmail(normalizedEmail, name || email.split('@')[0]);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }
    
    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    // Store refresh token
    await supabase.from('refresh_tokens').insert([{
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: getRefreshTokenExpiry().toISOString(),
    }]);
    
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
        zipCode: user.zip_code,
        country: user.country,
        email_verified: user.email_verified,
        avatar_url: user.avatar_url,
      },
      tokens,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ error: 'Google authentication failed' });
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const supabase = getSupabase();
  const normalizedEmail = email.toLowerCase().trim();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  if (user.status !== 'approved') {
    return res.status(403).json({ error: 'Account not approved' });
  }
  
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  
  // Store refresh token
  await supabase.from('refresh_tokens').insert([{
    user_id: user.id,
    token: tokens.refreshToken,
    expires_at: getRefreshTokenExpiry().toISOString(),
  }]);
  
  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      zipCode: user.zip_code,
      country: user.country,
      email_verified: user.email_verified,
    },
    tokens,
  });
}

async function handleRefresh(req: VercelRequest, res: VercelResponse) {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }
  
  try {
    const payload = verifyRefreshToken(refreshToken);
    const supabase = getSupabase();
    
    // Verify token exists in database
    const { data: storedToken } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .eq('user_id', payload.userId)
      .single();
    
    if (!storedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Delete old token
    await supabase.from('refresh_tokens').delete().eq('token', refreshToken);
    
    // Generate new tokens
    const tokens = generateTokenPair({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });
    
    // Store new refresh token
    await supabase.from('refresh_tokens').insert([{
      user_id: payload.userId,
      token: tokens.refreshToken,
      expires_at: getRefreshTokenExpiry().toISOString(),
    }]);
    
    return res.status(200).json({ tokens });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    const supabase = getSupabase();
    await supabase.from('refresh_tokens').delete().eq('token', refreshToken);
  }
  
  return res.status(200).json({ message: 'Logged out successfully' });
}

async function handleGetMe(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, name, email, role, phone, address, city, zip_code, country, email_verified, created_at')
    .eq('id', user.userId)
    .single();
  
  if (error || !userData) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  return res.status(200).json({
    ...userData,
    zipCode: userData.zip_code,
  });
}

async function handleUpdateProfile(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const { name, phone, address, city, zipCode, country } = req.body;
  const supabase = getSupabase();
  
  const { data: userData, error } = await supabase
    .from('users')
    .update({
      name,
      phone,
      address,
      city,
      zip_code: zipCode,
      country,
    })
    .eq('id', user.userId)
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
  
  return res.status(200).json({
    message: 'Profile updated successfully',
    user: {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      city: userData.city,
      zipCode: userData.zip_code,
      country: userData.country,
    }
  });
}

async function handleChangePassword(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }
  
  const supabase = getSupabase();
  
  const { data: userData } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', user.userId)
    .single();
  
  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const isValid = await bcrypt.compare(currentPassword, userData.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  const newHash = await bcrypt.hash(newPassword, 10);
  await supabase.from('users').update({ password_hash: newHash }).eq('id', user.userId);
  
  return res.status(200).json({ message: 'Password changed successfully' });
}

async function handleForgotPassword(req: VercelRequest, res: VercelResponse) {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  
  const supabase = getSupabase();
  const normalizedEmail = email.toLowerCase().trim();
  
  const { data: user } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('email', normalizedEmail)
    .single();
  
  // Always return success to prevent email enumeration
  if (!user) {
    return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
  }
  
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  
  await supabase.from('users').update({
    reset_token: resetToken,
    reset_token_expires: resetExpires,
  }).eq('id', user.id);
  
  // Send password reset email
  try {
    await sendPasswordResetEmail(user.email, user.name, resetToken);
  } catch (emailError) {
    console.error('Failed to send password reset email:', emailError);
    // Don't fail - still return success to prevent email enumeration
  }
  
  return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
}

async function handleResetPassword(req: VercelRequest, res: VercelResponse) {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password required' });
  }
  
  const supabase = getSupabase();
  
  const { data: user } = await supabase
    .from('users')
    .select('id, reset_token_expires')
    .eq('reset_token', token)
    .single();
  
  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }
  
  if (new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Reset token has expired' });
  }
  
  const newHash = await bcrypt.hash(password, 10);
  
  await supabase.from('users').update({
    password_hash: newHash,
    reset_token: null,
    reset_token_expires: null,
  }).eq('id', user.id);
  
  return res.status(200).json({ message: 'Password reset successfully' });
}

async function handleVerifyEmail(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token as string;
  
  console.log(`📧 [VERIFY-EMAIL] Received token: ${token ? token.substring(0, 10) + '...' : 'NONE'}`);
  
  if (!token) {
    return res.status(400).json({ error: 'Verification token required' });
  }
  
  // Clean the token (remove any whitespace or newlines)
  const cleanToken = token.trim();
  console.log(`📧 [VERIFY-EMAIL] Clean token length: ${cleanToken.length}`);
  
  const supabase = getSupabase();
  
  const { data: user, error: lookupError } = await supabase
    .from('users')
    .select('id, name, email, verification_token, verification_token_expires')
    .eq('verification_token', cleanToken)
    .single();
  
  console.log(`📧 [VERIFY-EMAIL] User lookup result:`, user ? `Found user ${user.email}` : 'No user found');
  if (lookupError) {
    console.log(`📧 [VERIFY-EMAIL] Lookup error:`, JSON.stringify(lookupError));
  }
  
  if (!user) {
    // Try to find any user with a token to debug
    const { data: anyUser } = await supabase
      .from('users')
      .select('email, verification_token')
      .not('verification_token', 'is', null)
      .limit(1);
    
    if (anyUser && anyUser.length > 0) {
      console.log(`📧 [VERIFY-EMAIL] Sample token in DB: ${anyUser[0].verification_token?.substring(0, 10)}... for ${anyUser[0].email}`);
    }
    
    return res.status(400).json({ error: 'Invalid verification token' });
  }
  
  if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Verification token has expired' });
  }
  
  const { error: updateError } = await supabase.from('users').update({
    email_verified: true,
    verification_token: null,
    verification_token_expires: null,
  }).eq('id', user.id);
  
  if (updateError) {
    console.error(`📧 [VERIFY-EMAIL] Update error:`, JSON.stringify(updateError));
    return res.status(500).json({ error: 'Failed to verify email' });
  }
  
  // Send welcome email
  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
  }
  
  console.log(`📧 [VERIFY-EMAIL] Successfully verified ${user.email}`);
  return res.status(200).json({ message: 'Email verified successfully' });
}

// ==================== ORDER HANDLERS ====================

async function handleGetMyOrders(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const filter = req.query.filter as string || 'active';
  const supabase = getSupabase();
  
  let query = supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false });
  
  if (filter === 'active') {
    query = query.in('status', ['submitted', 'in_queue', 'printing', 'on_hold']);
  } else if (filter === 'archived') {
    query = query.in('status', ['finished', 'delivered']);
  } else if (filter === 'deleted') {
    query = query.eq('status', 'deleted');
  }
  
  const { data: orders, error } = await query;
  
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
  
  return res.status(200).json(orders || []);
}

async function handleGetOrder(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const orderId = url.split('/').pop()?.split('?')[0];
  
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID required' });
  }
  
  const supabase = getSupabase();
  
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', user.userId)
    .single();
  
  if (error || !order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  return res.status(200).json(order);
}

async function handleCreateOrder(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const { fileName, fileUrl, material, color, quantity, notes, projectName } = req.body;
  
  if (!fileName || !fileUrl) {
    return res.status(400).json({ error: 'File name and URL required' });
  }
  
  const supabase = getSupabase();
  
  const { data: order, error } = await supabase
    .from('orders')
    .insert([{
      user_id: user.userId,
      file_name: fileName,
      file_url: fileUrl,
      material: material || 'PLA',
      color: color || 'white',
      quantity: quantity || 1,
      notes,
      project_name: projectName,
      status: 'submitted',
      payment_status: 'pending',
    }])
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ error: 'Failed to create order' });
  }
  
  return res.status(201).json(order);
}

async function handleUpdateOrder(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const orderId = url.split('/').pop()?.split('?')[0];
  
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID required' });
  }
  
  const supabase = getSupabase();
  
  // Verify ownership
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('user_id', user.userId)
    .single();
  
  if (!existing) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const { material, color, quantity, notes, projectName, status } = req.body;
  
  const { data: order, error } = await supabase
    .from('orders')
    .update({
      material,
      color,
      quantity,
      notes,
      project_name: projectName,
      status,
    })
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ error: 'Failed to update order' });
  }
  
  return res.status(200).json(order);
}

async function handleDeleteOrder(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const orderId = url.split('/').pop()?.split('?')[0];
  
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID required' });
  }
  
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('orders')
    .update({ status: 'deleted' })
    .eq('id', orderId)
    .eq('user_id', user.userId);
  
  if (error) {
    return res.status(500).json({ error: 'Failed to delete order' });
  }
  
  return res.status(200).json({ message: 'Order deleted successfully' });
}

// ==================== USER HANDLERS ====================

async function handleGetProfile(req: AuthenticatedRequest, res: VercelResponse) {
  return handleGetMe(req, res);
}

async function handleUpdateUserProfile(req: AuthenticatedRequest, res: VercelResponse) {
  return handleUpdateProfile(req, res);
}

// ==================== UPLOAD HANDLERS ====================

async function handleGetPresignedUrl(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const { fileName, contentType } = req.body;
  
  if (!fileName) {
    return res.status(400).json({ error: 'File name required' });
  }
  
  const supabase = getSupabase();
  const bucket = process.env.SUPABASE_BUCKET_TEMP || 'temp-files';
  const filePath = `${user.userId}/${Date.now()}-${fileName}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(filePath);
  
  if (error) {
    return res.status(500).json({ error: 'Failed to create upload URL' });
  }
  
  return res.status(200).json({
    uploadUrl: data.signedUrl,
    filePath,
    bucket,
  });
}

async function handleAnalyzeFile(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  // File analysis would require parsing STL/3MF files
  // For now, return placeholder data
  return res.status(200).json({
    message: 'File analysis not yet implemented in serverless version',
    estimatedPrice: 0,
    volume: 0,
    dimensions: { x: 0, y: 0, z: 0 },
  });
}

// ==================== CREDITS HANDLERS ====================

async function handleGetCreditsBalance(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', user.userId)
    .single();
  
  return res.status(200).json({
    balance: data?.balance || 0,
  });
}

// ==================== CONVERSATIONS HANDLERS ====================

async function handleGetConversations(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user.userId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
  
  return res.status(200).json(conversations || []);
}

async function handleGetMessages(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const parts = url.split('/');
  const conversationId = parts[parts.indexOf('conversations') + 1];
  
  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID required' });
  }
  
  const supabase = getSupabase();
  
  // Verify ownership
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.userId)
    .single();
  
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
  
  return res.status(200).json(messages || []);
}

async function handleSendMessage(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const parts = url.split('/');
  const conversationId = parts[parts.indexOf('conversations') + 1];
  
  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID required' });
  }
  
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Message content required' });
  }
  
  const supabase = getSupabase();
  
  // Verify ownership
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.userId)
    .single();
  
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  const { data: message, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      sender_id: user.userId,
      content,
      sender_type: 'user',
    }])
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
  
  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  
  return res.status(201).json(message);
}
