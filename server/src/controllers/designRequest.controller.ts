import { Request, Response, NextFunction } from 'express';
import { designRequestService } from '../services/designRequest.service';

class DesignRequestController {
  /**
   * Create a new design request
   * POST /api/design-requests
   */
  async createDesignRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      
      // Extract form data
      const { 
        name, 
        email, 
        phone, 
        projectDescription,
        ideaDescription,
        usage,
        usageDetails,
        approximateDimensions,
        desiredMaterial,
        requestChat,
        projectName
      } = req.body;

      // Get user_id if authenticated (optional)
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required. Please log in to submit a design request.'
        });
      }

      // Validate required fields
      const description = ideaDescription || projectDescription;
      const title = projectName || name || 'Design Request';

      if (!description) {
        return res.status(400).json({
          error: 'Missing required field: project description or idea description'
        });
      }

      // Prepare files array
      const referenceFiles = files?.map(file => file.path) || [];
      
      // Create design request input matching service expectations
      const input = {
        projectName: title,
        ideaDescription: description,
        usageType: usage as any,
        usageDetails: usageDetails,
        approximateDimensions: approximateDimensions,
        desiredMaterial: desiredMaterial,
        attachedFiles: referenceFiles,
        requestChat: requestChat === 'true' || requestChat === true,
      };

      const designRequest = await designRequestService.createDesignRequest(userId, input);

      res.status(201).json({
        message: 'Design request submitted successfully',
        request: designRequest
      });
    } catch (error: any) {
      console.error('Error creating design request:', error);
      res.status(500).json({
        error: 'Failed to create design request',
        details: error.message
      });
    }
  }

  /**
   * Get user's design requests
   * GET /api/design-requests/my
   */
  async getMyDesignRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const designRequests = await designRequestService.getUserDesignRequests(userId);

      res.json(designRequests);
    } catch (error: any) {
      console.error('Error fetching design requests:', error);
      res.status(500).json({
        error: 'Failed to fetch design requests',
        details: error.message
      });
    }
  }

  /**
   * Get a single design request by ID
   * GET /api/design-requests/:id
   */
  async getDesignRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const designRequest = await designRequestService.getDesignRequestById(id);

      if (!designRequest) {
        return res.status(404).json({ error: 'Design request not found' });
      }

      // Check if user owns this request (if authenticated)
      if (userId && designRequest.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(designRequest);
    } catch (error: any) {
      console.error('Error fetching design request:', error);
      res.status(500).json({
        error: 'Failed to fetch design request',
        details: error.message
      });
    }
  }
}

export const designRequestController = new DesignRequestController();
