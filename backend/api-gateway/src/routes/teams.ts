import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AppError, NotFoundAppError, ValidationAppError } from '../utils/errors';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/teams
 * Get all teams (with optional filters)
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;

    const teams = await prisma.team.findMany({
      where: {
        ...(isActive !== undefined && { isActive: isActive === 'true' })
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true
              }
            }
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info('Teams retrieved', {
      service: 'api-gateway',
      count: teams.length,
      userId: (req as any).user?.userId
    });

    res.json({
      success: true,
      data: teams
    });
  } catch (error: any) {
    logger.error('Error retrieving teams', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve teams'
    });
  }
});

/**
 * GET /api/teams/:id
 * Get team by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
                isActive: true
              }
            }
          }
        },
        projects: true
      }
    });

    if (!team) {
      throw new NotFoundAppError('Team not found');
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error: any) {
    if (error instanceof NotFoundAppError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      logger.error('Error retrieving team', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve team'
      });
    }
  }
});

/**
 * POST /api/teams
 * Create a new team (Admin/Manager only)
 */
router.post('/', authenticateToken, requireRole('MANAGER'), async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new ValidationAppError('Team name is required');
    }

    const team = await prisma.team.create({
      data: {
        name,
        description
      },
      include: {
        members: true,
        projects: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.userId,
        action: 'team.created',
        resource: 'Team',
        resourceId: team.id,
        metadata: JSON.stringify({ name, description }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    logger.info('Team created', {
      service: 'api-gateway',
      teamId: team.id,
      userId: (req as any).user?.userId
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error: any) {
    if (error instanceof ValidationAppError) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      logger.error('Error creating team', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to create team'
      });
    }
  }
});

/**
 * PUT /api/teams/:id
 * Update team (Admin/Manager only)
 */
router.put('/:id', authenticateToken, requireRole('MANAGER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true
              }
            }
          }
        },
        projects: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.userId,
        action: 'team.updated',
        resource: 'Team',
        resourceId: team.id,
        metadata: JSON.stringify({ name, description, isActive }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    logger.info('Team updated', {
      service: 'api-gateway',
      teamId: team.id,
      userId: (req as any).user?.userId
    });

    res.json({
      success: true,
      data: team
    });
  } catch (error: any) {
    logger.error('Error updating team', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update team'
    });
  }
});

/**
 * DELETE /api/teams/:id
 * Delete team (Admin only)
 */
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.team.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.userId,
        action: 'team.deleted',
        resource: 'Team',
        resourceId: id,
        metadata: JSON.stringify({}),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    logger.info('Team deleted', {
      service: 'api-gateway',
      teamId: id,
      userId: (req as any).user?.userId
    });

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting team', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete team'
    });
  }
});

/**
 * POST /api/teams/:id/members
 * Add member to team (Manager only)
 */
router.post('/:id/members', authenticateToken, requireRole('MANAGER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      throw new ValidationAppError('User ID is required');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundAppError('User not found');
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: id
        }
      }
    });

    if (existingMember) {
      throw new ValidationAppError('User is already a member of this team');
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        userId,
        teamId: id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true
          }
        },
        team: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.userId,
        action: 'team.member.added',
        resource: 'TeamMember',
        resourceId: teamMember.id,
        metadata: JSON.stringify({ teamId: id, userId }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    logger.info('Team member added', {
      service: 'api-gateway',
      teamId: id,
      userId,
      addedBy: (req as any).user?.userId
    });

    res.status(201).json({
      success: true,
      data: teamMember
    });
  } catch (error: any) {
    if (error instanceof ValidationAppError || error instanceof NotFoundAppError) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      logger.error('Error adding team member', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to add team member'
      });
    }
  }
});

/**
 * DELETE /api/teams/:id/members/:userId
 * Remove member from team (Manager only)
 */
router.delete('/:id/members/:userId', authenticateToken, requireRole('MANAGER'), async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;

    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId,
          teamId: id
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.userId,
        action: 'team.member.removed',
        resource: 'TeamMember',
        resourceId: `${id}-${userId}`,
        metadata: JSON.stringify({ teamId: id, userId }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    logger.info('Team member removed', {
      service: 'api-gateway',
      teamId: id,
      userId,
      removedBy: (req as any).user?.userId
    });

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error: any) {
    logger.error('Error removing team member', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to remove team member'
    });
  }
});

export default router;
