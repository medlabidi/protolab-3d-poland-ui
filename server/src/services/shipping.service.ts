import { getSupabase } from '../config/database';
import { logger } from '../config/logger';

interface ShippingLabel {
  trackingCode: string;
  labelUrl: string;
  labelData: string;
}

export class ShippingService {
  /**
   * Generate a shipping label for an order
   */
  async generateLabel(
    orderId: string,
    shippingMethod: string,
    address?: string
  ): Promise<ShippingLabel> {
    const supabase = getSupabase();

    // Fetch order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, users(name, email, phone)')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      throw new Error('Order not found');
    }

    // Generate tracking code
    const trackingCode = this.generateTrackingCode(shippingMethod);

    // Generate HTML label
    const labelData = await this.createLabelPDF(order, shippingMethod, trackingCode, address);

    // In a real implementation, you would upload this to storage and convert to PDF
    // For now, we'll return a data URL with HTML
    const labelUrl = `data:text/html;base64,${Buffer.from(labelData).toString('base64')}`;

    // Update order with tracking code
    await supabase
      .from('orders')
      .update({ tracking_code: trackingCode })
      .eq('id', orderId);

    logger.info(`Generated shipping label for order ${orderId} with tracking ${trackingCode}`);

    return {
      trackingCode,
      labelUrl,
      labelData,
    };
  }

  /**
   * Generate a tracking code based on shipping method
   */
  private generateTrackingCode(shippingMethod: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    let prefix = '';
    switch (shippingMethod) {
      case 'inpost':
        prefix = 'INP';
        break;
      case 'dpd':
      case 'courier':
        prefix = 'DPD';
        break;
      default:
        prefix = 'SHP';
    }

    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Create a simple HTML shipping label (to be replaced with PDF in production)
   */
  private async createLabelPDF(
    order: any,
    shippingMethod: string,
    trackingCode: string,
    address?: string
  ): Promise<string> {
    // Generate HTML label that can be printed or converted to PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; }
          .header { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
          .tracking { text-align: center; font-size: 24px; font-weight: bold; padding: 20px; border: 2px solid #000; margin: 20px 0; }
          .section { margin: 15px 0; }
          .label { font-weight: bold; font-size: 12px; }
          .value { font-size: 14px; margin-top: 5px; }
          .footer { text-align: center; font-size: 10px; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">PROTOLAB 3D POLAND<br><span style="font-size: 14px;">Shipping Label</span></div>
        
        <div class="tracking">${trackingCode}</div>
        
        <div class="section">
          <div class="label">SHIPPING METHOD:</div>
          <div class="value">${shippingMethod.toUpperCase()}</div>
        </div>
        
        <div class="section">
          <div class="label">SHIP TO:</div>
          <div class="value">
            ${order.users?.name || 'N/A'}<br>
            ${order.users?.email || 'N/A'}<br>
            ${order.users?.phone ? `Tel: ${order.users.phone}<br>` : ''}
            ${address ? `<br>${address.replace(/\n/g, '<br>')}` : ''}
          </div>
        </div>
        
        <div class="section">
          <div class="label">ORDER DETAILS:</div>
          <div class="value">
            Order ID: ${order.id.substring(0, 8)}...<br>
            Date: ${new Date(order.created_at).toLocaleDateString('en-GB')}<br>
            Items: ${order.quantity}x ${order.file_name}
          </div>
        </div>
        
        <div class="footer">
          Handle with care - 3D Printed Parts<br>
          www.protolab3d.pl
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  /**
   * Get tracking information (mock implementation)
   */
  async getTrackingInfo(trackingCode: string): Promise<any> {
    // In a real implementation, this would call InPost/DPD APIs
    // For now, return mock data
    return {
      trackingCode,
      status: 'in_transit',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      events: [
        {
          timestamp: new Date().toISOString(),
          status: 'Label Created',
          location: 'Warsaw, Poland',
        },
      ],
    };
  }
}

export const shippingService = new ShippingService();
