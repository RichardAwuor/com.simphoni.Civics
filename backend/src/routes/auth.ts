import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import * as authSchema from '../db/auth-schema.js';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas
const biometricRegisterSchema = z.object({
  email: z.string().email(),
  biometricPublicKey: z.string().min(1),
});

const biometricVerifySchema = z.object({
  email: z.string().email(),
  biometricPublicKey: z.string().min(1),
});

export function registerAuthRoutes(app: App) {
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
      app.logger.info({ email: (request.body as any).email }, 'Biometric registration started');

      try {
        const data = biometricRegisterSchema.parse(request.body as any);

        // Find agent
        const agent = await app.db.query.agents.findFirst({
          where: eq(schema.agents.email, data.email),
        });

        if (!agent) {
          app.logger.warn({ email: data.email }, 'Agent not found for biometric registration');
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
          'Biometric credential registered successfully'
        );

        return {
          success: true,
        };
      } catch (error) {
        app.logger.error(
          { err: error, body: request.body },
          'Failed to register biometric credential'
        );
        return reply.status(400).send({
          error: 'Failed to register biometric credential',
        });
      }
    }
  );

  // Verify biometric credential and create session
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
      app.logger.info({ email: (request.body as any).email }, 'Biometric sign-in verification started');

      try {
        const data = biometricVerifySchema.parse(request.body as any);

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
            'Biometric verification failed - credential not found or not enabled'
          );
          return reply.status(401).send({
            success: false,
            error: 'Biometric verification failed',
          });
        }

        // Create a Better Auth session
        const sessionId = `session_${crypto.randomBytes(16).toString('hex')}`;
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        try {
          await app.db
            .insert(authSchema.session)
            .values({
              id: sessionId,
              token: sessionToken,
              expiresAt,
              userId: agent.userId,
              createdAt: new Date(),
              updatedAt: new Date(),
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'] || null,
            });
        } catch (sessionError) {
          app.logger.error(
            { err: sessionError, email: data.email },
            'Failed to create session after biometric verification'
          );
          return reply.status(500).send({
            error: 'Failed to create session',
          });
        }

        app.logger.info(
          { agentId: agent.id, email: data.email },
          'Biometric verification and sign-in successful'
        );

        return {
          success: true,
          token: sessionToken,
          user: {
            id: agent.id,
            email: agent.email,
            name: `${agent.firstName} ${agent.lastName}`,
          },
        };
      } catch (error) {
        app.logger.error(
          { err: error, body: request.body },
          'Failed to verify biometric credential'
        );
        return reply.status(400).send({
          error: 'Failed to verify biometric credential',
        });
      }
    }
  );
}
