import { DesignRequest, IDesignRequest, DesignStatus, CreateDesignRequestData, UpdateDesignRequestData, UsageType } from '../models/DesignRequest';
import { conversationsService } from './conversations.service';
import { logger } from '../config/logger';

export interface CreateDesignRequestInput {
  projectName: string;
  ideaDescription: string;
  usageType?: UsageType;
  usageDetails?: string;
  approximateDimensions?: string;
  desiredMaterial?: string;
  attachedFiles?: string[];
  referenceImages?: string[];
  requestChat?: boolean;
  estimatedPrice?: number;
}

export class DesignRequestService {
  async createDesignRequest(userId: string, input: CreateDesignRequestInput): Promise<IDesignRequest> {
    const designRequestData: CreateDesignRequestData = {
      user_id: userId,
      project_name: input.projectName,
      idea_description: input.ideaDescription,
      usage_type: input.usageType,
      usage_details: input.usageDetails,
      approximate_dimensions: input.approximateDimensions,
      desired_material: input.desiredMaterial,
      attached_files: input.attachedFiles || [],
      reference_images: input.referenceImages || [],
      request_chat: input.requestChat || false,
      design_status: 'pending',
      estimated_price: input.estimatedPrice,
      paid_amount: 0,
      payment_status: 'pending',
    };
    
    const designRequest = await DesignRequest.create(designRequestData);
    
    // Auto-create conversation
    try {
      await conversationsService.getOrCreateConversation(
        userId,
        designRequest.id,
        `Design Request: ${input.projectName}`
      );
      logger.info(`Auto-created conversation for design request ${designRequest.id}`);
    } catch (err) {
      logger.error({ err }, `Failed to auto-create conversation for design request ${designRequest.id}`);
    }
    
    return designRequest;
  }

  async getDesignRequestById(id: string): Promise<IDesignRequest | null> {
    return await DesignRequest.findById(id);
  }

  async getUserDesignRequests(userId: string): Promise<IDesignRequest[]> {
    return await DesignRequest.findByUserId(userId);
  }

  async getAllDesignRequests(filters?: {
    status?: DesignStatus;
    userId?: string;
    requestChat?: boolean;
    includeArchived?: boolean;
  }): Promise<IDesignRequest[]> {
    return await DesignRequest.findAll(filters);
  }

  async updateDesignRequest(id: string, data: UpdateDesignRequestData): Promise<IDesignRequest> {
    return await DesignRequest.update(id, data);
  }

  async updateDesignStatus(id: string, status: DesignStatus): Promise<IDesignRequest> {
    return await DesignRequest.updateStatus(id, status);
  }

  async deleteDesignRequest(id: string): Promise<void> {
    await DesignRequest.softDelete(id);
  }

  async getDesignRequestStatistics(userId?: string) {
    return await DesignRequest.getStatistics(userId);
  }

  async getChildPrintJobs(designRequestId: string) {
    return await DesignRequest.getChildPrintJobs(designRequestId);
  }

  async attachDesignFile(id: string, fileUrl: string, adminNotes?: string): Promise<IDesignRequest> {
    return await DesignRequest.update(id, {
      admin_design_file: fileUrl,
      admin_notes: adminNotes,
      design_status: 'completed',
    });
  }

  async setPrice(id: string, finalPrice: number): Promise<IDesignRequest> {
    return await DesignRequest.update(id, {
      final_price: finalPrice,
    });
  }

  async markAsPaid(id: string, amount: number): Promise<IDesignRequest> {
    return await DesignRequest.update(id, {
      paid_amount: amount,
      payment_status: 'paid',
    });
  }
}

export const designRequestService = new DesignRequestService();
