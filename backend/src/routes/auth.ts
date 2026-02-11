import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gt } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas
const requestOtpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  county: z.string().min(1).optional(),
  constituency: z.string().min(1).optional(),
  ward: z.string().min(1).optional(),
  dateOfBirth: z.string().date().optional(),
  nationalId: z.string().regex(/^\d{8}$/, 'National ID must be 8 digits').optional(),
  biometricPublicKey: z.string().optional(),
});

const biometricRegisterSchema = z.object({
  email: z.string().email(),
  biometricPublicKey: z.string().min(1),
});

const biometricVerifySchema = z.object({
  email: z.string().email(),
  biometricPublicKey: z.string().min(1),
});

// Helper function to generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to encrypt national ID (same as in agents.ts)
function encryptNationalId(nationalId: string, key: string = 'wanjiku@63'): string {
  const keyHash = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyHash, iv);
  let encrypted = cipher.update(nationalId, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Constituency code mapping (same as in agents.ts)
const constituencyCodeMap: Record<string, string> = {
  'Kamukunji': '001',
  'Kasarani': '002',
  'Lang\'ata': '003',
  'Makadara': '004',
  'Mathare': '005',
  'Nyaya': '006',
  'Starehe': '007',
  'Westlands': '008',
  'Changamwe': '001',
  'Kisauni': '002',
  'Likoni': '003',
  'Mvita': '004',
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
  'Alego Usonga': '001',
  'Central': '002',
  'East': '003',
  'Nyakach': '004',
  'Nyando': '005',
  'Seme': '006',
  'West': '007',
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

// Ward code mapping (same as in agents.ts)
const wardCodeMap: Record<string, string> = {
  'Eastleigh North': '0001',
  'Eastleigh South': '0002',
  'Kamukunji': '0003',
  'Pumwani': '0004',
  'Dandora': '0001',
  'Embakasi': '0002',
  'Kasarani': '0003',
  'Ruai': '0004',
  'Woodley': '0005',
  'Changamwe': '0001',
  'Junda': '0002',
  'Kipevu': '0003',
  'Bamburi': '0001',
  'Chaani': '0002',
  'Kisauni': '0003',
  'Mikindani': '0004',
  'Gatundu North': '0001',
  'Murera': '0002',
  'Gatundu South': '0001',
  'Gitotom': '0002',
  'Chemelil': '0001',
  'Kibos': '0002',
  'Kisumu Central': '0003',
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
  const agentsInWard = await app.db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.ward, ward));

  const sequentialNumber = String(agentsInWard.length + 1).padStart(2, '0');
  const countyCode = county.toUpperCase().substring(0, 7);
  const constituencyCode = constituencyCodeMap[constituency] || constituency.substring(0, 3).padStart(3, '0');
  const wardCode = wardCodeMap[ward] || ward.substring(0, 4).padStart(4, '0');

  return `${countyCode}-${constituencyCode}-${wardCode}-${sequentialNumber}`;
}

export function registerAuthRoutes(app: App) {
  // Request OTP for email
  app.fastify.post<{ Body: z.infer<typeof requestOtpSchema> }>(
    '/api/auth/request-otp',
    {
      schema: {
        description: 'Request OTP for passwordless authentication',
        tags: ['auth'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string' },
          },
          required: ['email'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = requestOtpSchema.parse(request.body as any);

        app.logger.info({ email: data.email }, 'OTP request started');

        // Generate OTP
        const code = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete old unused codes for this email
        await app.db
          .delete(schema.otpCodes)
          .where(
            and(
              eq(schema.otpCodes.email, data.email),
              eq(schema.otpCodes.used, false)
            )
          );

        // Store OTP
        await app.db.insert(schema.otpCodes).values({
          email: data.email,
          code,
          expiresAt,
          used: false,
        });

        // TODO: In production, send OTP via email using Resend or similar
        // For now, log it (in development, you can check logs)
        app.logger.info(
          { email: data.email, code },
          'OTP generated (development - check logs)'
        );

        return {
          success: true,
          message: 'OTP sent to email',
          email: data.email,
          // For development only - remove in production
          ...(process.env.NODE_ENV === 'development' && { code }),
        };
      } catch (error) {
        app.logger.error(
          { err: error, body: request.body },
          'Failed to request OTP'
        );
        return reply.status(400).send({
          error: 'Failed to request OTP',
        });
      }
    }
  );

  // Verify OTP and create/sign in session
  app.fastify.post<{ Body: z.infer<typeof verifyOtpSchema> }>(
    '/api/auth/verify-otp',
    {
      schema: {
        description: 'Verify OTP and create/sign in user',
        tags: ['auth'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            code: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            county: { type: 'string' },
            constituency: { type: 'string' },
            ward: { type: 'string' },
            dateOfBirth: { type: 'string' },
            nationalId: { type: 'string' },
            biometricPublicKey: { type: 'string' },
          },
          required: ['email', 'code'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = verifyOtpSchema.parse(request.body as any);

        app.logger.info({ email: data.email }, 'OTP verification started');

        // Find valid OTP
        const otp = await app.db.query.otpCodes.findFirst({
          where: and(
            eq(schema.otpCodes.email, data.email),
            eq(schema.otpCodes.code, data.code),
            eq(schema.otpCodes.used, false),
            gt(schema.otpCodes.expiresAt, new Date())
          ),
        });

        if (!otp) {
          app.logger.warn({ email: data.email }, 'Invalid or expired OTP');
          return reply.status(400).send({
            error: 'Invalid or expired OTP',
          });
        }

        // Mark OTP as used
        await app.db
          .update(schema.otpCodes)
          .set({ used: true })
          .where(eq(schema.otpCodes.id, otp.id));

        // Check if agent already exists
        const existingAgent = await app.db.query.agents.findFirst({
          where: eq(schema.agents.email, data.email),
        });

        let agentId = '';

        if (!existingAgent) {
          // New registration - require agent details
          if (!data.firstName || !data.lastName || !data.county || !data.constituency || !data.ward || !data.dateOfBirth || !data.nationalId) {
            app.logger.warn(
              { email: data.email },
              'Missing required agent details for new user'
            );
            return reply.status(400).send({
              error: 'Missing required agent details for new registration',
              fields: ['firstName', 'lastName', 'county', 'constituency', 'ward', 'dateOfBirth', 'nationalId'],
            });
          }

          app.logger.info({ email: data.email }, 'Creating new agent via OTP verification');

          // Generate civic code
          const civicCode = await generateCivicCode(
            app,
            data.county!,
            data.constituency!,
            data.ward!
          );

          // Encrypt national ID
          const nationalIdHash = encryptNationalId(data.nationalId!);

          // Create agent record (user creation happens through Better Auth)
          const agent = await app.db
            .insert(schema.agents)
            .values({
              email: data.email,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              county: data.county || '',
              constituency: data.constituency || '',
              ward: data.ward || '',
              dateOfBirth: data.dateOfBirth || new Date().toISOString().split('T')[0],
              nationalIdHash,
              civicCode,
              biometricEnabled: !!data.biometricPublicKey,
              biometricPublicKey: data.biometricPublicKey || null,
              userId: '', // Will be set by Better Auth
            })
            .returning();

          agentId = agent[0].id;

          app.logger.info(
            { agentId, civicCode, email: data.email },
            'Agent created during OTP verification'
          );
        } else {
          // Agent exists, update biometric if provided
          if (data.biometricPublicKey) {
            await app.db
              .update(schema.agents)
              .set({
                biometricEnabled: true,
                biometricPublicKey: data.biometricPublicKey,
              })
              .where(eq(schema.agents.id, existingAgent.id));

            app.logger.info(
              { agentId: existingAgent.id, email: data.email },
              'Biometric credential added'
            );
          }

          agentId = existingAgent.id;
        }

        app.logger.info(
          { email: data.email, agentId },
          'OTP verified successfully'
        );

        return {
          success: true,
          message: 'OTP verified. Please complete authentication via email link.',
          email: data.email,
          agentId,
          // In a real implementation, you'd return a session token or redirect to email verification
        };
      } catch (error) {
        app.logger.error(
          { err: error, body: request.body },
          'Failed to verify OTP'
        );
        return reply.status(400).send({
          error: 'Failed to verify OTP',
        });
      }
    }
  );

  // Register biometric credential
  app.fastify.post<{ Body: z.infer<typeof biometricRegisterSchema> }>(
    '/api/biometric/register',
    {
      schema: {
        description: 'Register biometric credential for user',
        tags: ['biometric'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            biometricPublicKey: { type: 'string' },
          },
          required: ['email', 'biometricPublicKey'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = biometricRegisterSchema.parse(request.body as any);

        app.logger.info({ email: data.email }, 'Biometric registration started');

        // Find agent
        const agent = await app.db.query.agents.findFirst({
          where: eq(schema.agents.email, data.email),
        });

        if (!agent) {
          app.logger.warn({ email: data.email }, 'Agent not found');
          return reply.status(404).send({
            error: 'Agent not found',
          });
        }

        // Update agent with biometric credential
        const updated = await app.db
          .update(schema.agents)
          .set({
            biometricEnabled: true,
            biometricPublicKey: data.biometricPublicKey,
          })
          .where(eq(schema.agents.id, agent.id))
          .returning();

        app.logger.info(
          { agentId: agent.id, email: data.email },
          'Biometric credential registered'
        );

        return {
          success: true,
          message: 'Biometric credential registered',
          agentId: updated[0].id,
          civicCode: updated[0].civicCode,
        };
      } catch (error) {
        app.logger.error(
          { err: error, body: request.body },
          'Failed to register biometric'
        );
        return reply.status(400).send({
          error: 'Failed to register biometric credential',
        });
      }
    }
  );

  // Verify biometric credential
  app.fastify.post<{ Body: z.infer<typeof biometricVerifySchema> }>(
    '/api/biometric/verify',
    {
      schema: {
        description: 'Verify biometric credential and sign in',
        tags: ['biometric'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            biometricPublicKey: { type: 'string' },
          },
          required: ['email', 'biometricPublicKey'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = biometricVerifySchema.parse(request.body as any);

        app.logger.info({ email: data.email }, 'Biometric verification started');

        // Find agent with matching biometric
        const agent = await app.db.query.agents.findFirst({
          where: and(
            eq(schema.agents.email, data.email),
            eq(schema.agents.biometricPublicKey, data.biometricPublicKey),
            eq(schema.agents.biometricEnabled, true)
          ),
        });

        if (!agent) {
          app.logger.warn(
            { email: data.email },
            'Biometric credential not found or not enabled'
          );
          return reply.status(401).send({
            error: 'Biometric verification failed',
          });
        }

        app.logger.info(
          { agentId: agent.id, email: data.email },
          'Biometric verified successfully'
        );

        return {
          success: true,
          message: 'Biometric verified. Signing in...',
          agentId: agent.id,
          civicCode: agent.civicCode,
          firstName: agent.firstName,
          lastName: agent.lastName,
          email: agent.email,
          // In a real implementation, you'd return a session token
        };
      } catch (error) {
        app.logger.error(
          { err: error, body: request.body },
          'Failed to verify biometric'
        );
        return reply.status(400).send({
          error: 'Failed to verify biometric credential',
        });
      }
    }
  );
}
