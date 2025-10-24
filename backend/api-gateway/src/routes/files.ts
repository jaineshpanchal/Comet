import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  uploadAvatar,
  uploadDocument,
  uploadArtifact,
  uploadMultiple,
  uploadSingle,
} from '../middleware/upload';
import {
  StorageService,
  FileCategory,
  FileAccess,
} from '../services/storageService';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/files/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (max 5MB)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post('/avatar', authenticateToken, uploadAvatar, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please provide an avatar file',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400,
      });
    }

    // Upload to S3
    const result = await StorageService.uploadFile(
      file.buffer,
      file.originalname,
      {
        category: FileCategory.AVATAR,
        access: FileAccess.PUBLIC,
        contentType: file.mimetype,
        metadata: {
          userId: user.id,
          originalName: file.originalname,
        },
      }
    );

    // TODO: Update user avatar URL in database
    // await db.user.update({ where: { id: user.id }, data: { avatar: result.url } });

    const response: ApiResponse = {
      success: true,
      data: {
        key: result.key,
        url: result.url,
        size: result.size,
        contentType: result.contentType,
      },
      message: 'Avatar uploaded successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    logger.info('Avatar uploaded', {
      userId: user.id,
      key: result.key,
      size: result.size,
    });

    res.json(response);
  } catch (error: any) {
    logger.error('Avatar upload failed', {
      error: error.message,
      userId: (req as any).user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'Avatar upload failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/files/document:
 *   post:
 *     summary: Upload a document
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file (max 50MB)
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
router.post('/document', authenticateToken, uploadDocument, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please provide a document file',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400,
      });
    }

    const result = await StorageService.uploadFile(
      file.buffer,
      file.originalname,
      {
        category: FileCategory.ATTACHMENT,
        access: FileAccess.PRIVATE,
        contentType: file.mimetype,
        metadata: {
          userId: user.id,
          originalName: file.originalname,
        },
      }
    );

    const response: ApiResponse = {
      success: true,
      data: {
        key: result.key,
        url: result.url,
        size: result.size,
        contentType: result.contentType,
      },
      message: 'Document uploaded successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    logger.info('Document uploaded', {
      userId: user.id,
      key: result.key,
      size: result.size,
    });

    res.json(response);
  } catch (error: any) {
    logger.error('Document upload failed', {
      error: error.message,
      userId: (req as any).user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'Document upload failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/files/artifact:
 *   post:
 *     summary: Upload build artifact
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               artifact:
 *                 type: string
 *                 format: binary
 *                 description: Artifact file (max 500MB)
 *               projectId:
 *                 type: string
 *                 description: Project ID
 *               pipelineRunId:
 *                 type: string
 *                 description: Pipeline run ID
 *     responses:
 *       200:
 *         description: Artifact uploaded successfully
 */
router.post('/artifact', authenticateToken, uploadArtifact, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const file = req.file;
    const { projectId, pipelineRunId } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please provide an artifact file',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400,
      });
    }

    const result = await StorageService.uploadFile(
      file.buffer,
      file.originalname,
      {
        category: FileCategory.ARTIFACT,
        access: FileAccess.PRIVATE,
        contentType: file.mimetype,
        metadata: {
          userId: user.id,
          projectId: projectId || '',
          pipelineRunId: pipelineRunId || '',
          originalName: file.originalname,
        },
      }
    );

    const response: ApiResponse = {
      success: true,
      data: {
        key: result.key,
        url: result.url,
        size: result.size,
        contentType: result.contentType,
      },
      message: 'Artifact uploaded successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    logger.info('Artifact uploaded', {
      userId: user.id,
      projectId,
      pipelineRunId,
      key: result.key,
      size: result.size,
    });

    res.json(response);
  } catch (error: any) {
    logger.error('Artifact upload failed', {
      error: error.message,
      userId: (req as any).user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'Artifact upload failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/files/presigned-url:
 *   post:
 *     summary: Get pre-signed URL for direct upload
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - contentType
 *             properties:
 *               filename:
 *                 type: string
 *               contentType:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [avatars, artifacts, reports, attachments, backups, temp, logs]
 *     responses:
 *       200:
 *         description: Pre-signed URL generated
 */
router.post('/presigned-url', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { filename, contentType, category = 'attachments' } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide filename and contentType',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400,
      });
    }

    const result = await StorageService.getPresignedUploadUrl(
      filename,
      contentType,
      category as FileCategory,
      300 // 5 minutes
    );

    const response: ApiResponse = {
      success: true,
      data: {
        uploadUrl: result.url,
        key: result.key,
        expiresIn: 300,
      },
      message: 'Pre-signed upload URL generated',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    logger.info('Pre-signed upload URL generated', {
      userId: (req as any).user.id,
      filename,
      category,
    });

    res.json(response);
  } catch (error: any) {
    logger.error('Pre-signed URL generation failed', {
      error: error.message,
      userId: (req as any).user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'Pre-signed URL generation failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/files/{key}/download:
 *   get:
 *     summary: Get pre-signed download URL
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: File key in S3
 *       - in: query
 *         name: expiresIn
 *         schema:
 *           type: number
 *           default: 3600
 *         description: URL expiration in seconds
 *     responses:
 *       200:
 *         description: Download URL generated
 */
router.get('/:key/download', authenticateToken, async (req: Request, res: Response) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const expiresIn = parseInt(req.query.expiresIn as string) || 3600;

    const downloadUrl = await StorageService.getPresignedUrl(key, expiresIn, true);

    const response: ApiResponse = {
      success: true,
      data: {
        downloadUrl,
        expiresIn,
      },
      message: 'Download URL generated',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    logger.info('Download URL generated', {
      userId: (req as any).user.id,
      key,
      expiresIn,
    });

    res.json(response);
  } catch (error: any) {
    logger.error('Download URL generation failed', {
      error: error.message,
      userId: (req as any).user?.id,
      key: req.params.key,
    });
    res.status(500).json({
      success: false,
      error: 'Download URL generation failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/files/{key}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: File key in S3
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
router.delete('/:key', authenticateToken, async (req: Request, res: Response) => {
  try {
    const key = decodeURIComponent(req.params.key);

    // TODO: Check if user owns the file or has permission to delete
    await StorageService.deleteFile(key);

    const response: ApiResponse = {
      success: true,
      data: { key },
      message: 'File deleted successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    logger.info('File deleted', {
      userId: (req as any).user.id,
      key,
    });

    res.json(response);
  } catch (error: any) {
    logger.error('File deletion failed', {
      error: error.message,
      userId: (req as any).user?.id,
      key: req.params.key,
    });
    res.status(500).json({
      success: false,
      error: 'File deletion failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/v1/files/{key}/metadata:
 *   get:
 *     summary: Get file metadata
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: File key in S3
 *     responses:
 *       200:
 *         description: File metadata retrieved
 */
router.get('/:key/metadata', authenticateToken, async (req: Request, res: Response) => {
  try {
    const key = decodeURIComponent(req.params.key);

    const metadata = await StorageService.getFileMetadata(key);

    const response: ApiResponse = {
      success: true,
      data: metadata,
      message: 'File metadata retrieved',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to get file metadata', {
      error: error.message,
      userId: (req as any).user?.id,
      key: req.params.key,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get file metadata',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500,
    });
  }
});

export default router;
