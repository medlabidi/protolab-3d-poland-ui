import { VercelRequest, VercelResponse } from '@vercel/node';

// Type definition for authenticated requests
interface AuthenticatedRequest extends VercelRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Lazy imports
let getSupabase: any;
let verifyAccessToken: any;

const initModules = async () => {
  if (!getSupabase) {
    const supabaseModule = await import('../_lib/supabase');
    getSupabase = supabaseModule.getSupabase;
  }
  if (!verifyAccessToken) {
    const jwtModule = await import('../_lib/jwt');
    verifyAccessToken = jwtModule.verifyAccessToken;
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
    return res.status(200).setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS').json({});
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  await initModules();

  try {
    const supabase = getSupabase();

    // GET: Retrieve appointments or check availability
    if (req.method === 'GET') {
      const { date } = req.query;

      // Check availability for a specific date
      if (date) {
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select('appointment_time')
          .eq('appointment_date', date)
          .eq('status', 'scheduled');

        if (error) {
          console.error('Error fetching availability:', error);
          return res.status(500).json({ error: 'Failed to check availability' });
        }

        // Define available time slots (9:00 AM to 6:00 PM, 30-minute intervals)
        const allSlots = [];
        for (let hour = 9; hour < 18; hour++) {
          allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
          allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }

        // Filter out booked slots
        const bookedSlots = appointments.map((apt: any) => apt.appointment_time);
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        return res.status(200).json({ 
          date,
          availableSlots,
          bookedSlots 
        });
      }

      // Get all appointments (with authentication)
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
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      // Non-admin users can only see their own appointments
      if (!isAdmin) {
        query = query.or(`user_id.eq.${decoded.userId},email.eq.${decoded.email}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching appointments:', error);
        return res.status(500).json({ error: 'Failed to fetch appointments' });
      }

      return res.status(200).json(data || []);
    }

    // POST: Create new appointment
    if (req.method === 'POST') {
      const { name, email, phone, topic, date, time, message } = req.body;

      // Validate required fields
      if (!name || !email || !topic || !date || !time) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, email, topic, date, and time are required' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate date (must be in the future and not a weekend)
      const appointmentDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        return res.status(400).json({ error: 'Appointment date must be in the future' });
      }

      const dayOfWeek = appointmentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return res.status(400).json({ error: 'Appointments are only available on weekdays' });
      }

      // Check if the time slot is available
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('appointment_date', date)
        .eq('appointment_time', time)
        .eq('status', 'scheduled')
        .single();

      if (existingAppointment) {
        return res.status(409).json({ error: 'This time slot is already booked' });
      }

      // Check if user exists and get user_id
      let userId = null;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
      }

      // Insert appointment
      const { data: newAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert({
          user_id: userId,
          name,
          email,
          phone: phone || null,
          topic,
          appointment_date: date,
          appointment_time: time,
          message: message || null,
          status: 'scheduled'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating appointment:', insertError);
        return res.status(500).json({ error: 'Failed to create appointment' });
      }

      // Format date and time for email
      const formattedDate = new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Send confirmation email to customer
      try {
        const { Resend } = await import('resend');
        const resendKey = process.env.RESEND_API_KEY;
        const fromEmail = process.env.FROM_EMAIL || 'noreply@protolab.info';
        
        if (resendKey) {
          const resend = new Resend(resendKey);
          
          await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: 'ProtoLab 3D - Appointment Confirmation',
            html: `
              <h2>Appointment Confirmed</h2>
              <p>Hello ${name},</p>
              <p>Your consultation appointment has been scheduled successfully!</p>
              <p><strong>Appointment Details:</strong></p>
              <ul>
                <li>Date: ${formattedDate}</li>
                <li>Time: ${time}</li>
                <li>Topic: ${topic}</li>
                <li>Confirmation ID: ${newAppointment.id}</li>
              </ul>
              <p>We'll send you a meeting link before the scheduled time.</p>
              <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
              <p>Thank you for choosing ProtoLab 3D!</p>
            `
          });

          // Send notification to admin
          const adminEmail = process.env.ADMIN_EMAIL || 'admin@protolab3d.com';
          await resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: 'New Appointment Scheduled',
            html: `
              <h2>New Appointment</h2>
              <p><strong>Client:</strong> ${name} (${email})</p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${time}</p>
              <p><strong>Topic:</strong> ${topic}</p>
              ${message ? `<p><strong>Message:</strong></p><p>${message}</p>` : ''}
              <p><a href="${process.env.FRONTEND_URL || 'https://protolab-3d-poland.vercel.app'}/admin/appointments/${newAppointment.id}">View Appointment</a></p>
            `
          });
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails
      }

      return res.status(201).json({
        message: 'Appointment scheduled successfully',
        appointment: newAppointment
      });
    }

    // PUT: Update appointment (admin only)
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

      const { id, status, admin_notes, meeting_link } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Appointment ID is required' });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
      if (meeting_link !== undefined) updateData.meeting_link = meeting_link;

      const { data: updatedAppointment, error: updateError } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating appointment:', updateError);
        return res.status(500).json({ error: 'Failed to update appointment' });
      }

      // If meeting link was added, send it to the customer
      if (meeting_link && updatedAppointment) {
        try {
          const formattedDate = new Date(updatedAppointment.appointment_date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });

          const { Resend } = await import('resend');
          const resendKey = process.env.RESEND_API_KEY;
          const fromEmail = process.env.FROM_EMAIL || 'noreply@protolab.info';
          
          if (resendKey) {
            const resend = new Resend(resendKey);
            
            await resend.emails.send({
              from: fromEmail,
              to: updatedAppointment.email,
              subject: 'ProtoLab 3D - Meeting Link for Your Appointment',
              html: `
                <h2>Your Meeting Link is Ready</h2>
                <p>Hello ${updatedAppointment.name},</p>
                <p>Here's the meeting link for your upcoming consultation:</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${updatedAppointment.appointment_time}</p>
                <p><strong>Meeting Link:</strong> <a href="${meeting_link}">${meeting_link}</a></p>
                <p>We look forward to speaking with you!</p>
              `
            });
          }
        } catch (emailError) {
          console.error('Error sending meeting link email:', emailError);
        }
      }

      return res.status(200).json({
        message: 'Appointment updated successfully',
        appointment: updatedAppointment
      });
    }

    // DELETE: Cancel appointment
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Appointment ID is required' });
      }

      // Update status to cancelled instead of deleting
      const { data: cancelledAppointment, error: cancelError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (cancelError) {
        console.error('Error cancelling appointment:', cancelError);
        return res.status(500).json({ error: 'Failed to cancel appointment' });
      }

      return res.status(200).json({
        message: 'Appointment cancelled successfully',
        appointment: cancelledAppointment
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Appointments API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
