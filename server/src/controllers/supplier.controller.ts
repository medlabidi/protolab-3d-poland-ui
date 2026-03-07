import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { supplierService } from '../services/supplier.service';
import { logger } from '../config/logger';

export class SupplierController {
  // Get all suppliers
  async getAllSuppliers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const suppliers = await supplierService.getAllSuppliers();
      res.json({ suppliers, count: suppliers.length });
    } catch (error) {
      next(error);
    }
  }

  // Get active suppliers only
  async getActiveSuppliers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const suppliers = await supplierService.getActiveSuppliers();
      res.json({ suppliers, count: suppliers.length });
    } catch (error) {
      next(error);
    }
  }

  // Get preferred suppliers
  async getPreferredSuppliers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const suppliers = await supplierService.getPreferredSuppliers();
      res.json({ suppliers, count: suppliers.length });
    } catch (error) {
      next(error);
    }
  }

  // Get suppliers by material type
  async getSuppliersByMaterial(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { materialType } = req.params;
      const suppliers = await supplierService.getSuppliersByMaterial(materialType);
      res.json({ suppliers, count: suppliers.length });
    } catch (error) {
      next(error);
    }
  }

  // Get supplier by ID
  async getSupplierById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const supplier = await supplierService.getSupplierById(id);
      
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }
      
      res.json({ supplier });
    } catch (error) {
      next(error);
    }
  }

  // Create new supplier
  async createSupplier(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplierData = req.body;
      const userId = req.user?.id;
      
      const supplier = await supplierService.createSupplier(supplierData, userId);
      
      res.status(201).json({ 
        message: 'Supplier created successfully',
        supplier 
      });
    } catch (error) {
      next(error);
    }
  }

  // Update supplier
  async updateSupplier(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.id;
      
      const supplier = await supplierService.updateSupplier(id, updates, userId);
      
      res.json({ 
        message: 'Supplier updated successfully',
        supplier 
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete supplier
  async deleteSupplier(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      await supplierService.deleteSupplier(id);
      
      logger.info({ supplierId: id, adminId: req.user?.id }, 'Supplier deleted by admin');
      
      res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Get supplier statistics
  async getSupplierStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await supplierService.getSupplierStats();
      res.json({ stats });
    } catch (error) {
      next(error);
    }
  }

  // Update supplier order statistics
  async updateSupplierStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { orderAmount } = req.body;
      
      if (!orderAmount || orderAmount <= 0) {
        res.status(400).json({ error: 'Valid order amount is required' });
        return;
      }
      
      await supplierService.updateSupplierStats(id, orderAmount);
      
      res.json({ message: 'Supplier statistics updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const supplierController = new SupplierController();
