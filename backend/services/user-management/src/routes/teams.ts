import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { 
  Team, 
  TeamMember, 
  TeamRole, 
  CreateTeamRequest, 
  UpdateTeamRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationQuery
} from '../types';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Validation schemas
const createTeamSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().alphanum().min(2).max(50).required(),
  description: Joi.string().max(500).optional(),
  avatar: Joi.string().uri().optional().allow(null),
  settings: Joi.object().optional()
});

const updateTeamSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(null),
  avatar: Joi.string().uri().optional().allow(null),
  settings: Joi.object().optional()
});

const addMemberSchema = Joi.object({
  userId: Joi.string().required(),
  role: Joi.string().valid(...Object.values(TeamRole)).default(TeamRole.MEMBER)
});

const updateMemberSchema = Joi.object({
  role: Joi.string().valid(...Object.values(TeamRole)).required()
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('name', 'slug', 'createdAt', 'updatedAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().optional()
});

/**
 * Get all teams with pagination and filtering
 * GET /api/v1/teams
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = paginationSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: error.details[0].message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }

  const { 
    page = 1, 
    limit = 20, 
    sortBy = 'createdAt', 
    sortOrder = 'desc', 
    search 
  } = value as PaginationQuery & { search?: string };

  // Build where clause for filtering
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get teams with pagination
  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            pipelines: true
          }
        }
      }
    }),
    prisma.team.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const response: ApiResponse<PaginatedResponse<Team>> = {
    success: true,
    data: {
      items: teams as any,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage
    },
    message: `Retrieved ${teams.length} teams`,
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Get team by ID or slug
 * GET /api/v1/teams/:idOrSlug
 */
router.get('/:idOrSlug', asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;

  const team = await prisma.team.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
              lastLoginAt: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { joinedAt: 'asc' }
        ]
      },
      pipelines: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          lastRunAt: true
        },
        take: 10,
        orderBy: { lastRunAt: 'desc' }
      },
      _count: {
        select: {
          members: true,
          pipelines: true
        }
      }
    }
  });

  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Team not found',
      message: `Team with identifier ${idOrSlug} does not exist`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  const response: ApiResponse<Team> = {
    success: true,
    data: team as any,
    message: 'Team retrieved successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Create new team
 * POST /api/v1/teams
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createTeamSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: error.details[0].message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }

  const { name, slug, description, avatar, settings } = value as CreateTeamRequest;

  // Check if team with slug already exists
  const existingTeam = await prisma.team.findUnique({
    where: { slug }
  });

  if (existingTeam) {
    return res.status(409).json({
      success: false,
      error: 'Team already exists',
      message: 'A team with this slug already exists',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 409
    });
  }

  // Create team with creator as owner
  const team = await prisma.team.create({
    data: {
      name,
      slug,
      description,
      avatar,
      settings: JSON.stringify(settings || {
        visibility: 'private',
        allowMemberInvites: false,
        requireApprovalForJoin: true,
        defaultMemberRole: 'member'
      }),
      members: {
        create: {
          userId: req.user!.id,
          role: TeamRole.OWNER,
          joinedAt: new Date()
        }
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true
            }
          }
        }
      }
    }
  });

  logger.info(`New team created: ${name}`, {
    teamId: team.id,
    teamSlug: slug,
    createdBy: req.user!.id
  });

  const response: ApiResponse<Team> = {
    success: true,
    data: team as any,
    message: 'Team created successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 201
  };

  res.status(201).json(response);
}));

/**
 * Update team
 * PUT /api/v1/teams/:idOrSlug
 */
router.put('/:idOrSlug', asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;
  const { error, value } = updateTeamSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: error.details[0].message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }

  const updateData = value as UpdateTeamRequest;

  // Convert settings to JSON for Prisma
  const prismaUpdateData: any = { ...updateData };
  if (prismaUpdateData.settings) {
    prismaUpdateData.settings = JSON.stringify(prismaUpdateData.settings);
  }

  // Check if team exists and user has permission
  const existingTeam = await prisma.team.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    },
    include: {
      members: {
        where: { userId: req.user!.id }
      }
    }
  });

  if (!existingTeam) {
    return res.status(404).json({
      success: false,
      error: 'Team not found',
      message: `Team with identifier ${idOrSlug} does not exist`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Check if user is team owner or admin
  const userMembership = existingTeam.members[0];
  if (!userMembership || ![TeamRole.OWNER, TeamRole.ADMIN].includes(userMembership.role as TeamRole)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Only team owners and admins can update team details',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 403
    });
  }

  // Update team
  const updatedTeam = await prisma.team.update({
    where: { id: existingTeam.id },
    data: prismaUpdateData,
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true
            }
          }
        }
      }
    }
  });

  logger.info(`Team updated: ${existingTeam.name}`, {
    teamId: existingTeam.id,
    updatedFields: Object.keys(updateData),
    updatedBy: req.user!.id
  });

  const response: ApiResponse<Team> = {
    success: true,
    data: updatedTeam as any,
    message: 'Team updated successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Delete team
 * DELETE /api/v1/teams/:idOrSlug
 */
router.delete('/:idOrSlug', asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;

  // Check if team exists and user has permission
  const existingTeam = await prisma.team.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    },
    include: {
      members: {
        where: { userId: req.user!.id }
      }
    }
  });

  if (!existingTeam) {
    return res.status(404).json({
      success: false,
      error: 'Team not found',
      message: `Team with identifier ${idOrSlug} does not exist`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Check if user is team owner
  const userMembership = existingTeam.members[0];
  if (!userMembership || userMembership.role !== TeamRole.OWNER) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Only team owners can delete teams',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 403
    });
  }

  // Delete team (this will cascade delete members and other related records)
  await prisma.team.delete({
    where: { id: existingTeam.id }
  });

  logger.info(`Team deleted: ${existingTeam.name}`, {
    teamId: existingTeam.id,
    deletedBy: req.user!.id
  });

  const response: ApiResponse = {
    success: true,
    message: 'Team deleted successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Add member to team
 * POST /api/v1/teams/:idOrSlug/members
 */
router.post('/:idOrSlug/members', asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;
  const { error, value } = addMemberSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: error.details[0].message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }

  const { userId, role } = value;

  // Check if team exists and user has permission
  const team = await prisma.team.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    },
    include: {
      members: {
        where: { userId: req.user!.id }
      }
    }
  });

  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Team not found',
      message: `Team with identifier ${idOrSlug} does not exist`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Check if user has permission to add members
  const userMembership = team.members[0];
  if (!userMembership || ![TeamRole.OWNER, TeamRole.ADMIN].includes(userMembership.role as TeamRole)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Only team owners and admins can add members',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 403
    });
  }

  // Check if user to be added exists
  const userToAdd = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!userToAdd) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
      message: `User with ID ${userId} does not exist`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Check if user is already a member
  const existingMembership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: userId
      }
    }
  });

  if (existingMembership) {
    return res.status(409).json({
      success: false,
      error: 'User already a member',
      message: 'This user is already a member of the team',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 409
    });
  }

  // Add member to team
  const newMembership = await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: userId,
      role: role as any, // Convert enum safely
      joinedAt: new Date()
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true
        }
      }
    }
  });

  logger.info(`User added to team: ${userToAdd.email} -> ${team.name}`, {
    teamId: team.id,
    userId: userId,
    role: role,
    addedBy: req.user!.id
  });

  const response: ApiResponse<TeamMember> = {
    success: true,
    data: newMembership as any,
    message: 'Member added to team successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 201
  };

  res.status(201).json(response);
}));

/**
 * Update team member role
 * PUT /api/v1/teams/:idOrSlug/members/:userId
 */
router.put('/:idOrSlug/members/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug, userId } = req.params;
  const { error, value } = updateMemberSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: error.details[0].message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }

  const { role } = value;

  // Check if team exists and user has permission
  const team = await prisma.team.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    },
    include: {
      members: {
        where: { userId: req.user!.id }
      }
    }
  });

  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Team not found',
      message: `Team with identifier ${idOrSlug} does not exist`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Check if user has permission to update member roles
  const userMembership = team.members[0];
  if (!userMembership || ![TeamRole.OWNER, TeamRole.ADMIN].includes(userMembership.role as TeamRole)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Only team owners and admins can update member roles',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 403
    });
  }

  // Check if member exists
  const existingMembership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: userId
      }
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true
        }
      }
    }
  });

  if (!existingMembership) {
    return res.status(404).json({
      success: false,
      error: 'Member not found',
      message: 'This user is not a member of the team',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Prevent changing owner role if not owner themselves
  if (existingMembership.role === TeamRole.OWNER && userMembership.role !== TeamRole.OWNER) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Only team owners can change owner roles',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 403
    });
  }

  // Update member role
  const updatedMembership = await prisma.teamMember.update({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: userId
      }
    },
    data: { role: role as any }, // Convert enum safely
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true
        }
      }
    }
  });

  logger.info(`Team member role updated: ${existingMembership.user.email} -> ${role}`, {
    teamId: team.id,
    userId: userId,
    oldRole: existingMembership.role,
    newRole: role,
    updatedBy: req.user!.id
  });

  const response: ApiResponse<TeamMember> = {
    success: true,
    data: updatedMembership as any,
    message: 'Member role updated successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Remove member from team
 * DELETE /api/v1/teams/:idOrSlug/members/:userId
 */
router.delete('/:idOrSlug/members/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug, userId } = req.params;

  // Check if team exists and user has permission
  const team = await prisma.team.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    },
    include: {
      members: {
        where: { userId: req.user!.id }
      }
    }
  });

  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Team not found',
      message: `Team with identifier ${idOrSlug} does not exist`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Check if member exists
  const existingMembership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: userId
      }
    },
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
  });

  if (!existingMembership) {
    return res.status(404).json({
      success: false,
      error: 'Member not found',
      message: 'This user is not a member of the team',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Check permissions - users can remove themselves, or owners/admins can remove others
  const userMembership = team.members[0];
  const canRemove = userId === req.user!.id || 
    (userMembership && [TeamRole.OWNER, TeamRole.ADMIN].includes(userMembership.role as TeamRole));

  if (!canRemove) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You can only remove yourself or you must be a team owner/admin to remove others',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 403
    });
  }

  // Prevent removing the last owner
  if (existingMembership.role === TeamRole.OWNER) {
    const ownerCount = await prisma.teamMember.count({
      where: {
        teamId: team.id,
        role: TeamRole.OWNER
      }
    });

    if (ownerCount <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove last owner',
        message: 'Cannot remove the last owner from the team. Assign another owner first.',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
    }
  }

  // Remove member
  await prisma.teamMember.delete({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: userId
      }
    }
  });

  logger.info(`User removed from team: ${existingMembership.user.email} -> ${team.name}`, {
    teamId: team.id,
    userId: userId,
    removedBy: req.user!.id
  });

  const response: ApiResponse = {
    success: true,
    message: 'Member removed from team successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

export default router;