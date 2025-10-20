import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ServiceProxy } from '../services/serviceProxy';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Generate tests using AI
 * POST /api/ai/generate-tests
 */
router.post('/generate-tests', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { code, language, framework, testType, description } = req.body;

    // Validate required fields
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: 'Code and language are required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Generating tests with AI', {
      userId: (req.user as any)?.userId,
      language,
      framework,
      codeLength: code.length
    });

    // Call AI service
    const response = await ServiceProxy.generateTests('project-id', {
      code,
      language,
      framework: framework || 'Jest',
      testType: testType || 'UNIT',
      description
    });

    if (!response.success) {
      return res.status(500).json({
        success: false,
        message: response.error || 'Failed to generate tests',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: response.data,
      message: 'Tests generated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error generating tests', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate tests',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Analyze test failures using AI
 * POST /api/ai/analyze-failures
 */
router.post('/analyze-failures', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { testResults, errorMessage, stackTrace } = req.body;

    logger.info('Analyzing test failures with AI', {
      userId: (req.user as any)?.userId,
      hasErrorMessage: !!errorMessage
    });

    // Call AI service
    const response = await ServiceProxy.analyzeFailures({
      testResults: testResults || {},
      errorMessage,
      stackTrace
    });

    if (!response.success) {
      return res.status(500).json({
        success: false,
        message: response.error || 'Failed to analyze failures',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: response.data,
      message: 'Failure analysis completed',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error analyzing failures', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to analyze failures',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
