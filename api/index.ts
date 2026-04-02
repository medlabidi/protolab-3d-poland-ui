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
let generateAIResponse: any;
let buildGeminiHistory: any;
let buildDesignContext: any;
let generateOpenSCADCode: any;
let parseParameters: any;
let applyParameterChanges: any;

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
  if (!generateAIResponse) {
    try {
      const geminiModule = await import('./_lib/gemini');
      generateAIResponse = geminiModule.generateAIResponse;
      buildGeminiHistory = geminiModule.buildGeminiHistory;
      buildDesignContext = geminiModule.buildDesignContext;
    } catch (e) {
      console.warn('[AI_AGENT] Gemini module not available:', e);
    }
  }
  if (!generateOpenSCADCode) {
    try {
      const openscadModule = await import('./_lib/openscad-generator');
      generateOpenSCADCode = openscadModule.generateOpenSCADCode;
      parseParameters = openscadModule.parseParameters;
      applyParameterChanges = openscadModule.applyParameterChanges;
    } catch (e) {
      console.warn('[OPENSCAD] Module not available:', e);
    }
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
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();
  
  if (userError || userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // Get filter type from query parameter
  const orderType = req.query?.type as string | undefined;
  
  // Build query
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  // Filter by order_type if specified
  if (orderType === 'print') {
    query = query.neq('order_type', 'design');
  } else if (orderType === 'design') {
    query = query.eq('order_type', 'design');
  }

  const { data: orders, error } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }

  // Fetch user data separately (no FK join dependency)
  const orderList = orders || [];
  const userIds = [...new Set(orderList.map((o: any) => o.user_id).filter(Boolean))];
  let userMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, first_name, last_name, email')
      .in('id', userIds);
    if (users) {
      users.forEach((u: any) => { userMap[u.id] = u; });
    }
  }
  const enrichedOrders = orderList.map((o: any) => ({ ...o, users: userMap[o.user_id] || null }));

  return res.status(200).json({ orders: enrichedOrders });
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

async function handleMarkNotificationRead(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  const path = (req.query?.path as string) || req.url || '';
  const notificationId = path.split('/')[3]; // /users/notifications/:id/read
  
  if (!notificationId) {
    return res.status(400).json({ error: 'Notification ID is required' });
  }
  
  try {
    // First verify the notification belongs to the user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', user.userId)
      .single();
    
    if (fetchError || !notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Mark as read
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.userId);
    
    if (updateError) {
      console.error('Failed to mark notification as read:', updateError);
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
    
    // Enhance with order stats for each business
    const businessesWithStats = await Promise.all((businesses || []).map(async (business: any) => {
      const { data: orders } = await supabase
        .from('orders')
        .select('price, paid_amount')
        .eq('user_id', business.id);
      
      const orderCount = orders?.length || 0;
      const totalSpent = orders?.reduce((sum: number, o: any) => 
        sum + (parseFloat(o.paid_amount) || parseFloat(o.price) || 0), 0
      ) || 0;
      
      return {
        ...business,
        orderCount,
        totalSpent
      };
    }));
    
    return res.status(200).json({ businesses: businessesWithStats });
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
  const path = url.split('?')[0].replace('/api', '');
  const orderId = path.split('/')[3]; // /admin/orders/:id
  
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
  console.log('[UPDATE_STATUS] Function called');
  
  const user = requireAuth(req, res);
  if (!user) return;
  
  const supabase = getSupabase();
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.userId)
    .single();
  
  if (userError || userData?.role !== 'admin') {
    console.log('[UPDATE_STATUS] Admin check failed:', { userError, role: userData?.role });
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const orderId = path.split('/')[3]; // /admin/orders/:id/status -> index 3
  const { status, payment_status } = req.body;
  
  console.log('[UPDATE_STATUS] Extracted data:', { url, path, orderId, status, payment_status });
  
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }
  
  // First get the order details to get user_id and file_name
  const { data: existingOrder, error: fetchError } = await supabase
    .from('orders')
    .select('user_id, file_name, status')
    .eq('id', orderId)
    .single();
  
  console.log('[UPDATE_STATUS] Fetch existing order result:', { 
    existingOrder, 
    fetchError: fetchError?.message,
    orderId 
  });
  
  if (fetchError || !existingOrder) {
    console.log('[UPDATE_STATUS] Order not found, returning 404');
    return res.status(404).json({ error: 'Order not found' });
  }
  
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
  
  // Create notification for user when status changes
  if (status && status !== existingOrder.status && existingOrder.user_id) {
    const statusMessages: Record<string, string> = {
      'submitted': 'Your print job has been submitted',
      'in_queue': 'Your print job is now in the printing queue',
      'printing': 'Your print job is now being printed',
      'finished': 'Your print job has been completed',
      'delivered': 'Your print job has been delivered',
      'on_hold': 'Your print job has been placed on hold',
      'suspended': 'Your print job has been suspended'
    };
    
    const notification = {
      user_id: existingOrder.user_id,
      type: 'order_status_change',
      title: 'Print Job Status Update',
      message: statusMessages[status] || `Your print job status changed to ${status.replace('_', ' ')}`,
      data: {
        orderId: orderId,
        newStatus: status,
        fileName: existingOrder.file_name
      },
      read: false,
      created_at: new Date().toISOString()
    };
    
    // Insert notification (don't block on error)
    supabase.from('notifications').insert(notification).then(({ error }) => {
      if (error) {
        console.error('Failed to create notification:', error);
      }
    });
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
  const path = url.split('?')[0].replace('/api', '');
  const targetUserId = path.split('/')[3]; // /admin/users/:id/role
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
    console.error('Error fetching materials:', error);
    return res.status(500).json({ error: 'Failed to fetch materials', details: error.message, hint: error.hint, code: error.code });
  }
  
  console.log('Materials fetched successfully:', materials?.length || 0);
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

async function handleAdminCreateMaterial(req: AuthenticatedRequest, res: VercelResponse) {
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
  
  // Extract only the fields that exist in the database
  const { material_type, color, hex_color, price_per_kg, stock_status, supplier, description, is_active } = req.body;
  
  const materialData = {
    material_type,
    color,
    hex_color,
    price_per_kg,
    stock_status,
    supplier,
    description,
    is_active
  };
  
  const { data: material, error } = await supabase
    .from('materials')
    .insert([materialData])
    .select()
    .single();
  
  if (error) {
    console.error('Create material error:', error);
    return res.status(500).json({ error: 'Failed to create material', details: error.message });
  }
  
  return res.status(201).json({ material });
}

async function handleAdminUpdateMaterial(req: AuthenticatedRequest, res: VercelResponse) {
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
  
  const { id, ...updates } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Material ID is required' });
  }
  
  // Remove stock_quantity if it exists (column doesn't exist in DB)
  const { stock_quantity, ...filteredUpdates } = updates;
  
  const { data: material, error } = await supabase
    .from('materials')
    .update(filteredUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ error: 'Failed to update material', details: error.message });
  }
  
  return res.status(200).json({ material });
}

async function handleAdminDeleteMaterial(req: AuthenticatedRequest, res: VercelResponse) {
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
  
  const materialId = req.query.id;
  
  if (!materialId) {
    return res.status(400).json({ error: 'Material ID is required' });
  }
  
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId);
  
  if (error) {
    return res.status(500).json({ error: 'Failed to delete material', details: error.message });
  }
  
  return res.status(200).json({ success: true });
}

// Material Types handlers
async function handleAdminGetMaterialTypes(req: AuthenticatedRequest, res: VercelResponse) {
  try {
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
    
    const { data: materialTypes, error } = await supabase
      .from('material_types')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching material types:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch material types', 
        details: error.message,
        hint: 'The material_types table may not exist. Please run the SQL migration.'
      });
    }
    
    return res.status(200).json({ materialTypes: materialTypes || [] });
  } catch (error) {
    console.error('Unexpected error in handleAdminGetMaterialTypes:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleAdminCreateMaterialType(req: AuthenticatedRequest, res: VercelResponse) {
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
  
  const { name, description } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Material type name is required' });
  }
  
  const { data: materialType, error } = await supabase
    .from('material_types')
    .insert([{ 
      name: name.trim(), 
      description: description || null,
      is_active: true 
    }])
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Material type already exists' });
    }
    return res.status(500).json({ error: 'Failed to create material type', details: error.message });
  }
  
  return res.status(201).json({ materialType });
}

async function handleAdminUpdateMaterialType(req: AuthenticatedRequest, res: VercelResponse) {
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
  
  const materialTypeId = req.query.id;
  
  if (!materialTypeId) {
    return res.status(400).json({ error: 'Material type ID is required' });
  }
  
  const { name, description, is_active } = req.body;
  
  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description;
  if (is_active !== undefined) updateData.is_active = is_active;
  
  const { data: materialType, error } = await supabase
    .from('material_types')
    .update(updateData)
    .eq('id', materialTypeId)
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Material type name already exists' });
    }
    return res.status(500).json({ error: 'Failed to update material type', details: error.message });
  }
  
  return res.status(200).json({ materialType });
}

async function handleAdminDeleteMaterialType(req: AuthenticatedRequest, res: VercelResponse) {
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
  
  const materialTypeId = req.query.id;
  
  if (!materialTypeId) {
    return res.status(400).json({ error: 'Material type ID is required' });
  }
  
  // Check if any materials are using this type
  const { data: materials, error: checkError } = await supabase
    .from('materials')
    .select('id')
    .eq('material_type_id', materialTypeId)
    .limit(1);
  
  if (checkError) {
    return res.status(500).json({ error: 'Failed to check material type usage', details: checkError.message });
  }
  
  if (materials && materials.length > 0) {
    return res.status(409).json({ error: 'Cannot delete material type that is in use by materials' });
  }
  
  const { error } = await supabase
    .from('material_types')
    .delete()
    .eq('id', materialTypeId);
  
  if (error) {
    return res.status(500).json({ error: 'Failed to delete material type', details: error.message });
  }
  
  return res.status(200).json({ success: true });
}

// Suppliers handlers
async function handleAdminGetSuppliers(req: AuthenticatedRequest, res: VercelResponse) {
  try {
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
    
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching suppliers:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch suppliers', 
        details: error.message 
      });
    }
    
    // Ensure materials_supplied are integers, not strings
    const suppliersWithIntegers = (suppliers || []).map(supplier => ({
      ...supplier,
      materials_supplied: Array.isArray(supplier.materials_supplied)
        ? supplier.materials_supplied.map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id)
        : []
    }));
    
    return res.status(200).json({ suppliers: suppliersWithIntegers });
  } catch (error) {
    console.error('Unexpected error in handleAdminGetSuppliers:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleAdminCreateSupplier(req: AuthenticatedRequest, res: VercelResponse) {
  try {
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
    
    const { 
      name, 
      contact_name, 
      email, 
      phone, 
      address, 
      city, 
      postal_code, 
      country, 
      website, 
      materials_supplied, 
      delivery_time, 
      notes, 
      active 
    } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    console.log('Creating supplier with data:', { name, email, materials_supplied });
    
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert([{ 
        name: name.trim(),
        contact_name: contact_name || null,
        email: email.trim(),
        phone: phone || null,
        address: address || null,
        city: city || null,
        postal_code: postal_code || null,
        country: country || null,
        website: website || null,
        materials_supplied: materials_supplied || [],
        delivery_time: delivery_time || null,
        notes: notes || null,
        total_orders: 0,
        active: active !== false
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating supplier:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Supplier already exists' });
      }
      if (error.code === '42P01') {
        return res.status(500).json({ 
          error: 'Suppliers table does not exist. Please run the SQL migration.', 
          details: error.message 
        });
      }
      return res.status(500).json({ error: 'Failed to create supplier', details: error.message });
    }
    
    console.log('Supplier created successfully:', supplier);
    return res.status(201).json({ supplier });
  } catch (error) {
    console.error('Unexpected error in handleAdminCreateSupplier:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleAdminUpdateSupplier(req: AuthenticatedRequest, res: VercelResponse) {
  try {
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
    
    const supplierId = req.query.id;
    
    if (!supplierId) {
      return res.status(400).json({ error: 'Supplier ID is required' });
    }
    
    const { 
      name, 
      contact_name, 
      email, 
      phone, 
      address, 
      city, 
      postal_code, 
      country, 
      website, 
      materials_supplied, 
      delivery_time, 
      notes, 
      active 
    } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (contact_name !== undefined) updateData.contact_name = contact_name;
    if (email !== undefined) updateData.email = email.trim();
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (country !== undefined) updateData.country = country;
    if (website !== undefined) updateData.website = website;
    if (materials_supplied !== undefined) updateData.materials_supplied = materials_supplied;
    if (delivery_time !== undefined) updateData.delivery_time = delivery_time;
    if (notes !== undefined) updateData.notes = notes;
    if (active !== undefined) updateData.active = active;
    
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', supplierId)
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Supplier name already exists' });
      }
      return res.status(500).json({ error: 'Failed to update supplier', details: error.message });
    }
    
    return res.status(200).json({ supplier });
  } catch (error) {
    console.error('Unexpected error in handleAdminUpdateSupplier:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleAdminDeleteSupplier(req: AuthenticatedRequest, res: VercelResponse) {
  try {
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
    
    const supplierId = req.query.id;
    
    if (!supplierId) {
      return res.status(400).json({ error: 'Supplier ID is required' });
    }
    
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to delete supplier', details: error.message });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Unexpected error in handleAdminDeleteSupplier:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Maintenances handlers
async function handleAdminGetMaintenances(req: AuthenticatedRequest, res: VercelResponse) {
  try {
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
    
    const { data: maintenances, error } = await supabase
      .from('maintenances')
      .select('*')
      .order('scheduled_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching maintenances:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch maintenances', 
        details: error.message 
      });
    }
    
    return res.status(200).json({ maintenances: maintenances || [] });
  } catch (error) {
    console.error('Unexpected error in handleAdminGetMaintenances:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleAdminCreateMaintenance(req: AuthenticatedRequest, res: VercelResponse) {
  try {
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
    
    const { 
      printer_id, 
      type, 
      description, 
      cost, 
      scheduled_date, 
      notes,
      status = 'scheduled'
    } = req.body;
    
    if (!printer_id || !type || !description || !scheduled_date) {
      return res.status(400).json({ error: 'Printer ID, type, description, and scheduled date are required' });
    }
    
    const { data: maintenance, error } = await supabase
      .from('maintenances')
      .insert([{ 
        printer_id,
        type,
        description,
        cost: cost || 0,
        scheduled_date,
        notes: notes || null,
        status
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating maintenance:', error);
      return res.status(500).json({ error: 'Failed to create maintenance', details: error.message });
    }
    
    return res.status(201).json({ maintenance });
  } catch (error) {
    console.error('Unexpected error in handleAdminCreateMaintenance:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleAdminUpdateMaintenance(req: AuthenticatedRequest, res: VercelResponse) {
  try {
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
    
    const maintenanceId = req.query.id;
    
    if (!maintenanceId) {
      return res.status(400).json({ error: 'Maintenance ID is required' });
    }
    
    const { data: maintenance, error } = await supabase
      .from('maintenances')
      .update(req.body)
      .eq('id', maintenanceId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating maintenance:', error);
      return res.status(500).json({ error: 'Failed to update maintenance', details: error.message });
    }
    
    return res.status(200).json({ maintenance });
  } catch (error) {
    console.error('Unexpected error in handleAdminUpdateMaintenance:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleAdminDeleteMaintenance(req: AuthenticatedRequest, res: VercelResponse) {
  try {
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
    
    const maintenanceId = req.query.id;
    
    if (!maintenanceId) {
      return res.status(400).json({ error: 'Maintenance ID is required' });
    }
    
    const { error } = await supabase
      .from('maintenances')
      .delete()
      .eq('id', maintenanceId);
    
    if (error) {
      console.error('Error deleting maintenance:', error);
      return res.status(500).json({ error: 'Failed to delete maintenance', details: error.message });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Unexpected error in handleAdminDeleteMaintenance:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleAdminCreatePrinter(req: AuthenticatedRequest, res: VercelResponse) {
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
  
  console.log('Creating printer with data:', req.body);
  
  const { data: printer, error } = await supabase
    .from('printers')
    .insert([req.body])
    .select()
    .single();
  
  if (error) {
    console.error('Printer creation error:', error);
    return res.status(500).json({ error: 'Failed to create printer', details: error.message, hint: error.hint });
  }
  
  return res.status(201).json({ printer });
}

async function handleAdminUpdatePrinter(req: AuthenticatedRequest, res: VercelResponse) {
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
  
  const { id, ...updates } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Printer ID is required' });
  }
  
  // Count total printers
  const { count: totalPrinters } = await supabase
    .from('printers')
    .select('*', { count: 'exact', head: true });
  
  console.log('[PRINTER_UPDATE] Total printers:', totalPrinters);
  console.log('[PRINTER_UPDATE] Updates:', updates);
  
  // If only one printer, it MUST be default - force it
  if (totalPrinters === 1) {
    console.log('[PRINTER_UPDATE] Only one printer - forcing is_default=true');
    updates.is_default = true;
  }
  
  // If setting as default, unset all other printers first
  if (updates.is_default === true && totalPrinters > 1) {
    console.log('[PRINTER_UPDATE] Setting as default - unsetting others');
    const { error: unsetError } = await supabase
      .from('printers')
      .update({ is_default: false })
      .neq('id', id);
    
    if (unsetError) {
      console.error('[PRINTER_UPDATE] Error unsetting other default printers:', unsetError);
    }
  }
  
  // If trying to unset default on the only printer, reject it
  if (updates.is_default === false && totalPrinters === 1) {
    return res.status(400).json({ 
      error: 'Cannot unset default on the only printer',
      message: 'At least one printer must be set as default for pricing calculations'
    });
  }
  
  // If unsetting default and multiple printers exist, ensure another one becomes default
  if (updates.is_default === false && totalPrinters > 1) {
    const { data: otherDefault } = await supabase
      .from('printers')
      .select('id')
      .eq('is_default', true)
      .neq('id', id)
      .limit(1)
      .single();
    
    if (!otherDefault) {
      // No other default exists, find first active printer and make it default
      const { data: firstActive } = await supabase
        .from('printers')
        .select('id')
        .eq('is_active', true)
        .neq('id', id)
        .limit(1)
        .single();
      
      if (firstActive) {
        console.log('[PRINTER_UPDATE] Making another printer default:', firstActive.id);
        await supabase
          .from('printers')
          .update({ is_default: true })
          .eq('id', firstActive.id);
      }
    }
  }
  
  const { data: printer, error } = await supabase
    .from('printers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('[PRINTER_UPDATE] Error updating printer:', error);
    return res.status(500).json({ error: 'Failed to update printer', details: error.message });
  }
  
  console.log('[PRINTER_UPDATE] Successfully updated printer:', printer.id);
  return res.status(200).json({ printer });
}

async function handleAdminDeletePrinter(req: AuthenticatedRequest, res: VercelResponse) {
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
  
  const printerId = req.query.id;
  
  if (!printerId) {
    return res.status(400).json({ error: 'Printer ID is required' });
  }
  
  const { error } = await supabase
    .from('printers')
    .delete()
    .eq('id', printerId);
  
  if (error) {
    return res.status(500).json({ error: 'Failed to delete printer', details: error.message });
  }
  
  return res.status(200).json({ success: true });
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
      .select(`
        *,
        users (
          id,
          name,
          email
        ),
        orders (
          id,
          file_name
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch conversations:', error);
      return res.status(200).json({ conversations: [] });
    }

    // Check which conversations have admin_error messages
    const convIds = (conversations || []).map((c: any) => c.id);
    let errorConvIds = new Set<string>();
    if (convIds.length > 0) {
      const { data: errorMsgs } = await supabase
        .from('conversation_messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .contains('attachments', [{ type: 'admin_error' }]);
      if (errorMsgs) {
        errorConvIds = new Set(errorMsgs.map((m: any) => m.conversation_id));
      }
    }

    // Attach has_error flag to each conversation
    const enriched = (conversations || []).map((c: any) => ({
      ...c,
      has_error: errorConvIds.has(c.id),
    }));

    return res.status(200).json({ conversations: enriched });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    return res.status(200).json({ conversations: [] });
  }
}

async function handleAdminGetConversationMessages(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const conversationId = path.split('/')[3]; // /admin/conversations/:id/messages
  
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
  const urlPath = url.split('?')[0].replace('/api', '');
  const conversationId = urlPath.split('/')[3]; // /admin/conversations/:id/messages

  console.log('[ADMIN_SEND_MESSAGE] Start:', { conversationId, contentType: req.headers['content-type'] });

  const supabase = getSupabase();

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    // Get current conversation status and order_id (needed for auto-status change)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('status, order_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (convError) {
      console.error('[ADMIN_SEND_MESSAGE] Conversation query error:', convError);
    }

    const contentType = req.headers['content-type'] || '';
    let messageContent: string;
    let attachments: any[] = [];

    // Check if multipart (has files)
    if (contentType.includes('multipart/form-data')) {
      console.log('[ADMIN_SEND_MESSAGE] Parsing multipart form data...');
      const { fields, files } = await parseFormData(req);
      console.log('[ADMIN_SEND_MESSAGE] Form parsed. Fields:', Object.keys(fields), 'Files:', Object.keys(files));

      const getField = (name: string): string | undefined => {
        const value = fields[name];
        return Array.isArray(value) ? value[0] : value;
      };

      messageContent = getField('message') || '';

      // Handle file attachments - accept both 'attachments' and 'file' keys
      const uploadedFiles = files.attachments || files.file;
      if (uploadedFiles) {
        const fileArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
        console.log('[ADMIN_SEND_MESSAGE] Processing', fileArray.length, 'files');

        for (const file of fileArray) {
          if (!file || !file.filepath) continue;

          const fsModule = await import('fs/promises');
          const pathModule = await import('path');

          // Read file and upload to Supabase Storage
          const fileBuffer = await fsModule.readFile(file.filepath);
          const fileExt = pathModule.extname(file.originalFilename || '');
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
          const filePath = `conversations/${conversationId}/${fileName}`;
          const bucket = 'conversation-attachments';

          console.log('[ADMIN_SEND_MESSAGE] Uploading file:', { fileName: file.originalFilename, size: file.size, mimetype: file.mimetype, bucket, filePath });

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileBuffer, {
              contentType: file.mimetype || 'application/octet-stream',
              upsert: false
            });

          if (uploadError) {
            console.error('[ADMIN_SEND_MESSAGE] File upload error:', uploadError.message || uploadError);
            // Continue without the file attachment - message will still be sent
            continue;
          }

          // Get public URL for the uploaded file
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
          console.log('[ADMIN_SEND_MESSAGE] File uploaded successfully:', urlData.publicUrl);

          attachments.push({
            file_path: filePath,
            original_name: file.originalFilename || fileName,
            file_size: file.size,
            mime_type: file.mimetype,
            url: urlData.publicUrl,
            name: file.originalFilename || fileName
          });
        }
      }
    } else {
      // Parse JSON body (may include pre-uploaded attachments)
      const body = await parseJsonBody(req);
      messageContent = body.message || '';
      if (body.attachments && Array.isArray(body.attachments)) {
        attachments = body.attachments;
      }
    }

    const messageData: any = {
      conversation_id: conversationId,
      sender_id: user.userId,
      message: messageContent || '',
      sender_type: 'engineer'
    };

    // Only include attachments if column exists (backward compatibility)
    if (attachments.length > 0) {
      messageData.attachments = attachments;
    }

    console.log('[ADMIN_SEND_MESSAGE] Inserting message:', {
      conversationId,
      hasAttachments: attachments.length > 0,
      attachmentDetails: attachments.map((a: any) => ({
        name: a.name,
        access_type: a.access_type,
        price: a.price,
        payment_status: a.payment_status,
        download_allowed: a.download_allowed,
      })),
    });

    let { data: message, error } = await supabase
      .from('conversation_messages')
      .insert([messageData])
      .select()
      .single();

    // If error and we have attachments, try without attachments (column might not exist yet)
    if (error && attachments.length > 0 && error.message?.includes('attachments')) {
      console.error('[ADMIN_SEND_MESSAGE] ⚠️ ATTACHMENTS COLUMN ERROR - retrying without attachments. Error:', error.message);
      delete messageData.attachments;
      const retry = await supabase
        .from('conversation_messages')
        .insert([messageData])
        .select()
        .single();
      message = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[ADMIN_SEND_MESSAGE] Message insert error:', error.message || error);
      return res.status(500).json({ error: 'Failed to send message', details: error.message });
    }

    // Update conversation: mark as unread for user and change status to "in_progress" if it's "open"
    const updateData: any = {
      user_read: false,
      updated_at: new Date().toISOString()
    };

    if (conversation?.status === 'open') {
      updateData.status = 'in_progress';
    }

    await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId);

    // Auto-set design request status to 'in_review' on admin's first message
    try {
      const { count: adminMsgCount } = await supabase
        .from('conversation_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .in('sender_type', ['engineer', 'admin']);

      if (adminMsgCount === 1 && conversation?.order_id) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('id, order_type, design_status')
          .eq('id', conversation.order_id)
          .single();

        if (orderData?.order_type === 'design' && orderData?.design_status === 'pending') {
          await supabase
            .from('orders')
            .update({ design_status: 'in_review' })
            .eq('id', orderData.id);
          console.log(`[ADMIN_SEND_MESSAGE] Auto-set design ${orderData.id} status to in_review`);
        }
      }
    } catch (statusErr) {
      console.error('[ADMIN_SEND_MESSAGE] Failed to auto-update design status:', statusErr);
    }

    // If a paid attachment was sent, update the order's estimated_price
    if (attachments.length > 0 && conversation?.order_id) {
      const paidAttachment = attachments.find((att: any) => att.access_type === 'paid' && att.price);
      if (paidAttachment) {
        try {
          await supabase
            .from('orders')
            .update({ estimated_price: paidAttachment.price, price: paidAttachment.price })
            .eq('id', conversation.order_id);
          console.log(`[ADMIN_SEND_MESSAGE] Updated order ${conversation.order_id} price to ${paidAttachment.price}`);
        } catch (priceErr) {
          console.error('[ADMIN_SEND_MESSAGE] Failed to update order price:', priceErr);
        }
      }
    }

    console.log('[ADMIN_SEND_MESSAGE] Message sent successfully:', message?.id);
    return res.status(200).json({ message });
  } catch (error: any) {
    console.error('[ADMIN_SEND_MESSAGE] Unhandled error:', error?.message || error);
    return res.status(500).json({ error: 'Failed to send message', details: error?.message || 'Unknown error' });
  }
}

async function handleUpdateAttachmentAccess(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();

  // Check admin role
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const url = req.url || '';
  const parts = url.split('/');
  const messagesIdx = parts.indexOf('messages');
  const messageId = parts[messagesIdx + 1]?.split('?')[0];

  if (!messageId) {
    return res.status(400).json({ error: 'Message ID required' });
  }

  const body = req.body || await parseJsonBody(req);
  const { attachmentIndex, download_allowed } = body;

  if (attachmentIndex === undefined || attachmentIndex === null) {
    return res.status(400).json({ error: 'attachmentIndex is required' });
  }

  // Fetch current message
  const { data: message, error: fetchErr } = await supabase
    .from('conversation_messages')
    .select('attachments')
    .eq('id', messageId)
    .single();

  if (fetchErr || !message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const attachments = [...(message.attachments || [])];
  if (attachmentIndex < 0 || attachmentIndex >= attachments.length) {
    return res.status(400).json({ error: 'Invalid attachment index' });
  }

  attachments[attachmentIndex] = {
    ...attachments[attachmentIndex],
    download_allowed: !!download_allowed,
  };

  const { error: updateErr } = await supabase
    .from('conversation_messages')
    .update({ attachments })
    .eq('id', messageId);

  if (updateErr) {
    console.error('[ATTACHMENT_ACCESS] Update error:', updateErr);
    return res.status(500).json({ error: 'Failed to update attachment access' });
  }

  console.log(`[ATTACHMENT_ACCESS] Updated message ${messageId} attachment ${attachmentIndex} download_allowed=${download_allowed}`);
  return res.status(200).json({ success: true });
}

async function handleConversationUploadUrl(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const body = req.body || await parseJsonBody(req);
  const { conversationId, fileName } = body;

  if (!conversationId || !fileName) {
    return res.status(400).json({ error: 'conversationId and fileName are required' });
  }

  // Check if user is admin or conversation owner
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  const isAdmin = userData?.role === 'admin';

  if (!isAdmin) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.userId)
      .maybeSingle();
    if (!conv) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  try {
    const bucket = 'conversation-attachments';

    // Ensure bucket exists and accepts all file types
    const { data: buckets } = await supabase.storage.listBuckets();
    const existingBucket = buckets?.find((b: any) => b.id === bucket);
    if (!existingBucket) {
      console.log('[UPLOAD_URL] Creating conversation-attachments bucket');
      await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      });
    } else if (existingBucket.allowed_mime_types && existingBucket.allowed_mime_types.length > 0) {
      // Remove MIME type restrictions so all file types (including 3D models) are accepted
      console.log('[UPLOAD_URL] Removing MIME type restrictions from bucket');
      await supabase.storage.updateBucket(bucket, {
        public: true,
        fileSizeLimit: 52428800,
        allowedMimeTypes: null as any,
      });
    }

    // Generate unique file path
    const fileExt = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = `conversations/${conversationId}/${uniqueName}`;

    // Create signed upload URL
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('[UPLOAD_URL] Error creating signed URL:', error);
      return res.status(500).json({ error: 'Failed to create upload URL', details: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return res.status(200).json({
      signedUrl: data.signedUrl,
      token: data.token,
      filePath,
      publicUrl: urlData.publicUrl,
    });
  } catch (error: any) {
    console.error('[UPLOAD_URL] Unhandled error:', error?.message || error);
    return res.status(500).json({ error: 'Failed to create upload URL', details: error?.message });
  }
}

async function handleAdminUpdateConversationStatus(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const conversationId = path.split('/')[3]; // /admin/conversations/:id/status
  
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

async function handleAdminSetTypingStatus(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const parts = url.split('/');
  const conversationId = parts[4]; // /api/admin/conversations/[ID]/typing -> index 4
  const { isTyping } = req.body;
  
  console.log('🔵 Backend - Admin Typing API called:', { 
    url, 
    conversationId, 
    isTyping,
    urlParts: parts 
  });
  
  const supabase = getSupabase();
  
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    console.log('🔴 Backend - Not admin, rejecting');
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('conversations')
      .update({ 
        admin_typing: isTyping,
        admin_typing_at: isTyping ? new Date().toISOString() : null
      })
      .eq('id', conversationId)
      .select();
    
    if (error) {
      console.error('🔴 Backend - Database error:', error);
      return res.status(500).json({ error: 'Failed to update typing status', details: error.message });
    }
    
    console.log('✅ Backend - Typing status updated:', { 
      conversationId: conversationId?.slice(0, 8), 
      admin_typing: isTyping,
      rowsAffected: data?.length || 0,
      updatedData: data?.[0]
    });
    
    return res.status(200).json({ success: true, conversation: data?.[0] });
  } catch (error) {
    console.error('🔴 Backend - Exception:', error);
    return res.status(500).json({ error: 'Failed to update typing status' });
  }
}

async function handleAdminMarkConversationRead(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const conversationId = path.split('/')[3]; // /admin/conversations/:id/read
  
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
  const path = url.split('?')[0].replace('/api', '');
  const userId = path.split('/')[3]; // /admin/users/:id/business-invoices
  
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

async function handleGetMaterialsByType(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();
  
  // Add cache-control headers to prevent stale data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  
  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .order('material_type', { ascending: true })
      .order('color', { ascending: true });
    
    if (error) {
      console.error('Failed to fetch materials:', error);
      return res.status(200).json({ materials: {} });
    }
    
    if (!materials || materials.length === 0) {
      return res.status(200).json({ materials: {} });
    }
    
    console.log(`Fetched ${materials.length} active materials`);
    
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
    return res.status(200).json({ materials: {} });
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

// ==================== TEXT-TO-3D GENERATION HANDLERS ====================

async function handleCreateGeneration(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const { prompt, style, face_limit } = req.body;

  if (!prompt || prompt.trim().length < 3) {
    return res.status(400).json({ error: 'Prompt is required (minimum 3 characters)' });
  }
  if (prompt.length > 500) {
    return res.status(400).json({ error: 'Prompt too long (maximum 500 characters)' });
  }

  try {
    // Build the generation prompt with style prefix
    let generationPrompt = prompt.trim();
    const styleMap: Record<string, string> = {
      cartoon: 'cartoon style, ',
      realistic: 'realistic detailed, ',
      lowpoly: 'low poly, ',
      sculpture: 'smooth sculpture, ',
    };
    if (style && styleMap[style]) {
      generationPrompt = styleMap[style] + generationPrompt;
    }

    // Create generation_jobs record
    const { data: job, error: insertError } = await supabase
      .from('generation_jobs')
      .insert({
        user_id: user.userId,
        prompt: prompt.trim(),
        style: style || null,
        face_limit: face_limit || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !job) {
      console.error('[GENERATE-3D] Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create generation job' });
    }

    // Call Tripo3D API
    const tripoApiKey = process.env.TRIPO3D_API_KEY;
    if (!tripoApiKey) {
      await supabase.from('generation_jobs')
        .update({ status: 'failed', error_message: 'Tripo3D API key not configured' })
        .eq('id', job.id);
      return res.status(500).json({ error: 'Text-to-3D service not configured' });
    }

    const tripoBody: any = {
      type: 'text_to_model',
      prompt: generationPrompt,
    };
    if (face_limit) tripoBody.face_limit = face_limit;

    const tripoResponse = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tripoApiKey}`,
      },
      body: JSON.stringify(tripoBody),
    });

    const tripoData: any = await tripoResponse.json();

    if (!tripoResponse.ok || !tripoData.data?.task_id) {
      const errorMsg = tripoData.message || tripoData.error || 'Tripo3D API error';
      await supabase.from('generation_jobs')
        .update({ status: 'failed', error_message: errorMsg })
        .eq('id', job.id);
      return res.status(502).json({ error: 'Failed to start 3D generation', details: errorMsg });
    }

    // Update job with task_id
    await supabase.from('generation_jobs')
      .update({ tripo_task_id: tripoData.data.task_id, status: 'generating' })
      .eq('id', job.id);

    return res.status(201).json({
      job: { id: job.id, status: 'generating', prompt: prompt.trim(), created_at: job.created_at },
    });
  } catch (error) {
    console.error('[GENERATE-3D] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCheckGeneration(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const url = req.url || '';
  const pathStr = url.split('?')[0].replace('/api', '');
  const jobId = pathStr.split('/')[2]; // /generate-3d/{jobId}

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID required' });
  }

  try {
    const { data: job, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.userId)
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Generation job not found' });
    }

    // Terminal states — return immediately
    if (job.status === 'ready' || job.status === 'failed' || job.status === 'approved' || job.status === 'pending_approval' || job.status === 'rejected') {
      return res.status(200).json({ job });
    }

    // If generating, check Tripo3D and process
    if (job.status === 'generating' && job.tripo_task_id) {
      const result = await pollAndProcessTripoJob(supabase, job, user.userId);
      return res.status(200).json({ job: result });
    }

    // Processing state — still downloading/uploading from a previous poll
    return res.status(200).json({ job });
  } catch (error) {
    console.error('[GENERATE-3D-CHECK] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Shared helper: poll Tripo3D for job status, download + upload GLB if ready.
 * Sets status to 'pending_approval' (NOT 'ready') so admin must approve before client sees it.
 */
async function pollAndProcessTripoJob(supabase: any, job: any, uploaderUserId: string) {
  const tripoApiKey = process.env.TRIPO3D_API_KEY;
  const tripoResponse = await fetch(
    `https://api.tripo3d.ai/v2/openapi/task/${job.tripo_task_id}`,
    { headers: { 'Authorization': `Bearer ${tripoApiKey}` } }
  );

  const tripoData: any = await tripoResponse.json();
  const tripoStatus = tripoData.data?.status;

  if (tripoStatus === 'success') {
    const glbUrl = tripoData.data?.output?.pbr_model?.glb
      || tripoData.data?.output?.model?.glb
      || tripoData.data?.output?.rendered_image;

    if (!glbUrl) {
      await supabase.from('generation_jobs')
        .update({ status: 'failed', error_message: 'No model URL in Tripo response' })
        .eq('id', job.id);
      return { ...job, status: 'failed', error_message: 'No model URL returned' };
    }

    await supabase.from('generation_jobs')
      .update({ status: 'processing' })
      .eq('id', job.id);

    try {
      const glbResponse = await fetch(glbUrl);
      if (!glbResponse.ok) throw new Error('Failed to download model from Tripo3D');

      const glbBuffer = Buffer.from(await glbResponse.arrayBuffer());
      const fileName = `generated-${job.id.substring(0, 8)}.glb`;
      const bucket = process.env.SUPABASE_BUCKET || 'print-jobs';
      const filePath = `${uploaderUserId}/generated/${Date.now()}-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, glbBuffer, { contentType: 'model/gltf-binary' });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

      // Set to pending_approval — admin must approve before client sees it
      await supabase.from('generation_jobs')
        .update({ status: 'pending_approval', file_url: urlData.publicUrl, file_name: fileName })
        .eq('id', job.id);

      return { ...job, status: 'pending_approval', file_url: urlData.publicUrl, file_name: fileName };
    } catch (downloadErr: any) {
      await supabase.from('generation_jobs')
        .update({ status: 'failed', error_message: downloadErr.message })
        .eq('id', job.id);
      return { ...job, status: 'failed', error_message: downloadErr.message };
    }
  } else if (tripoStatus === 'failed' || tripoStatus === 'cancelled') {
    await supabase.from('generation_jobs')
      .update({ status: 'failed', error_message: `Generation ${tripoStatus}` })
      .eq('id', job.id);
    return { ...job, status: 'failed', error_message: `Generation ${tripoStatus}` };
  }

  // Still queued/running
  return { ...job, status: 'generating' };
}

// ─── Admin 3D Generation Endpoints ───────────────────────────────

async function handleAdminTriggerGeneration(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { conversationId, orderId, prompt } = req.body;
  if (!conversationId || !orderId || !prompt) {
    return res.status(400).json({ error: 'conversationId, orderId, and prompt are required' });
  }

  // Get the user_id from the conversation (the client who owns the order)
  const { data: conv } = await supabase.from('conversations').select('user_id').eq('id', conversationId).single();
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const result = await triggerTripo3DGeneration(prompt, orderId, conversationId, conv.user_id);

  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  return res.status(201).json({ jobId: result.jobId });
}

async function handleAdminGetConversationJobs(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const url = req.url || '';
  const pathStr = url.split('?')[0].replace('/api', '');
  const conversationId = pathStr.split('/').pop(); // /admin/generate-3d/conversation/{conversationId}

  if (!conversationId) return res.status(400).json({ error: 'Conversation ID required' });

  const { data: jobs, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch generation jobs' });

  return res.status(200).json({ jobs: jobs || [] });
}

async function handleAdminCheckGeneration(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const url = req.url || '';
  const pathStr = url.split('?')[0].replace('/api', '');
  const jobId = pathStr.split('/')[3]; // /admin/generate-3d/{jobId}

  if (!jobId) return res.status(400).json({ error: 'Job ID required' });

  try {
    const { data: job, error } = await supabase.from('generation_jobs').select('*').eq('id', jobId).single();
    if (error || !job) return res.status(404).json({ error: 'Generation job not found' });

    // Terminal states
    if (['pending_approval', 'approved', 'failed', 'rejected', 'code_ready'].includes(job.status)) {
      return res.status(200).json({ job });
    }

    // If generating, poll Tripo3D
    if (job.status === 'generating' && job.tripo_task_id) {
      const result = await pollAndProcessTripoJob(supabase, job, job.user_id);
      return res.status(200).json({ job: result });
    }

    return res.status(200).json({ job });
  } catch (error) {
    console.error('[ADMIN-GENERATE-3D-CHECK] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleAdminApproveGeneration(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const url = req.url || '';
  const pathStr = url.split('?')[0].replace('/api', '');
  const jobId = pathStr.split('/')[3]; // /admin/generate-3d/{jobId}/approve

  if (!jobId) return res.status(400).json({ error: 'Job ID required' });

  const { data: job, error } = await supabase.from('generation_jobs').select('*').eq('id', jobId).single();
  if (error || !job) return res.status(404).json({ error: 'Generation job not found' });

  if (job.status !== 'pending_approval') {
    return res.status(400).json({ error: `Cannot approve job in status: ${job.status}` });
  }

  // Update status to approved
  await supabase.from('generation_jobs').update({ status: 'approved' }).eq('id', job.id);

  // Post the model to the conversation so the client can see it
  if (job.conversation_id && job.file_url) {
    await supabase.from('conversation_messages').insert([{
      conversation_id: job.conversation_id,
      sender_type: 'system',
      sender_id: null,
      message: '3D preview model is ready!',
      attachments: [{
        type: 'generated_model',
        url: job.file_url,
        name: job.file_name,
        generation_job_id: job.id,
      }],
    }]);
  }

  return res.status(200).json({ job: { ...job, status: 'approved' } });
}

async function handleAdminRejectGeneration(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const url = req.url || '';
  const pathStr = url.split('?')[0].replace('/api', '');
  const jobId = pathStr.split('/')[3]; // /admin/generate-3d/{jobId}/reject

  if (!jobId) return res.status(400).json({ error: 'Job ID required' });

  const { data: job, error } = await supabase.from('generation_jobs').select('*').eq('id', jobId).single();
  if (error || !job) return res.status(404).json({ error: 'Generation job not found' });

  await supabase.from('generation_jobs').update({ status: 'rejected' }).eq('id', job.id);

  return res.status(200).json({ job: { ...job, status: 'rejected' } });
}

// --- OpenSCAD CAD generation endpoints ---

async function handleAdminGenerateOpenSCAD(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  if (!generateOpenSCADCode) {
    return res.status(500).json({ error: 'OpenSCAD module not loaded' });
  }

  const { conversationId, orderId, prompt } = req.body;
  if (!conversationId || !orderId || !prompt) {
    return res.status(400).json({ error: 'conversationId, orderId, and prompt are required' });
  }

  const { data: conv } = await supabase.from('conversations').select('user_id').eq('id', conversationId).single();
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  try {
    const { code, parameters } = await generateOpenSCADCode(prompt);

    const { data: job, error } = await supabase
      .from('generation_jobs')
      .insert({
        user_id: conv.user_id,
        prompt,
        order_id: orderId,
        conversation_id: conversationId,
        status: 'code_ready',
        generation_type: 'openscad',
        openscad_code: code,
        parameters,
      })
      .select()
      .single();

    if (error || !job) {
      console.error('[OPENSCAD] Failed to create job:', error);
      return res.status(500).json({ error: 'Failed to create generation job' });
    }

    return res.status(201).json({ jobId: job.id, code, parameters });
  } catch (err: any) {
    console.error('[OPENSCAD] Generation error:', err);
    return res.status(500).json({ error: err.message || 'OpenSCAD generation failed' });
  }
}

async function handleAdminUploadOpenSCADSTL(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const url = req.url || '';
  const pathStr = url.split('?')[0].replace('/api', '');
  const jobId = pathStr.split('/')[3]; // /admin/generate-openscad/{jobId}/upload

  if (!jobId) return res.status(400).json({ error: 'Job ID required' });

  const { data: job, error } = await supabase.from('generation_jobs').select('*').eq('id', jobId).single();
  if (error || !job) return res.status(404).json({ error: 'Generation job not found' });
  if (job.generation_type !== 'openscad') return res.status(400).json({ error: 'Not an OpenSCAD job' });

  // Expect base64 STL data in request body
  const { stlBase64, fileName } = req.body;
  if (!stlBase64) return res.status(400).json({ error: 'stlBase64 is required' });

  try {
    const stlBuffer = Buffer.from(stlBase64, 'base64');
    const bucket = process.env.SUPABASE_BUCKET || 'print-jobs';
    const finalName = fileName || `openscad-${job.id.substring(0, 8)}.stl`;
    const filePath = `${job.user_id}/generated/${Date.now()}-${finalName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, stlBuffer, { contentType: 'model/stl' });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    await supabase.from('generation_jobs')
      .update({ status: 'pending_approval', file_url: urlData.publicUrl, file_name: finalName })
      .eq('id', job.id);

    return res.status(200).json({
      job: { ...job, status: 'pending_approval', file_url: urlData.publicUrl, file_name: finalName },
    });
  } catch (err: any) {
    console.error('[OPENSCAD] Upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}

async function handleAdminUpdateOpenSCADCode(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const url = req.url || '';
  const pathStr = url.split('?')[0].replace('/api', '');
  const jobId = pathStr.split('/')[3]; // /admin/generate-openscad/{jobId}/code

  if (!jobId) return res.status(400).json({ error: 'Job ID required' });

  const { data: job, error } = await supabase.from('generation_jobs').select('*').eq('id', jobId).single();
  if (error || !job) return res.status(404).json({ error: 'Generation job not found' });
  if (job.generation_type !== 'openscad') return res.status(400).json({ error: 'Not an OpenSCAD job' });

  const { code, parameters } = req.body;
  const updates: any = {};
  if (code !== undefined) updates.openscad_code = code;
  if (parameters !== undefined) updates.parameters = parameters;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  await supabase.from('generation_jobs').update(updates).eq('id', job.id);

  return res.status(200).json({ job: { ...job, ...updates } });
}

async function handleGetMyGenerations(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const url = req.url || '';
  const queryString = url.split('?')[1] || '';
  const params = new URLSearchParams(queryString);
  const orderId = params.get('order_id');

  let query = supabase
    .from('generation_jobs')
    .select('*')
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (orderId) {
    query = query.eq('order_id', orderId);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch generations' });
  }

  return res.status(200).json({ generations: data || [] });
}

async function handleCreateOrderFromGeneration(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const url = req.url || '';
  const pathStr = url.split('?')[0].replace('/api', '');
  const jobId = pathStr.split('/')[2]; // /generate-3d/{jobId}/order

  const { material, color, quantity } = req.body;

  try {
    const { data: job, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.userId)
      .eq('status', 'ready')
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Completed generation not found' });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.userId,
        file_name: job.file_name || 'generated-model.glb',
        file_url: job.file_url,
        material: material || 'PLA',
        color: color || 'white',
        quantity: quantity || 1,
        price: 0,
        payment_status: 'on_hold',
        shipping_method: 'pickup',
        status: 'submitted',
        order_type: 'print',
        notes: `Generated from prompt: "${job.prompt}"`,
      })
      .select()
      .single();

    if (orderError) {
      console.error('[GENERATE-3D-ORDER] Error:', orderError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    return res.status(201).json({ order });
  } catch (error) {
    console.error('[GENERATE-3D-ORDER] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== TRIPO3D AUTO-GENERATION (from design escalation) ====================

async function triggerTripo3DGeneration(
  adminBrief: string,
  orderId: string,
  conversationId: string,
  userId: string
): Promise<{ jobId?: string; error?: string }> {
  const tripoApiKey = process.env.TRIPO3D_API_KEY;
  if (!tripoApiKey) {
    console.log('[TRIPO3D] API key not configured, skipping generation');
    return { error: 'API key not configured' };
  }

  const supabase = getSupabase();

  try {
    // 1. Create generation job linked to order/conversation
    const { data: job, error } = await supabase
      .from('generation_jobs')
      .insert({
        user_id: userId,
        prompt: adminBrief,
        order_id: orderId,
        conversation_id: conversationId,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !job) {
      console.error('[TRIPO3D] Failed to create job:', error);
      return { error: 'Failed to create generation job' };
    }

    // 2. Call Tripo3D API with model v1.4
    const tripoResponse = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tripoApiKey}`,
      },
      body: JSON.stringify({
        type: 'text_to_model',
        model_version: 'v1.4-20250131',
        prompt: `decorative 3D figurine: ${adminBrief}`,
      }),
    });

    const tripoData: any = await tripoResponse.json();

    if (!tripoResponse.ok || !tripoData.data?.task_id) {
      const errorMsg = tripoData.message || tripoData.error || 'Tripo3D API error';
      console.error('[TRIPO3D] API error:', errorMsg);
      await supabase.from('generation_jobs')
        .update({ status: 'failed', error_message: errorMsg })
        .eq('id', job.id);
      return { error: errorMsg };
    }

    // 3. Update job with task ID
    await supabase.from('generation_jobs')
      .update({ tripo_task_id: tripoData.data.task_id, status: 'generating' })
      .eq('id', job.id);

    console.log('[TRIPO3D] Generation triggered for order:', orderId, 'job:', job.id);
    return { jobId: job.id };
  } catch (err: any) {
    console.error('[TRIPO3D] Error triggering generation:', err);
    return { error: err.message || 'Unknown error' };
  }
}

// Main API router
export default async (req: VercelRequest, res: VercelResponse) => {
  console.log('[ENTRY] Function invoked:', req.method, req.url);
  
  // Set CORS headers dynamically based on origin
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://protolab.info',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const contentType = req.headers['content-type'] || '';
  
  // CRITICAL DEBUG: Log admin order status requests specifically
  if (path.includes('/admin/orders/') && path.includes('/status')) {
    console.log('🔴 [ADMIN_ORDER_STATUS] Request detected!', {
      method: req.method,
      fullUrl: url,
      path: path,
      pathParts: path.split('/'),
      matchesRegex: path.match(/^\/admin\/orders\/[^/]+\/status$/) !== null
    });
  }
  
  // Debug logging for ALL requests to see what's happening
  console.log('[DEBUG] Incoming request:', {
    fullUrl: url,
    path: path,
    method: req.method,
    headers: {
      host: req.headers.host,
      referer: req.headers.referer
    }
  });
  
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
      console.log('🔵 [ROUTE] POST /orders matched, calling handleCreateOrder');
      console.log('🔵 [ROUTE] Content-Type:', req.headers['content-type']);
      console.log('🔵 [ROUTE] Authorization:', req.headers.authorization ? 'Present' : 'Missing');
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
    if (path.match(/^\/users\/notifications\/[^/]+\/read$/) && req.method === 'PATCH') {
      return await handleMarkNotificationRead(req as AuthenticatedRequest, res);
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
    
    // Payment routes (PayU)
    if (path === '/payments/payu/create' && req.method === 'POST') {
      return await handlePayUCreateOrder(req, res);
    }
    if (path === '/payments/payu/notify' && req.method === 'POST') {
      return await handlePayUNotify(req, res);
    }

    // Design requests routes
    if (path === '/design-requests/upload-url' && req.method === 'POST') {
      return await handleDesignUploadUrl(req as AuthenticatedRequest, res);
    }
    if (path === '/design-requests' && req.method === 'POST') {
      return await handleCreateDesignRequest(req as AuthenticatedRequest, res);
    }
    if (path === '/design-requests/my' && req.method === 'GET') {
      return await handleGetMyDesignRequests(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/design-requests\/[^/]+\/approve$/) && req.method === 'POST') {
      return await handleApproveDesignRequest(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/design-requests\/[^/]+\/reject$/) && req.method === 'POST') {
      return await handleRejectDesignRequest(req as AuthenticatedRequest, res);
    }

    // Conversations routes
    if (path === '/conversations/upload-url' && req.method === 'POST') {
      return await handleConversationUploadUrl(req as AuthenticatedRequest, res);
    }
    if (path === '/conversations' && req.method === 'GET') {
      return await handleGetConversations(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/order\/[^/]+$/) && req.method === 'GET') {
      return await handleGetOrderConversation(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/order\/[^/]+$/) && req.method === 'POST') {
      return await handleCreateOrderConversation(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/design-request\/[^/]+$/) && req.method === 'GET') {
      return await handleGetDesignRequestConversation(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/design-request\/[^/]+$/) && req.method === 'POST') {
      return await handleCreateDesignRequestConversation(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/[^/]+\/messages$/) && req.method === 'GET') {
      return await handleGetMessages(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/[^/]+\/messages$/) && req.method === 'POST') {
      return await handleSendMessage(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/[^/]+\/read$/) && req.method === 'PATCH') {
      return await handleMarkConversationRead(req as AuthenticatedRequest, res);
    }
    if (path === '/conversations/unread-count' && req.method === 'GET') {
      return await handleGetUserUnreadCount(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/conversations/unread-count' && req.method === 'GET') {
      return await handleGetAdminUnreadCount(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/[^/]+\/typing$/) && req.method === 'POST') {
      return await handleSetTypingStatus(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/conversations\/[^/]+\/escalate$/) && req.method === 'POST') {
      return await handleEscalateToAdmin(req as AuthenticatedRequest, res);
    }

    // Text-to-3D generation routes
    if (path === '/generate-3d' && req.method === 'POST') {
      return await handleCreateGeneration(req as AuthenticatedRequest, res);
    }
    if (path === '/generate-3d' && req.method === 'GET') {
      return await handleGetMyGenerations(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/generate-3d\/[^/]+\/order$/) && req.method === 'POST') {
      return await handleCreateOrderFromGeneration(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/generate-3d\/[^/]+$/) && req.method === 'GET') {
      return await handleCheckGeneration(req as AuthenticatedRequest, res);
    }

    // Admin 3D generation routes
    if (path === '/admin/generate-3d' && req.method === 'POST') {
      return await handleAdminTriggerGeneration(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/generate-3d\/conversation\/[^/]+$/) && req.method === 'GET') {
      return await handleAdminGetConversationJobs(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/generate-3d\/[^/]+\/approve$/) && req.method === 'POST') {
      return await handleAdminApproveGeneration(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/generate-3d\/[^/]+\/reject$/) && req.method === 'POST') {
      return await handleAdminRejectGeneration(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/generate-3d\/[^/]+$/) && req.method === 'GET') {
      return await handleAdminCheckGeneration(req as AuthenticatedRequest, res);
    }

    // Admin OpenSCAD generation routes
    if (path === '/admin/generate-openscad' && req.method === 'POST') {
      return await handleAdminGenerateOpenSCAD(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/generate-openscad\/[^/]+\/upload$/) && req.method === 'POST') {
      return await handleAdminUploadOpenSCADSTL(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/generate-openscad\/[^/]+\/code$/) && req.method === 'PUT') {
      return await handleAdminUpdateOpenSCADCode(req as AuthenticatedRequest, res);
    }

    // Admin routes
    if (path === '/admin/orders' && req.method === 'GET') {
      return await handleAdminGetOrders(req as AuthenticatedRequest, res);
    }
    // IMPORTANT: Check status route BEFORE the general :id route
    if (path.match(/^\/admin\/orders\/[^/]+\/status$/) && req.method === 'PATCH') {
      console.log('[ROUTE_MATCH] Admin update order status matched!', { path, method: req.method });
      return await handleAdminUpdateOrderStatus(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/orders\/[^/]+$/) && req.method === 'GET') {
      return await handleAdminGetOrderById(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/users' && req.method === 'GET') {
      return await handleAdminGetUsers(req as AuthenticatedRequest, res);
    }

    // Admin design requests routes
    if (path === '/admin/design-requests' && req.method === 'GET') {
      return await handleAdminGetDesignRequests(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/design-requests\/[^/]+\/status$/) && req.method === 'PATCH') {
      return await handleAdminUpdateDesignStatus(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/design-requests\/[^/]+$/) && req.method === 'GET') {
      return await handleAdminGetDesignRequestById(req as AuthenticatedRequest, res);
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
    if (path === '/admin/materials' && req.method === 'POST') {
      return await handleAdminCreateMaterial(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/materials' && req.method === 'PATCH') {
      return await handleAdminUpdateMaterial(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/materials' && req.method === 'DELETE') {
      return await handleAdminDeleteMaterial(req as AuthenticatedRequest, res);
    }
    
    // Material types routes
    if (path === '/admin/material-types' && req.method === 'GET') {
      return await handleAdminGetMaterialTypes(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/material-types' && req.method === 'POST') {
      return await handleAdminCreateMaterialType(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/material-types' && req.method === 'PATCH') {
      return await handleAdminUpdateMaterialType(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/material-types' && req.method === 'DELETE') {
      return await handleAdminDeleteMaterialType(req as AuthenticatedRequest, res);
    }
    
    // Suppliers routes
    if (path === '/admin/suppliers' && req.method === 'GET') {
      return await handleAdminGetSuppliers(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/suppliers' && req.method === 'POST') {
      return await handleAdminCreateSupplier(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/suppliers' && req.method === 'PATCH') {
      return await handleAdminUpdateSupplier(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/suppliers' && req.method === 'DELETE') {
      return await handleAdminDeleteSupplier(req as AuthenticatedRequest, res);
    }
    
    // Maintenances routes
    if (path === '/admin/maintenances' && req.method === 'GET') {
      return await handleAdminGetMaintenances(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/maintenances' && req.method === 'POST') {
      return await handleAdminCreateMaintenance(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/maintenances' && req.method === 'PATCH') {
      return await handleAdminUpdateMaintenance(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/maintenances' && req.method === 'DELETE') {
      return await handleAdminDeleteMaintenance(req as AuthenticatedRequest, res);
    }
    
    if (path === '/admin/printers' && req.method === 'GET') {
      return await handleAdminGetPrinters(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/printers' && req.method === 'POST') {
      return await handleAdminCreatePrinter(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/printers' && req.method === 'PATCH') {
      return await handleAdminUpdatePrinter(req as AuthenticatedRequest, res);
    }
    if (path === '/admin/printers' && req.method === 'DELETE') {
      return await handleAdminDeletePrinter(req as AuthenticatedRequest, res);
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
    if (path.match(/^\/admin\/conversations\/[^\/]+\/typing$/) && req.method === 'POST') {
      return await handleAdminSetTypingStatus(req as AuthenticatedRequest, res);
    }
    if (path.match(/^\/admin\/conversations\/messages\/[^\/]+\/attachment-access$/) && req.method === 'PATCH') {
      return await handleUpdateAttachmentAccess(req as AuthenticatedRequest, res);
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
        'PATCH /api/users/notifications/:id/read',
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
  const { firstName, lastName, name, email, password, phone, address, city, zipCode, country, latitude, longitude } = req.body;
  
  // Accept either firstName/lastName OR name (for backward compatibility)
  const first_name = firstName || (name ? name.split(' ')[0] : null);
  const last_name = lastName || (name && name.includes(' ') ? name.substring(name.indexOf(' ') + 1) : firstName || name);
  
  if ((!first_name || !last_name) && !name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
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
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      name: `${first_name} ${last_name}`.trim(), // Keep for backward compatibility
      email: normalizedEmail,
      password_hash,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      zip_code: zipCode?.trim() || null,
      country: country?.trim() || null,
      latitude: latitude || null,
      longitude: longitude || null,
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
    return res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
  
  console.log(`📝 [REGISTER] User created with ID: ${user.id}`);
  
  // Send verification email
  try {
    const fullName = `${first_name} ${last_name}`;
    const emailResult = await sendVerificationEmail(normalizedEmail, fullName, verificationToken);
    console.log(`📝 [REGISTER] Email result:`, JSON.stringify(emailResult));
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    // Don't fail registration if email fails
  }
  
  return res.status(201).json({
    message: 'Registration successful! Please check your email to verify your account.',
    user: { 
      id: user.id, 
      firstName: user.first_name,
      lastName: user.last_name,
      name: user.name, 
      email: user.email, 
      role: user.role 
    }
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
      firstName: user.first_name,
      lastName: user.last_name,
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
      firstName: user.first_name,
      lastName: user.last_name,
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
  
  const { firstName, lastName, name, phone, address, city, zipCode, country } = req.body;
  const supabase = getSupabase();
  
  // Build update object
  const updates: any = {};
  
  // Handle first/last name or combined name
  if (firstName !== undefined) updates.first_name = firstName.trim();
  if (lastName !== undefined) updates.last_name = lastName.trim();
  if (firstName && lastName) {
    updates.name = `${firstName} ${lastName}`.trim();
  } else if (name !== undefined) {
    updates.name = name.trim();
    // Split name if no firstName/lastName provided
    if (!firstName && !lastName) {
      const nameParts = name.trim().split(' ');
      updates.first_name = nameParts[0];
      updates.last_name = nameParts.slice(1).join(' ') || nameParts[0];
    }
  }
  
  if (phone !== undefined) updates.phone = phone.trim() || null;
  if (address !== undefined) updates.address = address.trim() || null;
  if (city !== undefined) updates.city = city.trim() || null;
  if (zipCode !== undefined) updates.zip_code = zipCode.trim() || null;
  if (country !== undefined) updates.country = country.trim() || null;
  
  const { data: userData, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.userId)
    .select()
    .single();
  
  if (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
  
  return res.status(200).json({
    message: 'Profile updated successfully',
    user: {
      id: userData.id,
      firstName: userData.first_name,
      lastName: userData.last_name,
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
  const orderType = req.query.orderType as string | undefined;
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

  // Filter by order type if specified
  if (orderType === 'print') {
    query = query.or('order_type.eq.print,order_type.is.null');
  } else if (orderType === 'design') {
    query = query.eq('order_type', 'design');
  }

  const { data: orders, error } = await query;
  
  console.log(`📦 [ORDERS] Filtered orders: ${orders?.length || 0}, error: ${error ? JSON.stringify(error) : 'none'}`);
  
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
  
  // Fetch conversation unread status for each order
  if (orders && orders.length > 0) {
    const orderIds = orders.map(o => o.id);
    const { data: conversations } = await supabase
      .from('conversations')
      .select('order_id, user_read')
      .in('order_id', orderIds);
    
    // Map unread status to orders
    const unreadMap = new Map(
      conversations?.map(c => [c.order_id, c.user_read === false]) || []
    );
    
    const ordersWithUnread = orders.map(order => ({
      ...order,
      has_unread_messages: unreadMap.get(order.id) || false
    }));
    
    return res.status(200).json({ orders: ordersWithUnread });
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
  console.log('🔵 [ORDER-CREATE] handleCreateOrder called');
  console.log('🔵 [ORDER-CREATE] Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
  
  const user = requireAuth(req, res);
  if (!user) {
    console.log('❌ [ORDER-CREATE] requireAuth failed - no user');
    return;
  }
  
  console.log('✅ [ORDER-CREATE] User authenticated:', user.userId);
  
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
  let quality: string | undefined;
  let supportType: string | undefined;
  let infillPattern: string | undefined;
  let customLayerHeight: string | undefined;
  let customInfill: string | undefined;
  let advancedMode: boolean | undefined;
  let paymentMethod: string | undefined;
  let orderType: string | undefined;
  let description: string | undefined;
  let creditsAmount: number | undefined;
  
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
      paymentMethod = getField('paymentMethod');
      orderType = getField('order_type');
      description = getField('description');
      creditsAmount = parseFloat(getField('credits_amount') || '0');
      layerHeight = getField('layerHeight');
      infill = getField('infill');
      quality = getField('quality');
      supportType = getField('supportType');
      infillPattern = getField('infillPattern');
      customLayerHeight = getField('customLayerHeight');
      customInfill = getField('customInfill');
      const advancedModeField = getField('advancedMode');
      advancedMode = advancedModeField === 'true';
      console.log(`📦 [ORDER-CREATE] Advanced Mode Field: "${advancedModeField}", Parsed: ${advancedMode}`);
      
      const shippingAddressStr = getField('shippingAddress');
      if (shippingAddressStr) {
        try {
          shippingAddress = JSON.parse(shippingAddressStr);
        } catch (e) {
          shippingAddress = shippingAddressStr;
        }
      }
      
      // Handle file upload (not required for credits_purchase)
      const uploadedFile = files.file;
      const fileData = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
      
      // For credits purchase, file is not required
      if (orderType !== 'credits_purchase' && !fileData) {
        return res.status(400).json({ error: 'File is required' });
      }
      
      if (fileData) {
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
      } else {
        // For credits purchase
        fileName = 'credits_purchase';
        fileUrl = 'n/a';
      }
      
    } catch (parseError) {
      console.error('FormData parse error:', parseError);
      return res.status(400).json({ error: 'Failed to parse form data' });
    }
  } else {
    // Handle JSON body
    const body = req.body || {};
    fileName = body.fileName || body.file_name;
    fileUrl = body.fileUrl || body.file_url;
    material = body.material || 'PLA';
    color = body.color || 'white';
    quantity = body.quantity || 1;
    notes = body.notes;
    projectName = body.projectName;
    price = body.price;
    shippingMethod = body.shippingMethod;
    shippingAddress = body.shippingAddress;
    paymentMethod = body.paymentMethod;
    orderType = body.order_type;
    layerHeight = body.layerHeight || body.layer_height;
    infill = body.infill;
    supportType = body.supportType;
    infillPattern = body.infillPattern;
    customLayerHeight = body.customLayerHeight;
    customInfill = body.customInfill;
    advancedMode = body.advancedMode;
    
    // For design orders, file is not required
    if (orderType !== 'design' && (!fileName || !fileUrl)) {
      return res.status(400).json({ error: 'File name and URL required' });
    }
    
    // For design orders, set default values if file not provided
    if (orderType === 'design') {
      if (!fileName) fileName = body.file_name || 'Design Request';
      if (!fileUrl) fileUrl = 'n/a';
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
    payment_status: 'on_hold', // Use on_hold for new orders awaiting payment (constraint allows: paid, on_hold, refunding, refunded)
    shipping_method: shippingMethod || 'pickup',
    layer_height: parseFloat(String(layerHeight || '0.2').replace('mm', '')),
    infill: parseInt(String(infill || '20').replace('%', ''), 10),
    status: orderType === 'credits_purchase' ? 'pending_payment' : 'submitted',
  };

  // Set order type (default to 'print' if not specified)
  orderData.order_type = orderType || 'print';
  if (creditsAmount && creditsAmount > 0) {
    orderData.credits_amount = creditsAmount;
  }
  
  // Add design-specific fields if this is a design order
  if (orderType === 'design') {
    if (req.body.design_description) orderData.design_description = req.body.design_description;
    if (req.body.design_usage) orderData.design_usage = req.body.design_usage;
    if (req.body.design_usage_details) orderData.design_usage_details = req.body.design_usage_details;
    if (req.body.design_dimensions) orderData.design_dimensions = req.body.design_dimensions;
  }
  
  // If paying with credits, check balance and deduct
  if (paymentMethod === 'credits') {
    const orderPrice = price || 0;
    
    // Get current credit balance (use maybeSingle to handle no record case)
    const { data: creditData, error: creditFetchError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.userId)
      .maybeSingle();
    
    if (creditFetchError) {
      console.error('Failed to fetch credit balance:', creditFetchError);
      return res.status(400).json({ error: 'Failed to fetch credit balance' });
    }
    
    const currentBalance = creditData?.balance || 0;
    
    // Check if user has sufficient credits
    if (currentBalance < orderPrice) {
      return res.status(400).json({ 
        error: 'Insufficient credits',
        balance: currentBalance,
        required: orderPrice 
      });
    }
    
    // Deduct credits - use upsert to handle case where no record exists
    const newBalance = currentBalance - orderPrice;
    const { error: updateError } = await supabase
      .from('credits')
      .upsert({ 
        user_id: user.userId,
        balance: newBalance, 
        updated_at: new Date().toISOString() 
      }, {
        onConflict: 'user_id'
      });
    
    if (updateError) {
      console.error('Failed to deduct credits:', updateError);
      return res.status(500).json({ error: 'Failed to deduct credits' });
    }
    
    console.log(`💳 [CREDITS] Deducted ${orderPrice} PLN from user ${user.userId}. New balance: ${newBalance} PLN`);
    
    // Mark order as paid (only if these columns exist)
    orderData.payment_status = 'paid';
    orderData.paid_amount = orderPrice;
  }
  
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
    console.log(`📦 [ORDER-CREATE] Setting advanced_mode in orderData: ${advancedMode}`);
  }
  if (quality !== undefined && quality !== null && quality !== '') {
    orderData.quality = quality;
  }
  
  // Add optional fields if provided (notes excluded - sent as first conversation message)
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
  
  // If payment was made with credits, create transaction record
  if (paymentMethod === 'credits' && order) {
    const { error: transactionError } = await supabase
      .from('credits_transactions')
      .insert([{
        user_id: user.userId,
        amount: -(price || 0),
        type: 'debit',
        description: `Payment for order #${order.id} - ${fileName}`,
        order_id: order.id,
      }]);
    
    if (transactionError) {
      console.error('Failed to create credit transaction record:', transactionError);
      // Don't fail the order creation, just log the error
    } else {
      console.log(`💳 [CREDITS] Created transaction record for order #${order.id}`);
    }
  }
  
  console.log(`📦 [ORDER-CREATE] Success! Order ID: ${order?.id}`);

  // Auto-create conversation for the order, and send notes/description as first message
  if (order) {
    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('order_id', order.id)
        .maybeSingle();

      let conversationId = existingConv?.id;

      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            order_id: order.id,
            user_id: user.userId,
            subject: `Job conversation for ${fileName}`,
            status: 'open',
          })
          .select()
          .single();

        if (convError) {
          console.error('📦 [ORDER-CREATE] Failed to create conversation:', convError);
        } else {
          conversationId = newConv.id;
          console.log(`📦 [ORDER-CREATE] Auto-created conversation ${conversationId}`);
        }
      }

      // Send notes/description as first message
      const noteText = notes || description;
      if (conversationId && noteText && noteText.trim()) {
        const { error: msgError } = await supabase
          .from('conversation_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.userId,
            sender_type: 'user',
            message: noteText.trim(),
          });

        if (msgError) {
          console.error('📦 [ORDER-CREATE] Failed to send initial message:', msgError);
        } else {
          console.log(`📦 [ORDER-CREATE] Sent initial note to conversation ${conversationId}`);
        }
      }
    } catch (convErr) {
      console.error('📦 [ORDER-CREATE] Conversation auto-creation error:', convErr);
      // Don't fail order creation if conversation fails
    }
  }

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

  // Handle payment method processing before updating
  if (req.body.payment_method === 'credits') {
    console.log('=== PROCESSING CREDITS PAYMENT ===');
    
    // Get current order to check price
    const { data: currentOrderData } = await supabase
      .from('orders')
      .select('price, payment_status')
      .eq('id', orderId)
      .single();
    
    if (!currentOrderData) {
      return res.status(404).json({ error: 'Order not found for payment processing' });
    }
    
    if (currentOrderData.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order is already paid' });
    }
    
    const orderPrice = currentOrderData.price || 0;
    
    // Get current credit balance
    const { data: creditData, error: creditFetchError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.userId)
      .maybeSingle();
    
    if (creditFetchError) {
      console.error('Failed to fetch credit balance:', creditFetchError);
      return res.status(500).json({ error: 'Failed to fetch credit balance' });
    }
    
    const currentBalance = creditData?.balance || 0;
    
    // Check if user has sufficient credits
    if (currentBalance < orderPrice) {
      return res.status(400).json({ 
        error: 'Insufficient credits',
        balance: currentBalance,
        required: orderPrice 
      });
    }
    
    // Deduct credits
    const newBalance = currentBalance - orderPrice;
    const { error: updateError } = await supabase
      .from('credits')
      .upsert({ 
        user_id: user.userId,
        balance: newBalance, 
        updated_at: new Date().toISOString() 
      }, {
        onConflict: 'user_id'
      });
    
    if (updateError) {
      console.error('Failed to deduct credits:', updateError);
      return res.status(500).json({ error: 'Failed to deduct credits' });
    }
    
    // Create transaction record
    const { error: transactionError } = await supabase
      .from('credits_transactions')
      .insert([{
        user_id: user.userId,
        amount: -orderPrice,
        type: 'debit',
        description: `Payment for order #${orderId}`,
        order_id: orderId,
        balance_after: newBalance,
      }]);
    
    if (transactionError) {
      console.error('Failed to create credit transaction record:', transactionError);
    }
    
    console.log(`💳 [CREDITS] Deducted ${orderPrice} PLN from user ${user.userId}. New balance: ${newBalance} PLN`);
    
    // Add payment completion data to update
    req.body.payment_status = 'paid';
    req.body.payment_method = 'credits';
    req.body.paid_amount = orderPrice;
  }

  // Extract all possible fields from request body
  const updateData: any = {};
  const allowedFields = [
    'material', 'color', 'quantity', 'notes', 'project_name', 'status',
    'payment_status', 'price', 'layer_height', 'infill', 'quality',
    'support_type', 'infill_pattern', 'custom_layer_height', 'custom_infill',
    'advanced_mode', 'shipping_method', 'tracking_number', 'estimated_delivery',
    'refund_method', 'refund_amount', 'refund_reason', 'refund_bank_details',
    'payment_method', 'paid_amount'
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
  const bucket = process.env.SUPABASE_BUCKET || 'print-jobs';
  const filePath = `${user.userId}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(filePath);

  if (error) {
    console.error('Presigned URL error:', error);
    return res.status(500).json({ error: 'Failed to create upload URL' });
  }

  // Build the public URL for the file
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;

  return res.status(200).json({
    uploadUrl: data.signedUrl,
    filePath,
    bucket,
    publicUrl,
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

// ==================== DESIGN REQUESTS HANDLERS ====================
// Design requests are stored in the orders table with order_type = 'design'

function mapOrderToDesignRequest(order: any) {
  return {
    id: order.id,
    project_name: order.file_name || 'Design Request',
    idea_description: order.idea_description || order.notes || '',
    usage_type: order.usage_type || null,
    usage_details: order.usage_details || null,
    approximate_dimensions: order.approximate_dimensions || null,
    desired_material: order.desired_material || order.material || null,
    attached_files: order.attached_files || [],
    reference_images: [],
    design_status: order.design_status || order.status || 'pending',
    estimated_price: order.price || null,
    final_price: order.price || null,
    payment_status: order.payment_status || 'pending',
    admin_notes: order.notes || null,
    admin_design_file: order.admin_design_file || null,
    user_approval_status: order.design_status === 'approved' ? 'approved' : (order.design_status === 'cancelled' ? 'rejected' : 'pending'),
    user_approval_at: order.design_status === 'approved' ? order.updated_at : null,
    user_rejection_reason: null,
    created_at: order.created_at,
    updated_at: order.updated_at || order.created_at,
  };
}

async function handleDesignUploadUrl(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const body = req.body || await parseJsonBody(req);
  const { fileName } = body;

  if (!fileName) {
    return res.status(400).json({ error: 'fileName is required' });
  }

  try {
    const bucket = process.env.SUPABASE_BUCKET || 'print-jobs';

    // Ensure bucket accepts all file types
    const { data: buckets } = await supabase.storage.listBuckets();
    const existingBucket = buckets?.find((b: any) => b.id === bucket);
    if (existingBucket?.allowed_mime_types && existingBucket.allowed_mime_types.length > 0) {
      await supabase.storage.updateBucket(bucket, {
        public: true,
        fileSizeLimit: 52428800,
        allowedMimeTypes: null as any,
      });
    }

    const fileExt = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = `${user.userId}/${uniqueName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('[DESIGN-UPLOAD] Error creating signed URL:', error);
      return res.status(500).json({ error: 'Failed to create upload URL' });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return res.status(200).json({
      signedUrl: data.signedUrl,
      token: data.token,
      filePath,
      publicUrl: urlData.publicUrl,
    });
  } catch (error: any) {
    console.error('[DESIGN-UPLOAD] Error:', error?.message || error);
    return res.status(500).json({ error: 'Failed to create upload URL' });
  }
}

async function handleCreateDesignRequest(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();

  try {
    let projectName: string = '';
    let ideaDescription: string = '';
    let usage: string = 'functional';
    let usageDetails: string = '';
    let approximateDimensions: string = '';
    let desiredMaterial: string = '';
    let attachedFiles: any[] = [];

    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseFormData(req);
      const getField = (name: string): string | undefined => {
        const value = fields[name];
        return Array.isArray(value) ? value[0] : value;
      };

      projectName = getField('projectName') || 'Design Request';
      ideaDescription = getField('ideaDescription') || '';
      usage = getField('usage') || 'functional';
      usageDetails = getField('usageDetails') || '';
      approximateDimensions = getField('approximateDimensions') || '';
      desiredMaterial = getField('desiredMaterial') || '';

      // Handle reference file uploads
      const refFiles = files.referenceFiles;
      const fileList = Array.isArray(refFiles) ? refFiles : refFiles ? [refFiles] : [];

      if (fileList.length > 0) {
        const bucket = process.env.SUPABASE_BUCKET || 'print-jobs';

        // Ensure bucket accepts all file types (remove MIME restrictions for 3D files etc.)
        try {
          const { data: bucketsList } = await supabase.storage.listBuckets();
          const existingBucket = bucketsList?.find((b: any) => b.id === bucket);
          if (existingBucket?.allowed_mime_types && existingBucket.allowed_mime_types.length > 0) {
            console.log('[DESIGN] Removing MIME type restrictions from bucket:', bucket);
            await supabase.storage.updateBucket(bucket, {
              public: true,
              fileSizeLimit: 52428800,
              allowedMimeTypes: null as any,
            });
          }
        } catch (bucketErr) {
          console.error('[DESIGN] Bucket check/update error:', bucketErr);
        }

        for (const fileData of fileList) {
          const fs = await import('fs');
          const fileBuffer = fs.readFileSync(fileData.filepath);
          const fileName = fileData.originalFilename || 'reference-file';
          const filePath = `${user.userId}/${Date.now()}-${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileBuffer, {
              contentType: fileData.mimetype || 'application/octet-stream',
            });

          if (uploadError) {
            console.error('[DESIGN] File upload error:', uploadError.message || uploadError);
          } else {
            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
            attachedFiles.push({
              name: fileName,
              url: urlData.publicUrl,
              size: fileData.size,
              type: fileData.mimetype,
            });
          }

          fs.unlinkSync(fileData.filepath);
        }
      }
    } else {
      const body = req.body || {};
      projectName = body.projectName || 'Design Request';
      ideaDescription = body.ideaDescription || '';
      usage = body.usage || 'functional';
      usageDetails = body.usageDetails || '';
      approximateDimensions = body.approximateDimensions || '';
      desiredMaterial = body.desiredMaterial || '';
      // Accept pre-uploaded files from client (uploaded via signed URL)
      if (Array.isArray(body.attachedFiles)) {
        attachedFiles = body.attachedFiles;
      }
    }

    if (!ideaDescription) {
      return res.status(400).json({ error: 'Idea description is required' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.userId,
        order_type: 'design',
        file_name: projectName,
        file_url: 'n/a',
        idea_description: ideaDescription,
        usage_type: usage,
        usage_details: usageDetails,
        approximate_dimensions: approximateDimensions,
        desired_material: desiredMaterial,
        material: desiredMaterial || 'PLA',
        color: 'white',
        quantity: 1,
        price: 0,
        layer_height: 0.2,
        infill: 20,
        attached_files: attachedFiles,
        design_status: 'pending',
        status: 'submitted',
        payment_status: 'on_hold',
        shipping_method: 'pickup',
      })
      .select()
      .single();

    if (error) {
      console.error('Design request creation error:', error);
      return res.status(500).json({ error: 'Failed to create design request' });
    }

    // Auto-create conversation and send idea_description as first message
    if (order) {
      try {
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .insert({
            order_id: order.id,
            user_id: user.userId,
            subject: `Design Assistance - ${projectName}`,
            status: 'open',
          })
          .select()
          .single();

        if (convError) {
          console.error('[DESIGN] Failed to create conversation:', convError);
        } else if (conv && ideaDescription) {
          const { error: msgError } = await supabase
            .from('conversation_messages')
            .insert({
              conversation_id: conv.id,
              sender_id: user.userId,
              sender_type: 'user',
              message: ideaDescription,
            });
          if (msgError) {
            console.error('[DESIGN] Failed to send initial message:', msgError);
          } else {
            console.log(`[DESIGN] Auto-created conversation ${conv.id} with initial description message`);

            // Trigger AI agent to generate first response
            console.log('[DESIGN] >>> About to trigger AI agent for conv:', conv.id, 'order:', order.id);
            console.log('[DESIGN] >>> AI_AGENT_ENABLED:', process.env.AI_AGENT_ENABLED);
            console.log('[DESIGN] >>> generateAIResponse loaded:', !!generateAIResponse);
            console.log('[DESIGN] >>> buildGeminiHistory loaded:', !!buildGeminiHistory);
            console.log('[DESIGN] >>> buildDesignContext loaded:', !!buildDesignContext);
            try {
              // Try to set ai_status (may fail if column doesn't exist yet — that's ok)
              await supabase
                .from('conversations')
                .update({ ai_status: 'active' })
                .eq('id', conv.id);
            } catch (e) {
              console.log('[DESIGN] Could not set ai_status:', e);
            }
            try {
              await triggerAIAgentResponse(conv.id, order.id);
              console.log('[DESIGN] >>> AI agent trigger completed successfully');
            } catch (aiErr) {
              console.error('[DESIGN] >>> AI agent trigger error:', aiErr);
            }
          }
        }
      } catch (convErr) {
        console.error('[DESIGN] Conversation auto-creation error:', convErr);
      }
    }

    return res.status(201).json(mapOrderToDesignRequest(order));
  } catch (error) {
    console.error('Design request error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetMyDesignRequests(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.userId)
    .eq('order_type', 'design')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch design requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch design requests' });
  }

  return res.status(200).json({ requests: (orders || []).map(mapOrderToDesignRequest) });
}

async function handleApproveDesignRequest(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const parts = path.split('/');
  const requestId = parts[2]; // /design-requests/:id/approve

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('orders')
    .update({ design_status: 'approved' })
    .eq('id', requestId)
    .eq('user_id', user.userId)
    .eq('order_type', 'design')
    .select()
    .single();

  if (error) {
    console.error('Approve design request error:', error);
    return res.status(500).json({ error: 'Failed to approve design request' });
  }

  return res.status(200).json(mapOrderToDesignRequest(data));
}

async function handleRejectDesignRequest(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const parts = path.split('/');
  const requestId = parts[2]; // /design-requests/:id/reject

  const { reason } = req.body || {};

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('orders')
    .update({
      notes: reason || 'Rejected by user',
    })
    .eq('id', requestId)
    .eq('user_id', user.userId)
    .eq('order_type', 'design')
    .select()
    .single();

  if (error) {
    console.error('Reject design request error:', error);
    return res.status(500).json({ error: 'Failed to reject design request' });
  }

  return res.status(200).json(mapOrderToDesignRequest(data));
}

async function handleGetOrderConversation(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const url = req.url || '';
  const orderId = url.split('/conversations/order/')[1]?.split('?')[0];

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID required' });
  }

  const supabase = getSupabase();

  // Verify user owns this order
  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('id', orderId)
    .eq('user_id', user.userId)
    .single();

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Find existing conversation by order_id
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (!conversation) {
    return res.status(200).json({ conversation: null, messages: [] });
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true });

  // Mark as read for user
  await supabase.from('conversations')
    .update({ user_read: true })
    .eq('id', conversation.id)
    .eq('user_id', user.userId);

  return res.status(200).json({
    conversation,
    messages: messages || [],
  });
}

async function handleGetDesignRequestConversation(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const url = req.url || '';
  const designRequestId = url.split('/').pop()?.split('?')[0];

  if (!designRequestId) {
    return res.status(400).json({ error: 'Design request ID required' });
  }

  const supabase = getSupabase();

  // Check if user is admin
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  const isAdmin = userData?.role === 'admin';

  // Verify access: admin can access any, regular user only their own
  let orderQuery = supabase
    .from('orders')
    .select('id, user_id')
    .eq('id', designRequestId)
    .eq('order_type', 'design');

  if (!isAdmin) {
    orderQuery = orderQuery.eq('user_id', user.userId);
  }

  const { data: order } = await orderQuery.single();

  if (!order) {
    return res.status(404).json({ error: 'Design request not found' });
  }

  // Find existing conversation by order_id
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('order_id', designRequestId)
    .maybeSingle();

  if (!conversation) {
    return res.status(200).json({ conversation: null, messages: [] });
  }

  // Fetch messages from conversation_messages table
  const { data: messages } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true });

  // Mark conversation as read for the current viewer
  if (isAdmin) {
    await supabase.from('conversations').update({ admin_read: true }).eq('id', conversation.id);
  } else {
    await supabase.from('conversations').update({ user_read: true }).eq('id', conversation.id).eq('user_id', user.userId);
  }

  return res.status(200).json({
    conversation,
    messages: messages || [],
  });
}

async function handleCreateDesignRequestConversation(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const url = req.url || '';
  const designRequestId = url.split('/').pop()?.split('?')[0];

  if (!designRequestId) {
    return res.status(400).json({ error: 'Design request ID required' });
  }

  const supabase = getSupabase();

  // Check if user is admin
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  const isAdmin = userData?.role === 'admin';

  // Verify the design request exists and user has access
  let orderQuery = supabase
    .from('orders')
    .select('id, user_id')
    .eq('id', designRequestId)
    .eq('order_type', 'design');

  if (!isAdmin) {
    orderQuery = orderQuery.eq('user_id', user.userId);
  }

  const { data: order } = await orderQuery.single();

  if (!order) {
    return res.status(404).json({ error: 'Design request not found' });
  }

  // Check if conversation already exists for this design request
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('order_id', designRequestId)
    .maybeSingle();

  if (existingConversation) {
    return res.status(200).json({ conversation: existingConversation });
  }

  // Create new conversation linked to the design request order
  const { subject } = req.body || {};
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      order_id: designRequestId,
      user_id: order.user_id,
      subject: subject || `Design Assistance - ${designRequestId.slice(0, 8)}`,
      status: 'open'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating design request conversation:', error);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }

  return res.status(201).json({ conversation });
}

// ==================== ADMIN DESIGN REQUESTS HANDLERS ====================

async function handleAdminGetDesignRequests(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();

  // Verify admin
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_type', 'design')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin fetch design requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch design requests' });
  }

  // Enrich with user data
  const orderList = orders || [];
  const userIds = [...new Set(orderList.map((o: any) => o.user_id).filter(Boolean))];
  let userMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, first_name, last_name, email')
      .in('id', userIds);
    if (users) {
      users.forEach((u: any) => { userMap[u.id] = u; });
    }
  }

  const designRequests = orderList.map((o: any) => ({
    ...mapOrderToDesignRequest(o),
    users: userMap[o.user_id] || null,
  }));

  return res.status(200).json({ designRequests });
}

async function handleAdminGetDesignRequestById(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();

  // Verify admin
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const orderId = path.split('/')[3]; // /admin/design-requests/:id

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('order_type', 'design')
    .single();

  if (error || !order) {
    return res.status(404).json({ error: 'Design request not found' });
  }

  // Get user info
  const { data: orderUser } = await supabase
    .from('users')
    .select('id, name, first_name, last_name, email')
    .eq('id', order.user_id)
    .single();

  return res.status(200).json({
    request: {
      ...mapOrderToDesignRequest(order),
      users: orderUser || null,
    },
  });
}

async function handleAdminUpdateDesignStatus(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();

  // Verify admin
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const orderId = path.split('/')[3]; // /admin/design-requests/:id/status

  const { status, price } = req.body || {};

  const updateFields: any = {};
  if (status) updateFields.design_status = status;
  if (price !== undefined && price !== null && price !== '') {
    updateFields.price = parseFloat(price);
  }

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateFields)
    .eq('id', orderId)
    .eq('order_type', 'design')
    .select()
    .single();

  if (error) {
    console.error('Admin update design status error:', error);
    return res.status(500).json({ error: 'Failed to update design status' });
  }

  return res.status(200).json(mapOrderToDesignRequest(data));
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
      id,
      order_id,
      user_id,
      subject,
      status,
      created_at,
      updated_at,
      user_read,
      admin_read,
      user_typing,
      user_typing_at,
      admin_typing,
      admin_typing_at,
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
  
  const supabase = getSupabase();
  
  try {
    // Verify ownership
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

    const contentType = req.headers['content-type'] || '';
    let messageContent: string;
    let attachments: any[] = [];

    // Check if multipart (has files)
    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseFormData(req);
      
      const getField = (name: string): string | undefined => {
        const value = fields[name];
        return Array.isArray(value) ? value[0] : value;
      };
      
      messageContent = getField('message') || '';

      // Handle file attachments - accept both 'attachments' and 'file' keys
      const uploadedFiles = files.attachments || files.file;
      if (uploadedFiles) {
        const fileArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];

        for (const file of fileArray) {
          if (!file || !file.filepath) continue;

          const fs = await import('fs/promises');
          const path = await import('path');

          // Read file and upload to Supabase Storage
          const fileBuffer = await fs.readFile(file.filepath);
          const fileExt = path.extname(file.originalFilename || '');
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
          const filePath = `conversations/${conversationId}/${fileName}`;
          const bucket = 'conversation-attachments';

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileBuffer, {
              contentType: file.mimetype || 'application/octet-stream',
              upsert: false
            });

          if (uploadError) {
            console.error('[SEND_MESSAGE] File upload error:', uploadError);
            continue;
          }

          // Get public URL for the uploaded file
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

          attachments.push({
            file_path: filePath,
            original_name: file.originalFilename || fileName,
            file_size: file.size,
            mime_type: file.mimetype,
            url: urlData.publicUrl,
            name: file.originalFilename || fileName
          });
        }
      }
    } else {
      // Parse JSON body (may include pre-uploaded attachments)
      const body = await parseJsonBody(req);
      messageContent = body.content || body.message || '';
      if (body.attachments && Array.isArray(body.attachments)) {
        attachments = body.attachments;
      }
    }
    
    if (!messageContent && attachments.length === 0) {
      return res.status(400).json({ error: 'Message content or attachments required' });
    }
    
    const messageData: any = {
      conversation_id: conversationId,
      sender_id: user.userId,
      message: messageContent || '',
      sender_type: 'user'
    };
    
    // Only include attachments if column exists (backward compatibility)
    if (attachments.length > 0) {
      messageData.attachments = attachments;
    }
    
    console.log('[SEND_MESSAGE] Inserting message:', messageData);
    
    let { data: message, error } = await supabase
      .from('conversation_messages')
      .insert([messageData])
      .select()
      .single();
    
    // If error and we have attachments, try without attachments (column might not exist yet)
    if (error && attachments.length > 0 && error.message?.includes('attachments')) {
      console.log('[SEND_MESSAGE] Retrying without attachments (column may not exist yet)');
      delete messageData.attachments;
      const retry = await supabase
        .from('conversation_messages')
        .insert([messageData])
        .select()
        .single();
      message = retry.data;
      error = retry.error;
    }
    
    if (error) {
      console.error('[SEND_MESSAGE] Insert error:', error);
      return res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
    
    // Update conversation timestamp and mark as unread for admin
    await supabase
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        admin_read: false 
      })
      .eq('id', conversationId);
    
    console.log('[SEND_MESSAGE] Message sent successfully:', message);

    // Trigger AI agent response if this is a design conversation and AI is active
    try {
      const { data: convData } = await supabase
        .from('conversations')
        .select('order_id, ai_status')
        .eq('id', conversationId)
        .single();

      if (convData?.ai_status === 'active' && convData?.order_id) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('order_type')
          .eq('id', convData.order_id)
          .single();

        if (orderData?.order_type === 'design') {
          await triggerAIAgentResponse(conversationId, convData.order_id);
        }
      }
    } catch (aiError) {
      console.error('[SEND_MESSAGE] AI agent trigger error:', aiError);
    }

    return res.status(201).json({ message });
  } catch (error: any) {
    console.error('[SEND_MESSAGE] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

/**
 * AI Agent: Generate and insert an AI response for a design conversation.
 * Called internally after user sends a message or after initial design request creation.
 */
async function triggerAIAgentResponse(conversationId: string, orderId: string) {
  if ((process.env.AI_AGENT_ENABLED || '').trim() !== 'true') {
    console.log('[AI_AGENT] Disabled via AI_AGENT_ENABLED env var, value:', JSON.stringify(process.env.AI_AGENT_ENABLED));
    return;
  }

  if (!generateAIResponse || !buildGeminiHistory || !buildDesignContext) {
    console.log('[AI_AGENT] Gemini module not loaded, skipping');
    return;
  }

  const supabase = getSupabase();

  try {
    // 1. Check conversation AI status (fallback to 'active' if column doesn't exist yet)
    let aiStatus = 'active';
    let conversationUserId: string | null = null;
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('ai_status, user_id')
        .eq('id', conversationId)
        .single();
      if (conversation?.ai_status) {
        aiStatus = conversation.ai_status;
      }
      conversationUserId = conversation?.user_id || null;
    } catch (e) {
      console.log('[AI_AGENT] Could not read ai_status, assuming active');
    }

    if (aiStatus !== 'active') {
      console.log('[AI_AGENT] Conversation AI status is not active:', aiStatus);
      return;
    }

    console.log('[AI_AGENT] Starting AI response for conversation:', conversationId);

    // 2. Fetch the order (design request) for context
    const { data: order } = await supabase
      .from('orders')
      .select('file_name, idea_description, usage_type, approximate_dimensions, desired_material, attached_files')
      .eq('id', orderId)
      .single();

    if (!order) {
      console.error('[AI_AGENT] Order not found:', orderId);
      return;
    }

    // 3. Fetch all messages in the conversation (exclude admin_brief messages)
    const { data: messages } = await supabase
      .from('conversation_messages')
      .select('sender_type, message, attachments')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Filter out admin-only messages — they shouldn't be in AI history
    const filteredMessages = (messages || []).filter((m: any) => {
      if (m.attachments && Array.isArray(m.attachments)) {
        return !m.attachments.some((att: any) => att.type === 'admin_brief' || att.type === 'admin_error');
      }
      return true;
    });

    if (!filteredMessages || filteredMessages.length === 0) {
      console.error('[AI_AGENT] No messages found for conversation:', conversationId);
      return;
    }

    // 4. If admin already responded, auto-escalate and stop
    const hasEngineerMessages = filteredMessages.some((m: any) => m.sender_type === 'engineer');
    if (hasEngineerMessages) {
      console.log('[AI_AGENT] Engineer already responded, auto-escalating');
      await supabase
        .from('conversations')
        .update({ ai_status: 'escalated' })
        .eq('id', conversationId);
      return;
    }

    // 5. Build conversation history and generate AI response
    const designContext = buildDesignContext(order);
    const geminiHistory = await buildGeminiHistory(filteredMessages, designContext);
    const { text: aiText, shouldEscalate, adminBrief } = await generateAIResponse(geminiHistory);

    // 6. Insert AI message
    const aiMessageData: any = {
      conversation_id: conversationId,
      sender_type: 'system',
      sender_id: null,
      message: aiText,
    };

    const { error: insertError } = await supabase
      .from('conversation_messages')
      .insert([aiMessageData]);

    if (insertError) {
      console.error('[AI_AGENT] Failed to insert AI message:', insertError);
      return;
    }

    // 8. Mark conversation as unread for user
    await supabase
      .from('conversations')
      .update({
        user_read: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    // 9. Handle escalation
    if (shouldEscalate) {
      await supabase
        .from('conversations')
        .update({ ai_status: 'escalated', admin_read: false })
        .eq('id', conversationId);

      // Insert admin-only design brief (hidden from client, visible to admin)
      if (adminBrief) {
        // Strip [DECORATIVE]/[FUNCTIONAL] tag before storing the brief
        const isDecorative = adminBrief.trimStart().startsWith('[DECORATIVE]');
        const cleanBrief = adminBrief
          .replace(/^\s*\[DECORATIVE\]\s*/i, '')
          .replace(/^\s*\[FUNCTIONAL\]\s*/i, '')
          .trim();

        await supabase
          .from('conversation_messages')
          .insert([{
            conversation_id: conversationId,
            sender_type: 'system',
            sender_id: null,
            message: cleanBrief,
            attachments: [{ type: 'admin_brief', classification: isDecorative ? 'decorative' : 'functional' }],
          }]);
      }

      console.log('[AI_AGENT] Conversation escalated to admin:', conversationId);
    }

    console.log('[AI_AGENT] AI response sent for conversation:', conversationId);
  } catch (error) {
    console.error('[AI_AGENT] Error generating response:', error);

    // Post admin-only error message so the admin sees it in the chat
    try {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log('[AI_AGENT] Inserting admin_error message for conversation:', conversationId, 'error:', errMsg);
      const { error: insertError } = await supabase.from('conversation_messages').insert([{
        conversation_id: conversationId,
        sender_type: 'system',
        sender_id: null,
        message: `⚠️ Pikoro encountered an error: ${errMsg}`,
        attachments: [{ type: 'admin_error' }],
      }]);
      if (insertError) {
        console.error('[AI_AGENT] Supabase insert error:', insertError);
      } else {
        console.log('[AI_AGENT] admin_error message inserted successfully');
      }
      // Mark as unread for admin so they notice
      await supabase.from('conversations')
        .update({ admin_read: false, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (insertErr) {
      console.error('[AI_AGENT] Failed to insert error message:', insertErr);
    }
  }
}

async function handleEscalateToAdmin(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const conversationId = path.split('/')[2];

  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID required' });
  }

  const supabase = getSupabase();

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, ai_status')
    .eq('id', conversationId)
    .eq('user_id', user.userId)
    .single();

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  if (conversation.ai_status !== 'active') {
    return res.status(200).json({ message: 'Already escalated or AI not active' });
  }

  await supabase
    .from('conversations')
    .update({ ai_status: 'escalated', admin_read: false })
    .eq('id', conversationId);

  await supabase
    .from('conversation_messages')
    .insert([{
      conversation_id: conversationId,
      sender_type: 'system',
      sender_id: null,
      message: 'You have requested to speak with a human design engineer. A team member will continue this conversation shortly.',
    }]);

  return res.status(200).json({ message: 'Escalated to admin' });
}

async function handleSetTypingStatus(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const path = url.split('?')[0].replace('/api', '');
  const conversationId = path.split('/')[2]; // /conversations/:id/typing
  const { isTyping } = req.body;
  
  const supabase = getSupabase();
  
  try {
    await supabase
      .from('conversations')
      .update({ 
        user_typing: isTyping,
        user_typing_at: isTyping ? new Date().toISOString() : null
      })
      .eq('id', conversationId)
      .eq('user_id', user.userId);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Set typing status error:', error);
    return res.status(500).json({ error: 'Failed to update typing status' });
  }
}

async function handleMarkConversationRead(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;
  
  const url = req.url || '';
  const parts = url.split('/');
  const conversationId = parts[parts.indexOf('conversations') + 1];
  
  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID required' });
  }
  
  const supabase = getSupabase();
  
  try {
    // Verify ownership and mark as read
    const { error } = await supabase
      .from('conversations')
      .update({ user_read: true })
      .eq('id', conversationId)
      .eq('user_id', user.userId);
    
    if (error) {
      console.error('[MARK_READ] Error:', error);
      return res.status(500).json({ error: 'Failed to mark as read' });
    }
    
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[MARK_READ] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== UNREAD COUNT HANDLERS ====================

async function handleGetUserUnreadCount(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  try {
    // Count conversations belonging to this user where user_read = false (admin sent something unread)
    const { count } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.userId)
      .eq('user_read', false);

    return res.status(200).json({ unreadCount: count || 0 });
  } catch (err: any) {
    return res.status(200).json({ unreadCount: 0 });
  }
}

async function handleGetAdminUnreadCount(req: AuthenticatedRequest, res: VercelResponse) {
  const user = requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.userId).single();
  if (userData?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    // Count conversations where admin_read = false (user sent something unread)
    const { count: unreadMessages } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('admin_read', false);

    // Count design orders that are completed (approved) AND paid - new notifications for admin
    const { count: approvedAndPaid } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('order_type', 'design')
      .eq('design_status', 'completed')
      .eq('payment_status', 'paid');

    return res.status(200).json({
      unreadMessages: unreadMessages || 0,
      approvedAndPaid: approvedAndPaid || 0,
    });
  } catch (err: any) {
    return res.status(200).json({ unreadMessages: 0, approvedAndPaid: 0 });
  }
}

// ==================== PAYU PAYMENT HANDLERS ====================

// PayU Configuration
const PAYU_CONFIG = {
  clientId: process.env.PAYU_CLIENT_ID || '501885',
  clientSecret: process.env.PAYU_CLIENT_SECRET || '81927c33ee2b36ee897bef24ef90a446',
  posId: process.env.PAYU_POS_ID || '501885',
  baseUrl: process.env.PAYU_BASE_URL || 'https://secure.snd.payu.com',
};

async function getPayUToken(): Promise<string> {
  console.log('[PAYU-CREATE] Authenticating with PayU...');
  const response = await fetch(`${PAYU_CONFIG.baseUrl}/pl/standard/user/oauth/authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'ProtoLab3D/1.0',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: PAYU_CONFIG.clientId,
      client_secret: PAYU_CONFIG.clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PAYU-CREATE] Auth failed:', response.status, errorText);
    throw new Error(`PayU authentication failed: ${response.status} ${errorText}`);
  }

  const data: any = await response.json();
  console.log('[PAYU-CREATE] Authentication successful');
  return data.access_token as string;
}

async function createPayUOrder(token: string, orderData: any): Promise<any> {
  console.log('[PAYU-CREATE] Creating PayU order...');
  
  const response = await fetch(`${PAYU_CONFIG.baseUrl}/api/v2_1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'ProtoLab3D/1.0',
    },
    body: JSON.stringify(orderData),
    redirect: 'manual',
  });

  console.log('[PAYU-CREATE] PayU response status:', response.status);
  
  if (response.status === 302) {
    const redirectUri = response.headers.get('location');
    console.log('[PAYU-CREATE] Got redirect URI:', redirectUri);
    return { redirectUri, statusCode: 'SUCCESS' };
  }

  if (response.ok) {
    const result: any = await response.json();
    console.log('[PAYU-CREATE] Order created:', result);
    return {
      redirectUri: result.redirectUri,
      orderId: result.orderId,
      statusCode: result.status?.statusCode || 'SUCCESS',
    };
  }

  const errorText = await response.text();
  console.error('[PAYU-CREATE] Order creation failed:', response.status, errorText);
  throw new Error(`PayU order creation failed: ${response.status}`);
}

async function handlePayUCreateOrder(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[PAYU-CREATE] Starting PayU order creation...');
    const { 
      orderId, 
      amount, 
      description, 
      userId, 
      payMethods,
      shippingAddress,
      requestInvoice,
      businessInfo
    } = req.body;

    if (!orderId || !amount || !description || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: orderId, amount, description, userId'
      });
    }

    // Detect file payment mode (orderId format: file__<orderId>__<messageId>__<attachmentIdx>)
    const isFilePayment = typeof orderId === 'string' && orderId.startsWith('file__');

    const supabase = getSupabase();
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, first_name, last_name, phone')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('[PAYU-CREATE] User not found:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    const customerIp = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
      (req.headers['x-real-ip'] as string) || 
      '127.0.0.1';

    const firstName = userData.first_name || 'Customer';
    const lastName = userData.last_name || firstName;

    let phone = userData.phone || shippingAddress?.phone || '';
    if (phone && !phone.startsWith('+')) {
      phone = '+48' + phone.replace(/\D/g, '');
    }
    if (phone && !phone.match(/^\+48\d{9}$/)) {
      phone = '';
    }

    const token = await getPayUToken();

    const buyer: any = {
      email: userData.email,
      firstName,
      lastName,
      language: 'pl',
    };

    if (phone) {
      buyer.phone = phone;
    }

    if (shippingAddress && shippingAddress.street && shippingAddress.city) {
      const postalCode = shippingAddress.postalCode || shippingAddress.postal_code || '';
      if (postalCode) {
        buyer.delivery = {
          street: shippingAddress.street,
          postalCode: postalCode,
          city: shippingAddress.city,
          countryCode: 'PL',
        };
      }
    }

    const orderPayload: any = {
      customerIp,
      merchantPosId: PAYU_CONFIG.posId,
      description,
      currencyCode: 'PLN',
      totalAmount: Math.round(parseFloat(amount) * 100).toString(),
      extOrderId: orderId,
      products: [
        {
          name: description,
          unitPrice: Math.round(parseFloat(amount) * 100).toString(),
          quantity: '1',
        },
      ],
      buyer,
      notifyUrl: `https://protolab.info/api/payments/payu/notify`,
      continueUrl: isFilePayment
        ? `https://protolab.info/payment-success?filePayment=true&orderId=${orderId}`
        : `https://protolab.info/payment-success?orderId=${orderId}`,
    };

    if (payMethods) {
      orderPayload.payMethods = payMethods;
    }

    const payuResult = await createPayUOrder(token, orderPayload);

    // Only update order payment_status for regular (non-file) payments
    if (!isFilePayment) {
      const updateData: any = {
        payment_status: 'pending',
        payment_method: payMethods?.payMethod?.value || 'redirect',
      };

      if (requestInvoice && businessInfo) {
        updateData.invoice_required = true;
        updateData.invoice_business_info = JSON.stringify(businessInfo);
      }

      await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
    }

    let finalOrderId = payuResult.orderId;
    if (!finalOrderId && payuResult.redirectUri) {
      const match = payuResult.redirectUri.match(/orderId=([^&]+)/);
      if (match) {
        finalOrderId = match[1];
      }
    }

    return res.status(200).json({
      success: true,
      redirectUri: payuResult.redirectUri,
      status: payuResult.status || payuResult.statusCode,
      statusCode: payuResult.statusCode,
      orderId: finalOrderId,
    });

  } catch (error) {
    console.error('[PAYU-CREATE] Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

async function handlePayUNotify(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[PAYU-NOTIFY] Webhook received');
    
    // Import PayU utilities
    const { verifyPayUSignature } = await import('./_lib/payu');
    
    // Get signature from header
    const signature = req.headers['openpayu-signature'] as string | undefined;
    const body = JSON.stringify(req.body);

    console.log('[PAYU-NOTIFY] Received notification:', {
      hasSignature: !!signature,
      orderId: req.body?.order?.orderId,
      extOrderId: req.body?.order?.extOrderId,
      status: req.body?.order?.status,
    });

    // Verify signature
    if (!verifyPayUSignature(body, signature)) {
      console.error('[PAYU-NOTIFY] Signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const notification = req.body;
    const order = notification.order;

    console.log('[PAYU-NOTIFY] Order status:', order.status);

    // Update order status based on PayU status
    let orderStatus: string;
    let paymentStatus: string;

    switch (order.status) {
      case 'COMPLETED':
        orderStatus = 'submitted';
        paymentStatus = 'paid';
        break;
      case 'CANCELED':
        orderStatus = 'suspended';
        paymentStatus = 'failed';
        break;
      case 'WAITING_FOR_CONFIRMATION':
      case 'PENDING':
        orderStatus = 'submitted';
        paymentStatus = 'pending';
        break;
      default:
        console.warn(`[PAYU-NOTIFY] Unknown PayU status: ${order.status}`);
        orderStatus = 'submitted';
        paymentStatus = 'pending';
    }

    const supabase = getSupabase();

    // Check if this is a file payment (extOrderId format: file__<orderId>__<messageId>__<attachmentIdx>)
    const isFilePayment = typeof order.extOrderId === 'string' && order.extOrderId.startsWith('file__');

    if (isFilePayment) {
      const parts = order.extOrderId.split('__');
      // parts: ['file', orderId, messageId, attachmentIdx]
      const messageId = parts[2];
      const attachmentIdx = parseInt(parts[3], 10);

      console.log(`[PAYU-NOTIFY] File payment detected: messageId=${messageId}, attachmentIdx=${attachmentIdx}, status=${paymentStatus}`);

      if (paymentStatus === 'paid') {
        // Fetch the message to get current attachments
        const { data: msgData, error: msgError } = await supabase
          .from('conversation_messages')
          .select('attachments')
          .eq('id', messageId)
          .single();

        if (msgError || !msgData) {
          console.error('[PAYU-NOTIFY] Failed to fetch message:', msgError);
          return res.status(200).send('');
        }

        const attachments = msgData.attachments || [];
        if (attachmentIdx >= 0 && attachmentIdx < attachments.length) {
          attachments[attachmentIdx].payment_status = 'paid';

          const { error: updateError } = await supabase
            .from('conversation_messages')
            .update({ attachments })
            .eq('id', messageId);

          if (updateError) {
            console.error('[PAYU-NOTIFY] Failed to update attachment payment_status:', updateError);
          } else {
            console.log(`[PAYU-NOTIFY] Attachment ${attachmentIdx} in message ${messageId} marked as paid`);
          }
        } else {
          console.error(`[PAYU-NOTIFY] Invalid attachment index: ${attachmentIdx}, total: ${attachments.length}`);
        }
      }

      return res.status(200).send('');
    }

    // Regular order payment — update order in database
    if (order.extOrderId) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          status: orderStatus,
          payu_order_id: order.orderId,
        })
        .eq('id', order.extOrderId);

      if (updateError) {
        console.error('[PAYU-NOTIFY] Failed to update order:', updateError);
        return res.status(500).json({ error: 'Failed to update order' });
      }

      // If payment completed, check if this is a credits purchase
      if (order.status === 'COMPLETED') {
        const { data: orderData } = await supabase
          .from('orders')
          .select('order_type, credits_amount, user_id, design_status')
          .eq('id', order.extOrderId)
          .single();

        if (orderData?.order_type === 'credits_purchase') {
          const creditsAmount = orderData.credits_amount;
          const userId = orderData.user_id;
          
          // Get current balance
          const { data: creditData } = await supabase
            .from('credits')
            .select('balance')
            .eq('user_id', userId)
            .maybeSingle();

          const currentBalance = creditData?.balance || 0;
          const newBalance = currentBalance + creditsAmount;

          // Update balance
          await supabase
            .from('credits')
            .upsert({
              user_id: userId,
              balance: newBalance,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          // Create transaction record
          await supabase
            .from('credits_transactions')
            .insert({
              user_id: userId,
              amount: creditsAmount,
              type: 'purchase',
              description: `Store credit purchase via PayU - Order ${order.extOrderId}`,
              payu_order_id: order.orderId,
              created_at: new Date().toISOString(),
            });

          console.log(`[PAYU-NOTIFY] Credits added for user ${userId}: ${creditsAmount} PLN`);
        }
      }

      console.log(`[PAYU-NOTIFY] Order ${order.extOrderId} updated: status=${orderStatus}, payment=${paymentStatus}`);
    }

    // PayU requires empty 200 response
    return res.status(200).send('');
  } catch (error) {
    console.error('[PAYU-NOTIFY] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process notification',
    });
  }
}

