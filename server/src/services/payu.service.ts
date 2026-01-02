import axios from 'axios';
import crypto from 'crypto';
import { payuConfig } from '../config/payu.config';
import {
  PayUOAuthResponse,
  PayUOrderRequest,
  PayUOrderResponse,
  PayUNotification,
  PayUStatusCode,
} from '../types/payu.types';
import { logger } from '../config/logger';

/**
 * PayU Payment Service
 * Handles BLIK payment integration with PayU sandbox
 */
export class PayUService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Get OAuth access token from PayU
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post<PayUOAuthResponse>(
        `${payuConfig.apiUrl}/pl/standard/user/oauth/authorize`,
        new URLSearchParams({
          grant_type: payuConfig.grantType,
          client_id: payuConfig.clientId,
          client_secret: payuConfig.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry time with 60 second buffer
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

      logger.info('PayU OAuth token obtained successfully');
      return this.accessToken;
    } catch (error: any) {
      logger.error('Failed to obtain PayU OAuth token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with PayU');
    }
  }

  /**
   * Create a BLIK payment order
   */
  async createBlikOrder(
    orderId: string,
    amount: number,
    blikCode: string,
    buyer: {
      email: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
    },
    description: string,
    customerIp: string
  ): Promise<PayUOrderResponse> {
    try {
      const token = await this.getAccessToken();

      // Convert amount to grosze (1 PLN = 100 grosze)
      const totalAmount = Math.round(amount * 100).toString();

      const orderData: PayUOrderRequest = {
        notifyUrl: payuConfig.notifyUrl,
        customerIp,
        merchantPosId: payuConfig.posId,
        description,
        currencyCode: payuConfig.currencyCode,
        totalAmount,
        buyer: {
          email: buyer.email,
          phone: buyer.phone,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          language: 'pl',
        },
        products: [
          {
            name: description,
            unitPrice: totalAmount,
            quantity: '1',
          },
        ],
        continueUrl: payuConfig.continueUrl,
        payMethods: {
          payMethod: {
            type: 'BLIK_CODE',
            value: blikCode,
            authorizationCode: blikCode,
          },
        },
      };

      const response = await axios.post<PayUOrderResponse>(
        `${payuConfig.apiUrl}/api/v2_1/orders`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      logger.info({
        orderId,
        payuOrderId: response.data.orderId,
        status: response.data.status.statusCode,
      }, `PayU BLIK order created: ${response.data.orderId}`);

      return response.data;
    } catch (error: any) {
      logger.error({
        orderId,
        error: error.response?.data || error.message,
      }, 'Failed to create PayU BLIK order');

      // Return error response in PayU format
      return {
        status: {
          statusCode: error.response?.data?.status?.statusCode || 'ERROR',
          statusDesc: error.response?.data?.status?.statusDesc,
          code: error.response?.data?.status?.code,
          codeLiteral: error.response?.data?.status?.codeLiteral,
        },
        orderId: error.response?.data?.orderId,
      };
    }
  }

  /**
   * Create a standard payment order (without BLIK code)
   */
  async createOrder(
    orderId: string,
    amount: number,
    buyer: {
      email: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
    },
    description: string,
    customerIp: string
  ): Promise<PayUOrderResponse> {
    try {
      const token = await this.getAccessToken();

      // Convert amount to grosze (1 PLN = 100 grosze)
      const totalAmount = Math.round(amount * 100).toString();

      const orderData: Omit<PayUOrderRequest, 'payMethods'> = {
        notifyUrl: payuConfig.notifyUrl,
        customerIp,
        merchantPosId: payuConfig.posId,
        description,
        currencyCode: payuConfig.currencyCode,
        totalAmount,
        buyer: {
          email: buyer.email,
          phone: buyer.phone,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          language: 'pl',
        },
        products: [
          {
            name: description,
            unitPrice: totalAmount,
            quantity: '1',
          },
        ],
        continueUrl: payuConfig.continueUrl,
      };

      const response = await axios.post<PayUOrderResponse>(
        `${payuConfig.apiUrl}/api/v2_1/orders`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      logger.info({
        orderId,
        payuOrderId: response.data.orderId,
        status: response.data.status.statusCode,
      }, `PayU order created: ${response.data.orderId}`);

      return response.data;
    } catch (error: any) {
      logger.error({
        orderId,
        error: error.response?.data || error.message,
      }, 'Failed to create PayU order');

      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify PayU notification signature
   */
  verifyNotificationSignature(
    notification: string,
    signature: string
  ): boolean {
    const hash = crypto
      .createHash('md5')
      .update(notification + payuConfig.secondKey)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Get order status from PayU
   */
  async getOrderStatus(payuOrderId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${payuConfig.apiUrl}/api/v2_1/orders/${payuOrderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error({
        payuOrderId,
        error: error.response?.data || error.message,
      }, 'Failed to get PayU order status');
      throw new Error('Failed to get order status');
    }
  }

  /**
   * Cancel PayU order
   */
  async cancelOrder(payuOrderId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();

      await axios.delete(
        `${payuConfig.apiUrl}/api/v2_1/orders/${payuOrderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      logger.info(`PayU order cancelled: ${payuOrderId}`);
    } catch (error: any) {
      logger.error({
        payuOrderId,
        error: error.response?.data || error.message,
      }, 'Failed to cancel PayU order');
      throw new Error('Failed to cancel order');
    }
  }
}

export const payuService = new PayUService();
