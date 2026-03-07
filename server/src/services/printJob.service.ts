import { PrintJob, IPrintJob, PrintJobStatus, CreatePrintJobData, UpdatePrintJobData } from '../models/PrintJob';
import { conversationsService } from './conversations.service';
import { logger } from '../config/logger';

export interface CreatePrintJobInput {
  fileName: string;
  fileUrl: string;
  filePath?: string;
  material: string;
  color: string;
  layerHeight: number;
  infill: number;
  quantity: number;
  shippingMethod: string;
  shippingAddress?: string;
  price?: number;
  projectName?: string;
  materialWeight?: number;
  printTime?: number;
  parentDesignRequestId?: string;
}

export class PrintJobService {
  async createPrintJob(userId: string, input: CreatePrintJobInput): Promise<IPrintJob> {
    const printJobData: CreatePrintJobData = {
      user_id: userId,
      file_url: input.fileUrl,
      file_path: input.filePath,
      file_name: input.fileName,
      material: input.material,
      color: input.color,
      layer_height: input.layerHeight,
      infill: input.infill,
      quantity: input.quantity,
      material_weight: input.materialWeight,
      print_time: input.printTime,
      price: input.price || 0,
      paid_amount: input.price || 0,
      payment_status: 'paid',
      status: 'submitted',
      shipping_method: input.shippingMethod as any,
      shipping_address: input.shippingAddress,
      project_name: input.projectName,
      parent_design_request_id: input.parentDesignRequestId,
    };
    
    const printJob = await PrintJob.create(printJobData);
    
    // Auto-create conversation
    try {
      await conversationsService.getOrCreateConversation(
        userId,
        printJob.id,
        `Print Job: ${input.fileName}`
      );
      logger.info(`Auto-created conversation for print job ${printJob.id}`);
    } catch (err) {
      logger.error({ err }, `Failed to auto-create conversation for print job ${printJob.id}`);
    }
    
    return printJob;
  }

  async getPrintJobById(id: string): Promise<IPrintJob | null> {
    return await PrintJob.findById(id);
  }

  async getUserPrintJobs(userId: string): Promise<IPrintJob[]> {
    return await PrintJob.findByUserId(userId);
  }

  async getAllPrintJobs(filters?: {
    status?: PrintJobStatus;
    userId?: string;
    includeArchived?: boolean;
  }): Promise<IPrintJob[]> {
    return await PrintJob.findAll(filters);
  }

  async updatePrintJob(id: string, data: UpdatePrintJobData): Promise<IPrintJob> {
    return await PrintJob.update(id, data);
  }

  async updatePrintJobStatus(id: string, status: PrintJobStatus): Promise<IPrintJob> {
    return await PrintJob.updateStatus(id, status);
  }

  async deletePrintJob(id: string): Promise<void> {
    await PrintJob.softDelete(id);
  }

  async getPrintJobStatistics(userId?: string) {
    return await PrintJob.getStatistics(userId);
  }

  async createPrintJobFromDesign(
    designRequestId: string,
    userId: string,
    printData: {
      material: string;
      color: string;
      layerHeight: number;
      infill: number;
      quantity: number;
      price: number;
      fileName: string;
      fileUrl: string;
      shippingMethod: string;
      shippingAddress?: string;
    }
  ): Promise<IPrintJob> {
    const input: CreatePrintJobInput = {
      ...printData,
      parentDesignRequestId: designRequestId,
    };
    
    return await this.createPrintJob(userId, input);
  }
}

export const printJobService = new PrintJobService();
