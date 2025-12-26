import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { IncomingForm, Fields, Files } from 'formidable';

// Type definition for authenticated requests
interface AuthenticatedRequest extends VercelRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Parse multipart form data
const parseFormData = (req: VercelRequest): Promise<{ fields: Fields; files: Files }> => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });
    
    form.parse(req as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

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

// Disable body parser for multipart form data support
export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse JSON body manually when needed
const parseJsonBody = async (req: VercelRequest): Promise<any> => {
  if (req.body) return req.body;
  
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
};

// ==================== CRITICAL HANDLERS - MUST BE BEFORE ROUTER ====================
// These handlers MUST be declared before the router export to avoid "is not defined" errors

async function handleAdminGetOrders(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  // Check if user is admin
  const supabase = getSupabase();
  
  console.log('Admin check - User ID:', user.userId);
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.userId)
    .single();
  
  console.log('Admin check - User data:', userData);
  console.log('Admin check - Error:', userError);
  
  if (userError || userData?.role !== 'admin') {
    console.log('Admin check FAILED - Role:', userData?.role);
    return res.status(403).json({ 
      error: 'Admin access required',
      debug: { userId: user.userId, role: userData?.role, email: userData?.email }
    });
  }
  
  console.log('Admin check PASSED for:', userData.email);
  
  // Get all orders for admin
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
  
  return res.status(200).json({ orders: orders || [] });
}

async function handleAdminGetUsers(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  // Check if user is admin
  const supabase = getSupabase();
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();
  
  if (userError || userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, role, phone, address, city, zip_code, country, email_verified, created_at, status')
    .order('created_at', { ascending: false });
  
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
  
  return res.status(200).json({ users: users || [] });
}

async function handleGetNotifications(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Failed to fetch notifications:', error);
      return res.status(200).json({ notifications: [] }); // Return empty array instead of error
    }
    
    return res.status(200).json({ notifications: notifications || [] });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return res.status(200).json({ notifications: [] }); // Return empty array on error
  }
}

async function handleAdminGetBusinesses(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  // Check admin
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { data: businesses, error } = await supabase
      .from('users')
      .select('*, business_info(*)')
      .not('business_info', 'is', null);
    
    if (error) {
      console.error('Failed to fetch businesses:', error);
      return res.status(200).json({ businesses: [] });
    }
    
    return res.status(200).json({ businesses: businesses || [] });
  } catch (error) {
    console.error('Businesses fetch error:', error);
    return res.status(200).json({ businesses: [] });
  }
}

async function handleAdminGetOrderById(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();
  
  if (userError || userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const url = req.url || '';
  const orderId = url.split('/')[3];
  
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (error || !order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  return res.status(200).json({ order });
}

async function handleAdminUpdateOrderStatus(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();
  
  if (userError || userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const url = req.url || '';
  const orderId = url.split('/')[3];
  const { status, payment_status } = req.body;
  
  const updateData: any = {};
  if (status) updateData.status = status;
  if (payment_status) updateData.payment_status = payment_status;
  
  const { data: order, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ error: 'Failed to update order' });
  }
  
  return res.status(200).json({ message: 'Order status updated', order });
}

async function handleAdminUpdateUserRole(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();
  
  if (userError || userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const url = req.url || '';
  const targetUserId = url.split('/')[3];
  const { role } = req.body;
  
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', targetUserId)
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ error: 'Failed to update user role' });
  }
  
  return res.status(200).json({ message: 'User role updated', user: updatedUser });
}

async function handleAdminGetSettings(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();
  
  if (userError || userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { data: settings, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
  
  return res.status(200).json({ settings: settings || {} });
}

async function handleAdminUpdateSettings(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();
  
  if (userError || userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const updates = req.body;
  
  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .limit(1)
    .single();
  
  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('settings')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: 'Failed to update settings' });
    }
    result = data;
  } else {
    const { data, error } = await supabase
      .from('settings')
      .insert([updates])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: 'Failed to create settings' });
    }
    result = data;
  }
  
  return res.status(200).json({ message: 'Settings updated', settings: result });
}

async function handleAdminGetMaterials(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();
  
  if (userError || userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { data: materials, error } = await supabase
    .from('materials')
    .select('*')
    .order('material_type', { ascending: true });
  
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch materials' });
  }
  
  return res.status(200).json({ materials: materials || [] });
}

async function handleAdminGetPrinters(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();
  
  if (userError || userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { data: printers, error } = await supabase
    .from('printers')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch printers' });
  }
  
  return res.status(200).json({ printers: printers || [] });
}

async function handleAdminGetConversations(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Failed to fetch conversations:', error);
      return res.status(200).json({ conversations: [] });
    }
    
    return res.status(200).json({ conversations: conversations || [] });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    return res.status(200).json({ conversations: [] });
  }
}

async function handleAdminGetConversationMessages(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const conversationId = url.split('/')[3];
  
  const supabase = getSupabase();
  
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { data: messages, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Failed to fetch messages:', error);
      return res.status(200).json({ messages: [] });
    }
    
    return res.status(200).json({ messages: messages || [] });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return res.status(200).json({ messages: [] });
  }
}

async function handleAdminSendMessage(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const conversationId = url.split('/')[3];
  
  const supabase = getSupabase();
  
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { data: message, error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.userId,
        message: req.body.message,
        sender_type: 'admin'
      })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: 'Failed to send message' });
    }
    
    return res.status(200).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}

async function handleAdminUpdateConversationStatus(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const conversationId = url.split('/')[3];
  
  const supabase = getSupabase();
  
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ status: req.body.status })
      .eq('id', conversationId);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to update status' });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
}

async function handleAdminMarkConversationRead(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const conversationId = url.split('/')[3];
  
  const supabase = getSupabase();
  
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ admin_read: true })
      .eq('id', conversationId);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to mark as read' });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: 'Failed to mark as read' });
  }
}

async function handleAdminGetBusinessInvoices(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const userId = url.split('/')[3];
  
  const supabase = getSupabase();
  
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to fetch invoices:', error);
      return res.status(200).json({ invoices: [] });
    }
    
    return res.status(200).json({ invoices: invoices || [] });
  } catch (error) {
    console.error('Invoices fetch error:', error);
    return res.status(200).json({ invoices: [] });
  }
}

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
  const contentType = req.headers['content-type'] || '';
  
  // Parse JSON body for non-multipart requests
  if (req.method !== 'GET' && !contentType.includes('multipart/form-data') && !req.body) {
    req.body = await parseJsonBody(req);
  }
  
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
    if (path.match(/^\/orders\/[^/]+$/) && (req.method === 'PUT' || req.method === 'PATCH')) {
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
    if (path === '/users/notifications' && req.method === 'GET') {
      return await handleGetNotifications(req as AuthenticatedRequest, res);
    }
    
    // Materials routes
    if (path === '/materials/by-type' && req.method === 'GET') {
      return await handleGetMaterialsByType(req, res);
    }
    
    // Printers routes
    if (path === '/printers/default' && req.method === 'GET') {
      return await handleGetDefaultPrinter(req, res);
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
    if (path === '/credits/transactions' && req.method === 'GET') {
      return await handleGetCreditsTransactions(req as AuthenticatedRequest, res);
    }
    if (path === '/credits/add' && req.method === 'POST') {
      console.log('=== CREDITS ADD ENDPOINT HIT ===');
      console.log('Request body:', req.body);
      return await handleAddCredits(req as AuthenticatedRequest, res);
    }
    
    // Conversations routes
    if (path === '/conversations' && req.method === 'GET') {
      return await handleGetConversations(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/order\/[^/]+$/) && req.method === 'POST') {
      return await handleCreateOrderConversation(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/[^/]+\/messages$/) && req.method === 'GET') {
      return await handleGetMessages(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/[^/]+\/messages$/) && req.method === 'POST') {
      return await handleSendMessage(req as AuthenticatedRequest, res);
    }
    
    // Admin routes
    if (path === '/admin/orders' && req.method === 'GET') {
      return await handleAdminGetOrders(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/orders\/[^/]+$/) && req.method === 'GET') {
      return await handleAdminGetOrderById(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/orders\/[^/]+\/status$/) && req.method === 'PATCH') {
      return await handleAdminUpdateOrderStatus(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/users' && req.method === 'GET') {
      return await handleAdminGetUsers(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/users\/[^/]+\/role$/) && req.method === 'PATCH') {
      return await handleAdminUpdateUserRole(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/settings' && req.method === 'GET') {
      return await handleAdminGetSettings(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/settings' && req.method === 'PATCH') {
      return await handleAdminUpdateSettings(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/materials' && req.method === 'GET') {
      return await handleAdminGetMaterials(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/printers' && req.method === 'GET') {
      return await handleAdminGetPrinters(req as AuthenticatedRequest, res);
    }
    
    // Admin conversation routes
    if (path === '/admin/conversations' && req.method === 'GET') {
      return await handleAdminGetConversations(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/conversations\/[^\/]+\/messages$/) && req.method === 'GET') {
      return await handleAdminGetConversationMessages(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/conversations\/[^\/]+\/messages$/) && req.method === 'POST') {
      return await handleAdminSendMessage(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/conversations\/[^\/]+\/status$/) && req.method === 'PATCH') {
      return await handleAdminUpdateConversationStatus(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/conversations\/[^\/]+\/read$/) && req.method === 'PATCH') {
      return await handleAdminMarkConversationRead(req as AuthenticatedRequest, res);
    }
    
    // Admin business routes
    if (path === '/admin/businesses' && req.method === 'GET') {
      return await handleAdminGetBusinesses(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/businesses\/[^\/]+\/invoices$/) && req.method === 'GET') {
      return await handleAdminGetBusinessInvoices(req as AuthenticatedRequest, res);
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
        'GET /api/users/notifications',
        'GET /api/materials/by-type',
        'POST /api/upload/presigned-url',
        'POST /api/upload/analyze',
        'GET /api/credits/balance',
        'GET /api/credits/transactions',
        'POST /api/credits/add',
        'GET /api/conversations',
        'GET /api/conversations/:id/messages',
        'POST /api/conversations/:id/messages',
        'GET /api/admin/orders',
        'GET /api/admin/orders/:id',
        'PATCH /api/admin/orders/:id/status',
        'GET /api/admin/users',
        'PATCH /api/admin/users/:id/role',
        'GET /api/admin/settings',
        'PATCH /api/admin/settings',
        'GET /api/admin/materials',
        'GET /api/admin/printers',
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
    
    const googleData: any = await googleResponse.json();
    const email = typeof googleData.email === 'string' ? googleData.email : undefined;
    const name = typeof googleData.name === 'string' ? googleData.name : undefined;
    const picture = typeof googleData.picture === 'string' ? googleData.picture : undefined;
    const email_verified = typeof googleData.email_verified === 'boolean' ? googleData.email_verified : undefined;
    const googleSub = typeof googleData.sub === 'string' ? googleData.sub : undefined;

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
          email_verified: email_verified ?? true,
          status: 'approved',
          avatar_url: picture,
          google_id: googleSub,
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
    user: {
      ...userData,
      zipCode: userData.zip_code,
    }
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
  
  console.log(`📦 [ORDERS] Fetching orders for user: ${user.userId}, filter: ${filter}`);
  
  // First, get all orders for this user to debug
  const { data: allOrders, error: allError } = await supabase
    .from('orders')
    .select('id, status, created_at')
    .eq('user_id', user.userId);
  
  console.log(`📦 [ORDERS] All orders for user: ${JSON.stringify(allOrders)}, error: ${allError ? JSON.stringify(allError) : 'none'}`);
  
  let query = supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false });
  
  if (filter === 'active') {
    query = query.in('status', ['submitted', 'in_queue', 'printing', 'on_hold', 'suspended']);
  } else if (filter === 'archived') {
    query = query.in('status', ['finished', 'delivered']);
  } else if (filter === 'deleted') {
    query = query.eq('status', 'deleted');
  }
  
  const { data: orders, error } = await query;
  
  console.log(`📦 [ORDERS] Filtered orders: ${orders?.length || 0}, error: ${error ? JSON.stringify(error) : 'none'}`);
  
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
  
  return res.status(200).json({ orders: orders || [] });
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
  
  return res.status(200).json({ order });
}

async function handleCreateOrder(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  // Check if this is a multipart form data request
  const contentType = req.headers['content-type'] || '';
  
  let fileName: string;
  let fileUrl: string;
  let material: string;
  let color: string;
  let quantity: number;
  let notes: string | undefined;
  let projectName: string | undefined;
  let price: number | undefined;
  let shippingMethod: string | undefined;
  let shippingAddress: any;
  let layerHeight: string | undefined;
  let infill: string | undefined;
  let supportType: string | undefined;
  let infillPattern: string | undefined;
  let customLayerHeight: string | undefined;
  let customInfill: string | undefined;
  let advancedMode: boolean | undefined;
  
  if (contentType.includes('multipart/form-data')) {
    // Parse FormData
    try {
      const { fields, files } = await parseFormData(req);
      
      // Get field values (formidable returns arrays)
      const getField = (name: string): string | undefined => {
        const value = fields[name];
        return Array.isArray(value) ? value[0] : value;
      };
      
      material = getField('material') || 'PLA';
      color = getField('color') || 'white';
      quantity = parseInt(getField('quantity') || '1', 10);
      notes = getField('notes');
      projectName = getField('projectName');
      price = parseFloat(getField('price') || '0');
      shippingMethod = getField('shippingMethod');
      layerHeight = getField('layerHeight');
      infill = getField('infill');
      supportType = getField('supportType');
      infillPattern = getField('infillPattern');
      customLayerHeight = getField('customLayerHeight');
      customInfill = getField('customInfill');
      advancedMode = getField('advancedMode') === 'true' || getField('advancedMode') === true;
      
      const shippingAddressStr = getField('shippingAddress');
      if (shippingAddressStr) {
        try {
          shippingAddress = JSON.parse(shippingAddressStr);
        } catch (e) {
          shippingAddress = shippingAddressStr;
        }
      }
      
      // Handle file upload
      const uploadedFile = files.file;
      const fileData = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
      
      if (!fileData) {
        return res.status(400).json({ error: 'File is required' });
      }
      
      fileName = fileData.originalFilename || 'unknown.stl';
      
      // Upload file to Supabase storage
      const fs = await import('fs');
      const fileBuffer = fs.readFileSync(fileData.filepath);
      const bucket = process.env.SUPABASE_BUCKET || 'print-jobs';
      const filePath = `${user.userId}/${Date.now()}-${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType: fileData.mimetype || 'application/octet-stream',
        });
      
      if (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload file' });
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
      
      // Clean up temp file
      fs.unlinkSync(fileData.filepath);
      
    } catch (parseError) {
      console.error('FormData parse error:', parseError);
      return res.status(400).json({ error: 'Failed to parse form data' });
    }
  } else {
    // Handle JSON body
    const body = req.body || {};
    fileName = body.fileName;
    fileUrl = body.fileUrl;
    material = body.material || 'PLA';
    color = body.color || 'white';
    quantity = body.quantity || 1;
    notes = body.notes;
    projectName = body.projectName;
    price = body.price;
    shippingMethod = body.shippingMethod;
    shippingAddress = body.shippingAddress;
    layerHeight = body.layerHeight;
    infill = body.infill;
    supportType = body.supportType;
    infillPattern = body.infillPattern;
    customLayerHeight = body.customLayerHeight;
    customInfill = body.customInfill;
    advancedMode = body.advancedMode;
    
    if (!fileName || !fileUrl) {
      return res.status(400).json({ error: 'File name and URL required' });
    }
  }
  
  // Build order object with only valid columns
  const orderData: any = {
    user_id: user.userId,
    file_name: fileName,
    file_url: fileUrl,
    material: material || 'PLA',
    color: color || 'white',
    quantity: quantity || 1,
    price: price || 0,
    shipping_method: shippingMethod || 'pickup',
    layer_height: parseFloat(layerHeight || '0.2'),
    infill: parseInt(infill || '20', 10),
    status: 'submitted',
  };
  
  // Add advanced mode parameters if provided
  if (supportType !== undefined && supportType !== null && supportType !== '') {
    orderData.support_type = supportType;
  }
  if (infillPattern !== undefined && infillPattern !== null && infillPattern !== '') {
    orderData.infill_pattern = infillPattern;
  }
  if (customLayerHeight !== undefined && customLayerHeight !== null && customLayerHeight !== '') {
    orderData.custom_layer_height = parseFloat(customLayerHeight);
  }
  if (customInfill !== undefined && customInfill !== null && customInfill !== '') {
    orderData.custom_infill = parseInt(customInfill, 10);
  }
  if (advancedMode !== undefined) {
    orderData.advanced_mode = advancedMode;
  }
  
  // Add optional fields if provided
  if (notes) orderData.notes = notes;
  if (projectName) orderData.project_name = projectName;
  if (shippingAddress) orderData.shipping_address = shippingAddress;
  
  console.log(`📦 [ORDER-CREATE] Creating order for user: ${user.userId}`, JSON.stringify(orderData));
  
  const { data: order, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();
  
  if (error) {
    console.error('📦 [ORDER-CREATE] Error:', JSON.stringify(error));
    return res.status(500).json({ error: 'Failed to create order' });
  }
  
  console.log(`📦 [ORDER-CREATE] Success! Order ID: ${order?.id}`);
  return res.status(201).json(order);
}

async function handleUpdateOrder(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const orderId = url.split('/').pop()?.split('?')[0];
  
  console.log('=== HANDLE UPDATE ORDER CALLED ===');
  console.log('Order ID:', orderId);
  console.log('User ID:', user.userId);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  
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
  
  // Get the current order data to check for refund
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  // Extract all possible fields from request body
  const updateData: any = {};
  const allowedFields = [
    'material', 'color', 'quantity', 'notes', 'project_name', 'status',
    'payment_status', 'price', 'layer_height', 'infill', 'quality',
    'support_type', 'infill_pattern', 'custom_layer_height', 'custom_infill',
    'advanced_mode', 'shipping_method', 'tracking_number', 'estimated_delivery',
    'refund_method', 'refund_amount', 'refund_reason', 'refund_bank_details'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      // Handle snake_case conversion for camelCase fields
      const dbField = field === 'projectName' ? 'project_name' : field;
      updateData[dbField] = req.body[field];
    }
  }
  
  const { data: order, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) {
    console.error('Order update error:', error);
    console.error('Update data:', updateData);
    console.error('Order ID:', orderId);
    return res.status(500).json({ 
      error: 'Failed to update order',
      details: error.message,
      hint: error.hint
    });
  }

  // If this is a store credit refund, add credits to user's wallet
  console.log('=== CHECKING CREDIT REFUND CONDITIONS ===');
  console.log('refund_method:', req.body.refund_method);
  console.log('refund_amount (raw):', req.body.refund_amount);
  console.log('refund_amount (type):', typeof req.body.refund_amount);
  console.log('currentOrder exists:', !!currentOrder);
  
  if (req.body.refund_method === 'credit' && req.body.refund_amount && currentOrder) {
    try {
      const refundAmount = parseFloat(req.body.refund_amount);
      
      console.log('=== STORE CREDIT REFUND DETECTED ===');
      console.log('User ID:', user.userId);
      console.log('Refund Amount (parsed):', refundAmount);
      console.log('Order ID:', orderId);
      
      if (refundAmount > 0) {
        // Get current credit balance
        const { data: creditData, error: fetchError } = await supabase
          .from('credits')
          .select('balance')
          .eq('user_id', user.userId)
          .single();

        console.log('Current credit data:', creditData);
        console.log('Fetch error:', fetchError);

        const currentBalance = creditData?.balance || 0;
        const newBalance = currentBalance + refundAmount;

        console.log('Current Balance:', currentBalance);
        console.log('New Balance:', newBalance);

        // Update or insert credit balance
        let creditError = null;
        if (creditData) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('credits')
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.userId);
          creditError = updateError;
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('credits')
            .insert({
              user_id: user.userId,
              balance: newBalance,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          creditError = insertError;
        }

        console.log('Credit operation error:', creditError);

        if (creditError) {
          console.error('Credit update error:', creditError);
        } else {
          // Record the transaction
          const { data: txData, error: txError } = await supabase
            .from('credits_transactions')
            .insert({
              user_id: user.userId,
              amount: refundAmount,
              type: 'refund',
              description: `Refund for order ${currentOrder.order_number || orderId}`,
              balance_after: newBalance,
            })
            .select();
          
          console.log('Transaction record result:', txData);
          console.log('Transaction error:', txError);
          
          console.log(`✅ Added ${refundAmount} PLN store credit for user ${user.userId}`);
        }
      } else {
        console.log('❌ Refund amount is 0 or negative:', refundAmount);
      }
    } catch (creditError) {
      console.error('Failed to add store credit:', creditError);
      // Don't fail the order update if credit addition fails
    }
  } else {
    console.log('Store credit refund NOT triggered:');
    console.log('- refund_method:', req.body.refund_method);
    console.log('- refund_amount:', req.body.refund_amount);
    console.log('- currentOrder exists:', !!currentOrder);
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

async function handleGetCreditsTransactions(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('credits_transactions')
    .select('*')
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('Failed to fetch transactions:', error);
    return res.status(200).json({ transactions: [] });
  }
  
  return res.status(200).json({
    transactions: data || [],
  });
}

async function handleAddCredits(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const { amount, type, description } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  const supabase = getSupabase();
  
  try {
    // Get current balance
    const { data: creditData } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.userId)
      .single();
    
    const currentBalance = creditData?.balance || 0;
    const newBalance = currentBalance + parseFloat(amount);
    
    // Update balance
    const { error: upsertError } = await supabase
      .from('credits')
      .upsert({
        user_id: user.userId,
        balance: newBalance,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });
    
    if (upsertError) {
      console.error('Failed to update credits:', upsertError);
      return res.status(500).json({ error: 'Failed to add credits' });
    }
    
    // Record transaction
    await supabase
      .from('credits_transactions')
      .insert({
        user_id: user.userId,
        amount: parseFloat(amount),
        type: type || 'credit',
        description: description || 'Credits added',
        balance_after: newBalance,
      });
    
    return res.status(200).json({
      success: true,
      balance: newBalance,
    });
  } catch (error) {
    console.error('Add credits error:', error);
    return res.status(500).json({ error: 'Failed to add credits' });
  }
}

// ==================== CONVERSATIONS HANDLERS ====================

async function handleCreateOrderConversation(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const url = req.url || '';
  const orderId = url.split('/').pop()?.split('?')[0];

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID required' });
  }

  const supabase = getSupabase();

  // Verify order ownership
  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('id', orderId)
    .eq('user_id', user.userId)
    .single();

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Check if conversation already exists for this order
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('order_id', orderId)
    .eq('user_id', user.userId)
    .single();

  if (existingConversation) {
    return res.status(200).json({ conversation: existingConversation });
  }

  // Create new conversation
  const { subject } = req.body || {};
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      order_id: orderId,
      user_id: user.userId,
      subject: subject || `Conversation for order ${orderId.slice(0, 8)}`,
      status: 'open'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }

  return res.status(201).json({ conversation });
}

async function handleGetConversations(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      *,
      order:orders!conversations_order_id_fkey(
        id,
        file_name,
        project_name,
        status
      )
    `)
    .eq('user_id', user.userId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
  
  return res.status(200).json({ conversations: conversations || [] });
}

async function handleGetMessages(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const parts = url.split('/');
  const conversationId = parts[parts.indexOf('conversations') + 1];
  
  console.log('[MESSAGES] Fetching for conversation:', conversationId, 'user:', user.userId);
  
  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID required' });
  }
  
  const supabase = getSupabase();
  
  try {
    // Verify ownership - use maybeSingle() to avoid throwing on no rows
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.userId)
      .maybeSingle();
    
    if (convError) {
      console.error('[MESSAGES] Conversation verification error:', convError);
      return res.status(500).json({ error: 'Failed to verify conversation', details: convError.message });
    }
    
    if (!conversation) {
      console.error('[MESSAGES] Conversation not found or unauthorized');
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const { data: messages, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('[MESSAGES] Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }
    
    console.log('[MESSAGES] Found', messages?.length || 0, 'messages');
    return res.status(200).json({ messages: messages || [] });
  } catch (error: any) {
    console.error('[MESSAGES] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

async function handleSendMessage(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const parts = url.split('/');
  const conversationId = parts[parts.indexOf('conversations') + 1];
  
  console.log('[SEND_MESSAGE] User:', user.userId, 'Conversation:', conversationId);
  
  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID required' });
  }
  
  const { content, message: messageText } = req.body;
  const messageContent = content || messageText;
  
  console.log('[SEND_MESSAGE] Request body:', req.body);
  
  if (!messageContent) {
    return res.status(400).json({ error: 'Message content required' });
  }
  
  const supabase = getSupabase();
  
  try {
    // Verify ownership - use maybeSingle() to avoid throwing on no rows
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.userId)
      .maybeSingle();
    
    if (convError) {
      console.error('[SEND_MESSAGE] Conversation verification error:', convError);
      return res.status(500).json({ error: 'Failed to verify conversation' });
    }
    
    if (!conversation) {
      console.error('[SEND_MESSAGE] Conversation not found');
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const messageData = {
      conversation_id: conversationId,
      sender_id: user.userId,
      message: messageContent,
      sender_type: 'user',
    };
    
    console.log('[SEND_MESSAGE] Inserting message:', messageData);
    
    const { data: message, error } = await supabase
      .from('conversation_messages')
      .insert([messageData])
      .select()
      .single();
    
    if (error) {
      console.error('[SEND_MESSAGE] Insert error:', error);
      return res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
    
    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    
    console.log('[SEND_MESSAGE] Message sent successfully:', message);
    return res.status(201).json({ message });
  } catch (error: any) {
    console.error('[SEND_MESSAGE] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }

// ==================== ADMIN HANDLERS ====================
// Note: All admin handlers are defined at the top of the file (before the router) to avoid "is not defined" errors

async function handleGetMaterialsByType(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();
  
  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .order('material_type', { ascending: true })
      .order('color', { ascending: true });
    
    if (error) {
      console.error('Failed to fetch materials:', error);
      return res.status(200).json({ materials: {} }); // Return empty object
    }
    
    if (!materials || materials.length === 0) {
      return res.status(200).json({ materials: {} });
    }
    
    // Group materials by type
    const grouped = materials.reduce((acc: any, material: any) => {
      const type = material.material_type || 'Other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(material);
      return acc;
    }, {});
    
    return res.status(200).json({ materials: grouped });
  } catch (error) {
    console.error('Materials fetch error:', error);
    return res.status(200).json({ materials: {} }); // Return empty object on error
  }
}

async function handleGetDefaultPrinter(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();
  
  try {
    const { data: printer, error } = await supabase
      .from('printers')
      .select('*')
      .eq('is_default', true)
      .single();
    
    if (error || !printer) {
      console.error('Failed to fetch default printer:', error);
      // Return a basic default printer spec
      return res.status(200).json({ 
        printer: {
          name: 'Default Printer',
          max_x: 220,
          max_y: 220,
          max_z: 250,
          is_default: true
        }
      });
    }
    
    return res.status(200).json({ printer });
  } catch (error) {
    console.error('Default printer fetch error:', error);
    return res.status(200).json({ 
      printer: {
        name: 'Default Printer',
        max_x: 220,
        max_y: 220,
        max_z: 250,
        is_default: true
      }
    });
  }
}
