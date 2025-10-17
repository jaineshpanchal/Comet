import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';
import { ValidationAppError, NotFoundAppError, AuthenticationAppError } from '../middleware/errorHandler';
import testExecutor from '../services/testExecutor';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/tests:
 *   get:
 *     summary: Get all test suites
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [UNIT, INTEGRATION, E2E, PERFORMANCE, SECURITY]
 *         description: Filter by test type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of test suites
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { projectId, type, isActive } = req.query;

    const where: any = {};

    // Filter by project if provided
    if (projectId) {
      where.projectId = projectId as string;
    }

    // Filter by test type if provided
    if (type) {
      where.type = type as string;
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // If user is not ADMIN, only show test suites from projects they have access to
    if (user.role !== 'ADMIN') {
      where.project = {
        OR: [
          { ownerId: user.id },
          { team: { members: { some: { userId: user.id } } } }
        ]
      };
    }

    const testSuites = await prisma.testSuite.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            framework: true,
            language: true
          }
        },
        _count: {
          select: {
            testRuns: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const response: ApiResponse = {
      success: true,
      data: testSuites,
      message: `Found ${testSuites.length} test suites`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Test suites retrieved', { userId: user.id, count: testSuites.length });
    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching test suites', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Get test suite by ID
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test suite details
 *       404:
 *         description: Test suite not found
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const testSuite = await prisma.testSuite.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            team: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        testRuns: {
          take: 10,
          orderBy: { startedAt: 'desc' },
          include: {
            triggeredByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!testSuite) {
      throw new NotFoundAppError('Test suite not found');
    }

    // Check access permissions
    const hasAccess =
      user.role === 'ADMIN' ||
      testSuite.project.ownerId === user.id ||
      testSuite.project.team?.members.some(m => m.userId === user.id);

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to this test suite');
    }

    const response: ApiResponse = {
      success: true,
      data: testSuite,
      message: 'Test suite retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Test suite retrieved', { userId: user.id, testSuiteId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Create a new test suite
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - projectId
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               projectId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [UNIT, INTEGRATION, E2E, PERFORMANCE, SECURITY]
 *               framework:
 *                 type: string
 *               testFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *               configuration:
 *                 type: object
 *     responses:
 *       201:
 *         description: Test suite created
 *       400:
 *         description: Validation error
 */
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { name, description, projectId, type, framework, testFiles, configuration } = req.body;

    // Validation
    if (!name || !projectId || !type) {
      throw new ValidationAppError('Missing required fields: name, projectId, type');
    }

    // Validate test type
    const validTypes = ['UNIT', 'INTEGRATION', 'E2E', 'PERFORMANCE', 'SECURITY'];
    if (!validTypes.includes(type)) {
      throw new ValidationAppError(`Invalid test type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundAppError('Project not found');
    }

    const hasAccess =
      user.role === 'ADMIN' ||
      project.ownerId === user.id ||
      (project.team && project.team.members.length > 0);

    if (!hasAccess) {
      throw new AuthenticationAppError('You do not have access to this project');
    }

    const testSuite = await prisma.testSuite.create({
      data: {
        name,
        description,
        projectId,
        type,
        framework: framework || project.framework,
        testFiles: testFiles ? JSON.stringify(testFiles) : '[]',
        configuration: configuration ? JSON.stringify(configuration) : '{}'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            framework: true,
            language: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: testSuite,
      message: 'Test suite created successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 201
    };

    logger.info('Test suite created', { userId: user.id, testSuiteId: testSuite.id, name });
    res.status(201).json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   put:
 *     summary: Update a test suite
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Test suite updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Test suite not found
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, description, type, framework, testFiles, configuration, isActive } = req.body;

    // Find existing test suite
    const existingTestSuite = await prisma.testSuite.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!existingTestSuite) {
      throw new NotFoundAppError('Test suite not found');
    }

    // Check permissions
    const canUpdate =
      user.role === 'ADMIN' ||
      user.role === 'MANAGER' ||
      existingTestSuite.project.ownerId === user.id;

    if (!canUpdate) {
      throw new AuthenticationAppError('Only project owner, managers, or admins can update test suites');
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (framework !== undefined) updateData.framework = framework;
    if (testFiles !== undefined) updateData.testFiles = JSON.stringify(testFiles);
    if (configuration !== undefined) updateData.configuration = JSON.stringify(configuration);
    if (isActive !== undefined) updateData.isActive = isActive;

    const testSuite = await prisma.testSuite.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            framework: true,
            language: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: testSuite,
      message: 'Test suite updated successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Test suite updated', { userId: user.id, testSuiteId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     summary: Delete a test suite
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test suite deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Test suite not found
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Find existing test suite
    const existingTestSuite = await prisma.testSuite.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!existingTestSuite) {
      throw new NotFoundAppError('Test suite not found');
    }

    // Check permissions - only owner or admin can delete
    const canDelete =
      user.role === 'ADMIN' ||
      existingTestSuite.project.ownerId === user.id;

    if (!canDelete) {
      throw new AuthenticationAppError('Only project owner or admins can delete test suites');
    }

    await prisma.testSuite.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      data: { id },
      message: 'Test suite deleted successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Test suite deleted', { userId: user.id, testSuiteId: id });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tests/{id}/run:
 *   post:
 *     summary: Execute a test suite
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               environment:
 *                 type: string
 *               branch:
 *                 type: string
 *               parameters:
 *                 type: object
 *     responses:
 *       202:
 *         description: Test execution started
 *       404:
 *         description: Test suite not found
 */
router.post('/:id/run', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { environment, branch, parameters } = req.body;

    // Find test suite
    const testSuite = await prisma.testSuite.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!testSuite) {
      throw new NotFoundAppError('Test suite not found');
    }

    // Check if test suite is active
    if (!testSuite.isActive) {
      throw new ValidationAppError('Test suite is not active');
    }

    // Check access permissions
    const hasAccess =
      user.role === 'ADMIN' ||
      testSuite.project.ownerId === user.id;

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to execute this test suite');
    }

    // Create test run record
    const testRun = await prisma.testRun.create({
      data: {
        testSuiteId: id,
        status: 'PENDING',
        triggeredBy: user.id,
        environment: environment || 'development',
        branch: branch || testSuite.project.branch,
        metadata: JSON.stringify({
          triggeredByUser: `${user.firstName} ${user.lastName}`,
          parameters: parameters || {}
        })
      },
      include: {
        testSuite: {
          select: {
            id: true,
            name: true,
            type: true,
            framework: true
          }
        },
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Execute tests asynchronously
    const testFiles = JSON.parse(testSuite.testFiles as string);
    const configuration = JSON.parse(testSuite.configuration as string);

    testExecutor.executeTests({
      testRunId: testRun.id,
      testSuiteId: id,
      projectId: testSuite.projectId,
      repositoryUrl: testSuite.project.repositoryUrl,
      branch: branch || testSuite.project.branch,
      type: testSuite.type,
      framework: testSuite.framework,
      testFiles,
      configuration,
      environment: environment || 'development',
      triggeredBy: user.id
    }).catch(error => {
      logger.error('Test execution failed', { testRunId: testRun.id, error: error.message });
    });

    const response: ApiResponse = {
      success: true,
      data: testRun,
      message: 'Test execution started successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 202
    };

    logger.info('Test execution started', { userId: user.id, testRunId: testRun.id, testSuiteId: id });
    res.status(202).json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tests/{id}/runs:
 *   get:
 *     summary: Get test run history for a test suite
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, RUNNING, PASSED, FAILED, SKIPPED]
 *     responses:
 *       200:
 *         description: Test run history
 *       404:
 *         description: Test suite not found
 */
router.get('/:id/runs', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { limit = '20', status } = req.query;

    // Find test suite
    const testSuite = await prisma.testSuite.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!testSuite) {
      throw new NotFoundAppError('Test suite not found');
    }

    // Check access permissions
    const hasAccess =
      user.role === 'ADMIN' ||
      testSuite.project.ownerId === user.id;

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to view test runs');
    }

    const where: any = { testSuiteId: id };

    if (status) {
      where.status = status as string;
    }

    const testRuns = await prisma.testRun.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { startedAt: 'desc' },
      include: {
        testSuite: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: testRuns,
      message: `Found ${testRuns.length} test runs`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Test runs retrieved', { userId: user.id, testSuiteId: id, count: testRuns.length });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tests/runs/{runId}:
 *   get:
 *     summary: Get test run details by ID
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test run details
 *       404:
 *         description: Test run not found
 */
router.get('/runs/:runId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { runId } = req.params;

    const testRun = await prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        testSuite: {
          include: {
            project: true
          }
        },
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!testRun) {
      throw new NotFoundAppError('Test run not found');
    }

    // Check access permissions
    const hasAccess =
      user.role === 'ADMIN' ||
      testRun.testSuite.project.ownerId === user.id;

    if (!hasAccess) {
      throw new AuthenticationAppError('Access denied to view this test run');
    }

    const response: ApiResponse = {
      success: true,
      data: testRun,
      message: 'Test run retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Test run retrieved', { userId: user.id, testRunId: runId });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tests/runs/{runId}/cancel:
 *   post:
 *     summary: Cancel a running test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test run cancelled
 *       404:
 *         description: Test run not found
 */
router.post('/runs/:runId/cancel', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { runId } = req.params;

    const testRun = await prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        testSuite: {
          include: {
            project: true
          }
        }
      }
    });

    if (!testRun) {
      throw new NotFoundAppError('Test run not found');
    }

    // Check permissions
    const canCancel =
      user.role === 'ADMIN' ||
      testRun.testSuite.project.ownerId === user.id ||
      testRun.triggeredBy === user.id;

    if (!canCancel) {
      throw new AuthenticationAppError('Only the user who triggered the test, project owner, or admins can cancel it');
    }

    // Can only cancel if running or pending
    if (!['RUNNING', 'PENDING'].includes(testRun.status)) {
      throw new ValidationAppError(`Cannot cancel test run with status: ${testRun.status}`);
    }

    // Cancel the test execution
    testExecutor.cancelTest(runId);

    const response: ApiResponse = {
      success: true,
      data: { id: runId },
      message: 'Test run cancelled successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    logger.info('Test run cancelled', { userId: user.id, testRunId: runId });
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

export default router;
