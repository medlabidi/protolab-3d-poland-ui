// API helper functions for design requests and appointments
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Design Requests API
 */

export interface DesignRequest {
  id?: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  project_description: string;
  reference_files?: any[];
  status?: 'pending' | 'in_review' | 'in_progress' | 'completed' | 'cancelled';
  admin_notes?: string;
  estimated_completion_date?: string;
  final_files?: any[];
  price?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DesignRequestFormData {
  name: string;
  email: string;
  phone?: string;
  projectDescription: string;
  referenceFiles?: File[];
}

/**
 * Submit a new design request
 */
export async function submitDesignRequest(data: DesignRequestFormData): Promise<{ success: boolean; message?: string; request?: DesignRequest }> {
  try {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    formData.append('projectDescription', data.projectDescription);
    
    // Add files if any
    if (data.referenceFiles && data.referenceFiles.length > 0) {
      data.referenceFiles.forEach((file) => {
        formData.append('referenceFiles', file);
      });
    }

    const response = await fetch(`${API_URL}/design-requests`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit design request');
    }

    const result = await response.json();
    return { success: true, message: result.message, request: result.request };
  } catch (error: any) {
    console.error('Error submitting design request:', error);
    return { success: false, message: error.message || 'Failed to submit design request' };
  }
}

/**
 * Get user's design requests (requires authentication)
 */
export async function getDesignRequests(): Promise<{ success: boolean; requests?: DesignRequest[]; error?: string }> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/design-requests`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch design requests');
    }

    const requests = await response.json();
    return { success: true, requests };
  } catch (error: any) {
    console.error('Error fetching design requests:', error);
    return { success: false, error: error.message || 'Failed to fetch design requests' };
  }
}

/**
 * Appointments API
 */

export interface Appointment {
  id?: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  topic: string;
  appointment_date: string;
  appointment_time: string;
  message?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  admin_notes?: string;
  meeting_link?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentFormData {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  date: string;
  time: string;
  message?: string;
}

/**
 * Check available time slots for a specific date
 */
export async function checkAvailability(date: string): Promise<{ success: boolean; availableSlots?: string[]; bookedSlots?: string[]; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/appointments?date=${encodeURIComponent(date)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check availability');
    }

    const result = await response.json();
    return { success: true, availableSlots: result.availableSlots, bookedSlots: result.bookedSlots };
  } catch (error: any) {
    console.error('Error checking availability:', error);
    return { success: false, error: error.message || 'Failed to check availability' };
  }
}

/**
 * Book a new appointment
 */
export async function bookAppointment(data: AppointmentFormData): Promise<{ success: boolean; message?: string; appointment?: Appointment }> {
  try {
    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to book appointment');
    }

    const result = await response.json();
    return { success: true, message: result.message, appointment: result.appointment };
  } catch (error: any) {
    console.error('Error booking appointment:', error);
    return { success: false, message: error.message || 'Failed to book appointment' };
  }
}

/**
 * Get user's appointments (requires authentication)
 */
export async function getAppointments(): Promise<{ success: boolean; appointments?: Appointment[]; error?: string }> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/appointments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch appointments');
    }

    const appointments = await response.json();
    return { success: true, appointments };
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return { success: false, error: error.message || 'Failed to fetch appointments' };
  }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(appointmentId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/appointments?id=${encodeURIComponent(appointmentId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel appointment');
    }

    const result = await response.json();
    return { success: true, message: result.message };
  } catch (error: any) {
    console.error('Error cancelling appointment:', error);
    return { success: false, error: error.message || 'Failed to cancel appointment' };
  }
}
