import { VercelRequest, VercelResponse } from '@vercel/node';
import { IncomingForm, Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';

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

// Lazy imports
let getSupabase: any;
let verifyAccessToken: any;
let sendVerificationEmail: any;

const initModules = async () => {
  if (!getSupabase) {
    const supabaseModule = await import('../_lib/supabase');
    getSupabase = supabaseModule.getSupabase;
  }
  if (!verifyAccessToken) {
    const jwtModule = await import('../_lib/jwt');
    verifyAccessToken = jwtModule.verifyAccessToken;
  }
  if (!sendVerificationEmail) {
    try {
      const emailModule = await import('../_lib/email');
      sendVerificationEmail = emailModule.sendVerificationEmail;
    } catch (error) {
      console.warn('Email module not available, email notifications will be skipped');
      sendVerificationEmail = async () => ({ success: false });
    }
  }
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://protolab-3d-poland.vercel.app' 
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS').json({});
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  await initModules();

  try {
    const supabase = getSupabase();

    // GET: Retrieve design requests
    if (req.method === 'GET') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyAccessToken(token);

      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Check if user is admin
      const isAdmin = decoded.role === 'admin';

      let query = supabase
        .from('design_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Non-admin users can only see their own requests
      if (!isAdmin) {
        query = query.or(`user_id.eq.${decoded.userId},email.eq.${decoded.email}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching design requests:', error);
        return res.status(500).json({ error: 'Failed to fetch design requests' });
      }

      return res.status(200).json(data || []);
    }

    // POST: Create new design request
    if (req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';

      let requestData: any = {};
      let referenceFiles: any[] = [];

      // Handle multipart form data (with file uploads)
      if (contentType.includes('multipart/form-data')) {
        const { fields, files } = await parseFormData(req);

        // Extract field values
        const getFieldValue = (field: any): string => {
          if (Array.isArray(field)) return field[0];
          return field || '';
        };

        requestData = {
          name: getFieldValue(fields.name),
          email: getFieldValue(fields.email),
          phone: getFieldValue(fields.phone),
          projectDescription: getFieldValue(fields.projectDescription),
        };

        // Handle file uploads (if any)
        // In production, these would be uploaded to storage (S3, Supabase Storage, etc.)
        // For now, we'll just store file metadata
        if (files.referenceFiles) {
          const fileList = Array.isArray(files.referenceFiles) ? files.referenceFiles : [files.referenceFiles];
          referenceFiles = fileList.map((file: any) => ({
            name: file.originalFilename || file.newFilename,
            size: file.size,
            type: file.mimetype,
            // In production, upload to storage and store URL
            url: `/uploads/${file.newFilename}`
          }));
        }
      } else {
        // Handle JSON data
        requestData = req.body;
      }

      // Validate required fields
      if (!requestData.name || !requestData.email || !requestData.projectDescription) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, email, and projectDescription are required' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(requestData.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Check if user exists and get user_id
      let userId = null;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', requestData.email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
      }

      // Insert design request
      const { data: newRequest, error: insertError } = await supabase
        .from('design_requests')
        .insert({
          user_id: userId,
          name: requestData.name,
          email: requestData.email,
          phone: requestData.phone || null,
          project_description: requestData.projectDescription,
          reference_files: referenceFiles,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating design request:', insertError);
        return res.status(500).json({ error: 'Failed to create design request' });
      }

      // Send confirmation email to customer
      try {
        const { Resend } = await import('resend');
        const resendKey = process.env.RESEND_API_KEY;
        const fromEmail = process.env.FROM_EMAIL || 'noreply@protolab.info';
        
        if (resendKey) {
          const resend = new Resend(resendKey);
          
          await resend.emails.send({
            from: fromEmail,
            to: requestData.email,
            subject: 'ProtoLab 3D - Design Request Received',
            html: `
              <h2>Design Request Confirmation</h2>
              <p>Hello ${requestData.name},</p>
              <p>We have received your 3D design request. Our team will review it and contact you shortly.</p>
              <p><strong>Request Details:</strong></p>
              <ul>
                <li>Request ID: ${newRequest.id}</li>
                <li>Submitted: ${new Date().toLocaleString()}</li>
              </ul>
              <p>Thank you for choosing ProtoLab 3D!</p>
            `
          });

          // Send notification to admin
          const adminEmail = process.env.ADMIN_EMAIL || 'admin@protolab3d.com';
          await resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: 'New Design Request Received',
            html: `
              <h2>New Design Request</h2>
              <p><strong>From:</strong> ${requestData.name} (${requestData.email})</p>
              <p><strong>Phone:</strong> ${requestData.phone || 'Not provided'}</p>
              <p><strong>Description:</strong></p>
              <p>${requestData.projectDescription}</p>
              <p><strong>Files:</strong> ${referenceFiles.length} file(s) uploaded</p>
              <p><a href="${process.env.FRONTEND_URL || 'https://protolab-3d-poland.vercel.app'}/admin/design-requests/${newRequest.id}">View Request</a></p>
            `
          });
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails
      }

      return res.status(201).json({
        message: 'Design request submitted successfully',
        request: newRequest
      });
    }

    // PUT: Update design request (admin only)
    if (req.method === 'PUT') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyAccessToken(token);

      if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id, status, admin_notes, estimated_completion_date, price, final_files } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Request ID is required' });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
      if (estimated_completion_date) updateData.estimated_completion_date = estimated_completion_date;
      if (price !== undefined) updateData.price = price;
      if (final_files) updateData.final_files = final_files;

      const { data: updatedRequest, error: updateError } = await supabase
        .from('design_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating design request:', updateError);
        return res.status(500).json({ error: 'Failed to update design request' });
      }

      return res.status(200).json({
        message: 'Design request updated successfully',
        request: updatedRequest
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Design requests API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
