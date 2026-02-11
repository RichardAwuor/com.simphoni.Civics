import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas
const registerAgentSchema = z.object({
  email: z.string().email(),
  confirmEmail: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  county: z.string().min(1),
  constituency: z.string().min(1),
  ward: z.string().min(1),
  dateOfBirth: z.string().date(),
  nationalId: z.string().regex(/^\d{8}$/, 'National ID must be 8 digits'),
  biometricPublicKey: z.string().optional(), // Optional biometric credential
});

const updateAgentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

// Helper function to encrypt national ID
function encryptNationalId(nationalId: string, key: string = 'wanjiku@63'): string {
  // Use a simple encoding - in production, use proper key derivation
  const keyHash = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyHash, iv);
  let encrypted = cipher.update(nationalId, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Prepend IV to encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

// Constituency code mapping
const constituencyCodeMap: Record<string, string> = {
  // Nairobi
  'Kamukunji': '001',
  'Kasarani': '002',
  'Lang\'ata': '003',
  'Makadara': '004',
  'Mathare': '005',
  'Nyaya': '006',
  'Starehe': '007',
  'Westlands': '008',
  // Mombasa
  'Changamwe': '001',
  'Kisauni': '002',
  'Likoni': '003',
  'Mvita': '004',
  // Kiambu
  'Gatundu North': '001',
  'Gatundu South': '002',
  'Juja': '003',
  'Kabete': '004',
  'Kamakis': '005',
  'Kiambaa': '006',
  'Kikuyu': '007',
  'Limuru': '008',
  'Ruiru': '009',
  'Thika Town': '010',
  // Kisumu
  'Alego Usonga': '001',
  'Central': '002',
  'East': '003',
  'Nyakach': '004',
  'Nyando': '005',
  'Seme': '006',
  'West': '007',
  // Nakuru
  'Bahati': '001',
  'Eldama Ravine': '002',
  'Gilgil': '003',
  'Kuresoi North': '004',
  'Kuresoi South': '005',
  'Molo': '006',
  'Nakuru Town': '007',
  'Naivasha': '008',
  'Njoro': '009',
  'Rongai': '010',
  'Subukia': '011',
};

// Ward code mapping
const wardCodeMap: Record<string, string> = {
  // Kamukunji wards
  'Eastleigh North': '0001',
  'Eastleigh South': '0002',
  'Kamukunji': '0003',
  'Pumwani': '0004',
  // Kasarani wards
  'Dandora': '0001',
  'Embakasi': '0002',
  'Kasarani': '0003',
  'Ruai': '0004',
  'Woodley': '0005',
  // Changamwe wards
  'Changamwe': '0001',
  'Junda': '0002',
  'Kipevu': '0003',
  // Kisauni wards
  'Bamburi': '0001',
  'Chaani': '0002',
  'Kisauni': '0003',
  'Mikindani': '0004',
  // Gatundu North wards
  'Gatundu North': '0001',
  'Murera': '0002',
  // Gatundu South wards
  'Gatundu South': '0001',
  'Gitotom': '0002',
  // Central wards
  'Chemelil': '0001',
  'Kibos': '0002',
  'Kisumu Central': '0003',
  // Bahati wards
  'Bahati': '0001',
  'Favours': '0002',
  'Kiamwathi': '0003',
  'Shauri Moyo': '0004',
};

// Helper function to generate civic code
async function generateCivicCode(
  app: App,
  county: string,
  constituency: string,
  ward: string
): Promise<string> {
  // Get the count of agents in this ward to generate sequential number
  const agentsInWard = await app.db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.ward, ward));

  const sequentialNumber = String(agentsInWard.length + 1).padStart(2, '0');

  // Format: COUNTYNAME-XXX-XXXX-XX
  const countyCode = county.toUpperCase().substring(0, 7);
  const constituencyCode = constituencyCodeMap[constituency] || constituency.substring(0, 3).padStart(3, '0');
  const wardCode = wardCodeMap[ward] || ward.substring(0, 4).padStart(4, '0');

  return `${countyCode}-${constituencyCode}-${wardCode}-${sequentialNumber}`;
}

export function registerAgentRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // Register new agent
  app.fastify.post<{ Body: z.infer<typeof registerAgentSchema> }>(
    '/api/agents/register',
    {
      schema: {
        description: 'Register a new electoral agent',
        tags: ['agents'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            confirmEmail: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            county: { type: 'string' },
            constituency: { type: 'string' },
            ward: { type: 'string' },
            dateOfBirth: { type: 'string' },
            nationalId: { type: 'string' },
            biometricPublicKey: { type: 'string' },
          },
          required: ['email', 'confirmEmail', 'firstName', 'lastName', 'county', 'constituency', 'ward', 'dateOfBirth', 'nationalId'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id },
        'Agent registration started'
      );

      try {
        // Validate request body
        const data = registerAgentSchema.parse(request.body as any);

        // Validate email confirmation
        if (data.email !== data.confirmEmail) {
          app.logger.warn(
            { email: data.email },
            'Email confirmation mismatch'
          );
          return reply.status(400).send({
            error: 'Emails do not match',
          });
        }

        // Check if agent already exists for this user
        const existingAgent = await app.db.query.agents.findFirst({
          where: eq(schema.agents.userId, session.user.id),
        });

        if (existingAgent) {
          app.logger.warn(
            { userId: session.user.id },
            'Agent already registered for user'
          );
          return reply.status(400).send({
            error: 'You have already registered as an agent',
          });
        }

        // Encrypt national ID
        const nationalIdHash = encryptNationalId(data.nationalId);

        // Generate civic code
        const civicCode = await generateCivicCode(
          app,
          data.county,
          data.constituency,
          data.ward
        );

        // Create agent record
        const agent = await app.db
          .insert(schema.agents)
          .values({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            county: data.county,
            constituency: data.constituency,
            ward: data.ward,
            dateOfBirth: data.dateOfBirth,
            nationalIdHash,
            civicCode,
            biometricEnabled: !!data.biometricPublicKey,
            biometricPublicKey: data.biometricPublicKey || null,
            userId: session.user.id as string,
          })
          .returning();

        app.logger.info(
          { agentId: agent[0].id, civicCode: agent[0].civicCode },
          'Agent registered successfully'
        );

        return {
          agent: {
            id: agent[0].id,
            civicCode: agent[0].civicCode,
            firstName: agent[0].firstName,
            lastName: agent[0].lastName,
            county: agent[0].county,
            constituency: agent[0].constituency,
            ward: agent[0].ward,
          },
          success: true,
        };
      } catch (error) {
        app.logger.error(
          { err: error, body: request.body },
          'Failed to register agent'
        );
        return reply.status(400).send({
          error: 'Failed to register agent',
        });
      }
    }
  );

  // Get current agent profile
  app.fastify.get(
    '/api/agents/me',
    {
      schema: {
        description: 'Get current agent profile',
        tags: ['agents'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id },
        'Fetching agent profile'
      );

      try {
        const agent = await app.db.query.agents.findFirst({
          where: eq(schema.agents.userId, session.user.id),
        });

        if (!agent) {
          app.logger.info(
            { userId: session.user.id },
            'Agent not found'
          );
          return reply.status(404).send({
            error: 'Agent profile not found. Please register first.',
          });
        }

        app.logger.info(
          { agentId: agent.id },
          'Agent profile retrieved'
        );

        return {
          id: agent.id,
          civicCode: agent.civicCode,
          firstName: agent.firstName,
          lastName: agent.lastName,
          email: agent.email,
          county: agent.county,
          constituency: agent.constituency,
          ward: agent.ward,
          dateOfBirth: agent.dateOfBirth,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch agent profile'
        );
        return reply.status(500).send({
          error: 'Failed to fetch agent profile',
        });
      }
    }
  );

  // Update agent profile
  app.fastify.put<{ Body: z.infer<typeof updateAgentSchema> }>(
    '/api/agents/me',
    {
      schema: {
        description: 'Update agent profile',
        tags: ['agents'],
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id, body: request.body },
        'Updating agent profile'
      );

      try {
        // Validate request body
        const data = updateAgentSchema.parse(request.body);

        // Find agent
        const agent = await app.db.query.agents.findFirst({
          where: eq(schema.agents.userId, session.user.id),
        });

        if (!agent) {
          app.logger.warn(
            { userId: session.user.id },
            'Agent not found for update'
          );
          return reply.status(404).send({
            error: 'Agent profile not found',
          });
        }

        // Update agent
        const updateData: any = {};
        if (data.firstName) updateData.firstName = data.firstName;
        if (data.lastName) updateData.lastName = data.lastName;

        const updated = await app.db
          .update(schema.agents)
          .set(updateData)
          .where(eq(schema.agents.id, agent.id))
          .returning();

        app.logger.info(
          { agentId: agent.id },
          'Agent profile updated successfully'
        );

        return {
          id: updated[0].id,
          civicCode: updated[0].civicCode,
          firstName: updated[0].firstName,
          lastName: updated[0].lastName,
          email: updated[0].email,
          county: updated[0].county,
          constituency: updated[0].constituency,
          ward: updated[0].ward,
          dateOfBirth: updated[0].dateOfBirth,
        };
      } catch (error) {
        app.logger.error(
          { err: error, body: request.body },
          'Failed to update agent profile'
        );
        return reply.status(400).send({
          error: 'Failed to update agent profile',
        });
      }
    }
  );
}
