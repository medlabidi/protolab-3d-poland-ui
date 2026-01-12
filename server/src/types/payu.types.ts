/**
 * PayU API Types and Interfaces
 */

export interface PayUOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  grant_type: string;
}

export interface PayUBuyer {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  language?: string;
}

export interface PayUProduct {
  name: string;
  unitPrice: string;
  quantity: string;
}

export interface PayUOrderRequest {
  notifyUrl: string;
  customerIp: string;
  merchantPosId: string;
  description: string;
  currencyCode: string;
  totalAmount: string;
  buyer: PayUBuyer;
  products: PayUProduct[];
  continueUrl?: string;
  payMethods?: {
    payMethod: {
      type: 'BLIK_CODE';
      value: string;
      authorizationCode: string;
    };
  };
}

export interface PayUOrderResponse {
  status: {
    statusCode: string;
    statusDesc?: string;
    code?: string;
    codeLiteral?: string;
  };
  redirectUri?: string;
  orderId?: string;
  extOrderId?: string;
}

export interface PayUNotification {
  order: {
    orderId: string;
    extOrderId?: string;
    orderCreateDate: string;
    notifyUrl: string;
    customerIp: string;
    merchantPosId: string;
    description: string;
    currencyCode: string;
    totalAmount: string;
    status: string;
    buyer?: PayUBuyer;
    products: PayUProduct[];
    payMethod?: {
      type: string;
    };
  };
  localReceiptDateTime?: string;
  properties?: any[];
}

export enum PayUStatusCode {
  SUCCESS = 'SUCCESS',
  WARNING_CONTINUE_3DS = 'WARNING_CONTINUE_3DS',
  WARNING_CONTINUE_CVV = 'WARNING_CONTINUE_CVV',
  WARNING_CONTINUE_REDIRECT = 'WARNING_CONTINUE_REDIRECT',
  ERROR_SYNTAX = 'ERROR_SYNTAX',
  ERROR_VALUE_INVALID = 'ERROR_VALUE_INVALID',
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  OPENPAYU_ERROR_INTERNAL = 'OPENPAYU_ERROR_INTERNAL',
}

export enum PayUOrderStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  WAITING_FOR_CONFIRMATION = 'WAITING_FOR_CONFIRMATION',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum BLIKErrorCode {
  INVALID_CODE = 'BLIK_INVALID_CODE',
  EXPIRED_CODE = 'BLIK_EXPIRED_CODE',
  USER_CANCELLED = 'BLIK_USER_CANCELLED',
  LIMIT_EXCEEDED = 'BLIK_LIMIT_EXCEEDED',
}
