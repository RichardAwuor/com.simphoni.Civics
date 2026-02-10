import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { z } from 'zod';

const uploadVideoSchema = z.object({
  latitude: z.string().or(z.number()),
  longitude: z.string().or(z.number()),
  locationName: z.string().optional(),
});

export function registerIncidentsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // Upload video
  app.fastify.post<{ Body: z.infer<typeof uploadVideoSchema> }>(
    '/api/incidents/upload-video',
    {
      schema: {
        description: 'Upload incident video',
        tags: ['incidents'],
        consumes: ['multipart/form-data'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id },
        'Video upload started'
      );

      try {
        // Get multipart data
        const parts = request.parts();
        let buffer: Buffer | null = null;
        let latitude = 0;
        let longitude = 0;
        let locationName = '';
        let filename = '';

        for await (const part of parts) {
          if (part.type === 'file') {
            filename = part.filename as string;
            try {
              buffer = await part.toBuffer();
            } catch (err) {
              app.logger.error({ err }, 'File too large');
              return reply.status(413).send({ error: 'Video file too large' });
            }
          } else if (part.type === 'field') {
            const fieldname = part.fieldname as string;
            const value = (part.value || '') as string;
            if (fieldname === 'latitude') {
              latitude = parseFloat(value || '0');
            } else if (fieldname === 'longitude') {
              longitude = parseFloat(value || '0');
            } else if (fieldname === 'locationName') {
              locationName = value || '';
            }
          }
        }

        if (!buffer) {
          app.logger.warn({ userId: session.user.id }, 'No file provided');
          return reply.status(400).send({ error: 'No video file provided' });
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

        // Check video count for this agent (max 3)
        const videoCount = await app.db
          .select()
          .from(schema.incidentVideos)
          .where(eq(schema.incidentVideos.agentId, agent.id));

        if (videoCount.length >= 3) {
          app.logger.warn(
            { agentId: agent.id },
            'Maximum videos exceeded'
          );
          return reply.status(400).send({
            error: 'You can upload a maximum of 3 videos',
          });
        }

        // Upload to storage
        const videoKey = `incidents/${agent.id}/${Date.now()}-${filename}`;
        const uploadedKey = await app.storage.upload(videoKey, buffer);

        // Generate video code (CIVIC_CODE-A/B/C)
        const videoLetters = ['A', 'B', 'C'];
        const videoLetter = videoLetters[videoCount.length];
        const videoCode = `${agent.civicCode}-${videoLetter}`;

        // Create video record
        const video = await app.db
          .insert(schema.incidentVideos)
          .values({
            agentId: agent.id,
            videoUrl: uploadedKey,
            videoCode,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            locationName,
            duration: Math.floor(buffer.length / 1000), // Rough estimate
          })
          .returning();

        // Generate signed URL
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        app.logger.info(
          { agentId: agent.id, videoCode },
          'Video uploaded successfully'
        );

        return {
          videoUrl: url,
          videoCode: video[0].videoCode,
          uploadedAt: video[0].uploadedAt,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to upload video'
        );
        return reply.status(500).send({
          error: 'Failed to upload video',
        });
      }
    }
  );

  // Get agent's videos
  app.fastify.get(
    '/api/incidents/my-videos',
    {
      schema: {
        description: 'Get current agent\'s uploaded videos',
        tags: ['incidents'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id },
        'Fetching agent videos'
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

        // Get videos
        const videos = await app.db
          .select()
          .from(schema.incidentVideos)
          .where(eq(schema.incidentVideos.agentId, agent.id));

        // Generate signed URLs for each video
        const videosWithUrls = await Promise.all(
          videos.map(async (video) => {
            const { url } = await app.storage.getSignedUrl(video.videoUrl);
            return {
              id: video.id,
              videoCode: video.videoCode,
              videoUrl: url,
              latitude: video.latitude,
              longitude: video.longitude,
              locationName: video.locationName,
              uploadedAt: video.uploadedAt,
            };
          })
        );

        app.logger.info(
          { agentId: agent.id, count: videosWithUrls.length },
          'Videos retrieved'
        );

        return videosWithUrls;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch videos'
        );
        return reply.status(500).send({
          error: 'Failed to fetch videos',
        });
      }
    }
  );
}
