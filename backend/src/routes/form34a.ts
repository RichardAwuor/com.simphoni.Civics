import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { z } from 'zod';
import { gateway } from '@specific-dev/framework';
import { generateText, generateObject } from 'ai';

const submitFormSchema = z.object({
  county: z.string().min(1),
  constituency: z.string().min(1),
  ward: z.string().min(1),
  pollingStation: z.string().min(1),
  latitude: z.string().or(z.number()).optional(),
  longitude: z.string().or(z.number()).optional(),
});

const candidateSchema = z.object({
  candidateFirstName: z.string(),
  candidateLastName: z.string(),
  partyName: z.string(),
  votes: z.number(),
});

const extractedDataSchema = z.object({
  serialNumber: z.string(),
  candidates: z.array(candidateSchema),
});

export function registerForm34aRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // Submit Form34A with image
  app.fastify.post<{ Body: z.infer<typeof submitFormSchema> }>(
    '/api/form34a/submit',
    {
      schema: {
        description: 'Submit Form34A image with results',
        tags: ['form34a'],
        consumes: ['multipart/form-data'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id },
        'Form34A submission started'
      );

      try {
        // Get multipart data
        const parts = request.parts();
        let buffer: Buffer | null = null;
        let county = '';
        let constituency = '';
        let ward = '';
        let pollingStation = '';
        let latitude: number | undefined;
        let longitude: number | undefined;
        let filename = '';

        for await (const part of parts) {
          if (part.type === 'file') {
            filename = part.filename as string;
            try {
              buffer = await part.toBuffer();
            } catch (err) {
              app.logger.error({ err }, 'File too large');
              return reply.status(413).send({ error: 'Image file too large' });
            }
          } else if (part.type === 'field') {
            const fieldname = part.fieldname as string;
            const value = part.value as string;
            if (fieldname === 'county') {
              county = value || '';
            } else if (fieldname === 'constituency') {
              constituency = value || '';
            } else if (fieldname === 'ward') {
              ward = value || '';
            } else if (fieldname === 'pollingStation') {
              pollingStation = value || '';
            } else if (fieldname === 'latitude') {
              latitude = value ? parseFloat(value) : undefined;
            } else if (fieldname === 'longitude') {
              longitude = value ? parseFloat(value) : undefined;
            }
          }
        }

        if (!buffer) {
          app.logger.warn({ userId: session.user.id }, 'No form image provided');
          return reply.status(400).send({ error: 'No form image provided' });
        }

        // Find agent
        const agent = await app.db.query.agents.findFirst({
          where: eq(schema.agents.userId, session.user.id),
        });

        if (!agent) {
          app.logger.warn(
            { userId: session.user.id },
            'Agent not found'
          );
          return reply.status(404).send({
            error: 'Agent profile not found. Please register first.',
          });
        }

        // Check if agent already submitted a form (max 1 per agent)
        const existingSubmission = await app.db
          .select()
          .from(schema.form34aSubmissions)
          .where(eq(schema.form34aSubmissions.agentId, agent.id));

        if (existingSubmission.length > 0) {
          app.logger.warn(
            { agentId: agent.id },
            'Agent already submitted a form'
          );
          return reply.status(400).send({
            error: 'You have already submitted a Form34A. Only one submission per agent is allowed.',
          });
        }

        // Use vision AI to extract serial number and candidate data
        const base64Image = buffer.toString('base64');

        app.logger.info(
          { agentId: agent.id },
          'Extracting data from form image using AI'
        );

        let extractedData: z.infer<typeof extractedDataSchema>;
        try {
          const result = await generateObject({
            model: gateway('google/gemini-3-flash'),
            schema: extractedDataSchema,
            schemaName: 'Form34AData',
            schemaDescription: 'Extract serial number and candidate results from Kenya Form34A',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    image: base64Image,
                  },
                  {
                    type: 'text',
                    text: 'Extract the serial number and all candidate results from this Form34A image. For each candidate, extract their first name, last name, party name, and votes received. Return as JSON.',
                  },
                ],
              },
            ],
          });

          extractedData = result.object;
        } catch (error) {
          app.logger.error(
            { err: error, agentId: agent.id },
            'Failed to extract data from form'
          );
          return reply.status(500).send({
            error: 'Failed to extract data from form. Please ensure the image is clear and readable.',
          });
        }

        // Check if serial number already exists (discrepancy flag)
        const existingSerialNumber = await app.db
          .select()
          .from(schema.form34aSubmissions)
          .where(eq(schema.form34aSubmissions.serialNumber, extractedData.serialNumber));

        const hasDiscrepancy = existingSerialNumber.length > 0;

        if (hasDiscrepancy) {
          app.logger.warn(
            { serialNumber: extractedData.serialNumber },
            'Duplicate serial number detected'
          );
        }

        // Upload form image to storage
        const imageKey = `form34a/${agent.id}/${Date.now()}-${filename}`;
        const uploadedKey = await app.storage.upload(imageKey, buffer);

        // Generate signed URL for the image
        const { url: imageUrl } = await app.storage.getSignedUrl(uploadedKey);

        // Create form submission record
        const form34a = await app.db
          .insert(schema.form34aSubmissions)
          .values({
            agentId: agent.id,
            serialNumber: extractedData.serialNumber,
            imageUrl: uploadedKey,
            imageKey: uploadedKey,
            county,
            constituency,
            ward,
            pollingStation,
            latitude: latitude ? latitude.toString() : undefined,
            longitude: longitude ? longitude.toString() : undefined,
            hasDiscrepancy,
          })
          .returning();

        // Create candidate results records
        const candidateRecords = await Promise.all(
          extractedData.candidates.map((candidate) =>
            app.db
              .insert(schema.candidateResults)
              .values({
                form34aId: form34a[0].id,
                candidateFirstName: candidate.candidateFirstName,
                candidateLastName: candidate.candidateLastName,
                partyName: candidate.partyName,
                votes: candidate.votes,
              })
              .returning()
          )
        );

        app.logger.info(
          {
            form34aId: form34a[0].id,
            serialNumber: form34a[0].serialNumber,
            hasDiscrepancy,
            candidateCount: candidateRecords.length,
          },
          'Form34A submitted successfully'
        );

        return {
          form34aId: form34a[0].id,
          serialNumber: form34a[0].serialNumber,
          imageUrl,
          candidates: extractedData.candidates,
          hasDiscrepancy,
          submittedAt: form34a[0].submittedAt,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to submit form34a'
        );
        return reply.status(500).send({
          error: 'Failed to submit Form34A',
        });
      }
    }
  );

  // Get agent's Form34A submission
  app.fastify.get(
    '/api/form34a/my-submission',
    {
      schema: {
        description: 'Get current agent\'s Form34A submission',
        tags: ['form34a'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id },
        'Fetching Form34A submission'
      );

      try {
        // Find agent
        const agent = await app.db.query.agents.findFirst({
          where: eq(schema.agents.userId, session.user.id),
        });

        if (!agent) {
          app.logger.warn(
            { userId: session.user.id },
            'Agent not found'
          );
          return reply.status(404).send({
            error: 'Agent profile not found',
          });
        }

        // Get form submission with candidates
        const submission = await app.db.query.form34aSubmissions.findFirst({
          where: eq(schema.form34aSubmissions.agentId, agent.id),
          with: {
            candidates: true,
          },
        });

        if (!submission) {
          app.logger.info(
            { agentId: agent.id },
            'No Form34A submission found'
          );
          return null;
        }

        // Generate signed URL for the image
        const { url: imageUrl } = await app.storage.getSignedUrl(submission.imageUrl);

        app.logger.info(
          { form34aId: submission.id },
          'Form34A submission retrieved'
        );

        return {
          id: submission.id,
          serialNumber: submission.serialNumber,
          imageUrl,
          county: submission.county,
          constituency: submission.constituency,
          ward: submission.ward,
          pollingStation: submission.pollingStation,
          submittedAt: submission.submittedAt,
          candidates: submission.candidates,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch Form34A submission'
        );
        return reply.status(500).send({
          error: 'Failed to fetch Form34A submission',
        });
      }
    }
  );
}
