import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, count, sum, sql, desc, asc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerDashboardRoutes(app: App) {
  // Get candidate votes aggregated across all submissions
  app.fastify.get<{ Querystring: { county?: string } }>(
    '/api/dashboard/candidate-votes',
    {
      schema: {
        description: 'Get aggregated candidate votes across all submissions',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            county: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { county } = request.query as { county?: string };

      app.logger.info({ county }, 'Fetching candidate votes');

      try {
        const baseQuery = app.db
          .select({
            candidateFirstName: schema.candidateResults.candidateFirstName,
            candidateLastName: schema.candidateResults.candidateLastName,
            partyName: schema.candidateResults.partyName,
            totalVotes: sum(schema.candidateResults.votes),
            formsCount: count(schema.form34aSubmissions.id),
          })
          .from(schema.candidateResults)
          .leftJoin(
            schema.form34aSubmissions,
            eq(schema.candidateResults.form34aId, schema.form34aSubmissions.id)
          )
          .groupBy(
            schema.candidateResults.candidateFirstName,
            schema.candidateResults.candidateLastName,
            schema.candidateResults.partyName
          );

        // Add county filter if provided
        let results: any;
        if (county) {
          results = await baseQuery.where(
            eq(schema.form34aSubmissions.county, county)
          );
        } else {
          results = await baseQuery;
        }

        app.logger.info(
          { county, resultCount: results.length },
          'Candidate votes retrieved'
        );

        return results.map((r: any) => ({
          candidateFirstName: r.candidateFirstName,
          candidateLastName: r.candidateLastName,
          partyName: r.partyName,
          totalVotes: r.totalVotes ? Number(r.totalVotes) : 0,
          formsCount: r.formsCount ? Number(r.formsCount) : 0,
        }));
      } catch (error) {
        app.logger.error(
          { err: error, county },
          'Failed to fetch candidate votes'
        );
        return reply.status(500).send({
          error: 'Failed to fetch candidate votes',
        });
      }
    }
  );

  // Get incident videos for a county
  app.fastify.get<{ Querystring: { county: string } }>(
    '/api/dashboard/incident-videos',
    {
      schema: {
        description: 'Get incident videos for a county',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            county: { type: 'string' },
          },
          required: ['county'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { county } = request.query as { county: string };

      app.logger.info({ county }, 'Fetching incident videos');

      try {
        const videos = await app.db
          .select({
            videoCode: schema.incidentVideos.videoCode,
            videoUrl: schema.incidentVideos.videoUrl,
            agentCivicCode: schema.agents.civicCode,
            county: schema.agents.county,
            constituency: schema.agents.constituency,
            ward: schema.agents.ward,
            latitude: schema.incidentVideos.latitude,
            longitude: schema.incidentVideos.longitude,
            uploadedAt: schema.incidentVideos.uploadedAt,
          })
          .from(schema.incidentVideos)
          .leftJoin(
            schema.agents,
            eq(schema.incidentVideos.agentId, schema.agents.id)
          )
          .where(eq(schema.agents.county, county));

        // Generate signed URLs
        const videosWithUrls = await Promise.all(
          videos.map(async (video: any) => {
            try {
              const { url } = await app.storage.getSignedUrl(video.videoUrl);
              return {
                videoCode: video.videoCode,
                videoUrl: url,
                agentCivicCode: video.agentCivicCode,
                county: video.county,
                constituency: video.constituency,
                ward: video.ward,
                latitude: video.latitude,
                longitude: video.longitude,
                uploadedAt: video.uploadedAt,
              };
            } catch {
              return null;
            }
          })
        );

        const filteredVideos = videosWithUrls.filter((v) => v !== null);

        app.logger.info(
          { county, videoCount: filteredVideos.length },
          'Incident videos retrieved'
        );

        return filteredVideos;
      } catch (error) {
        app.logger.error(
          { err: error, county },
          'Failed to fetch incident videos'
        );
        return reply.status(500).send({
          error: 'Failed to fetch incident videos',
        });
      }
    }
  );

  // Search Form34A by agent code
  app.fastify.get<{ Querystring: { agentCode: string } }>(
    '/api/dashboard/form34a-search',
    {
      schema: {
        description: 'Search Form34A submission by agent code',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            agentCode: { type: 'string' },
          },
          required: ['agentCode'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { agentCode } = request.query as { agentCode: string };

      app.logger.info({ agentCode }, 'Searching Form34A by agent code');

      try {
        // Find agent by civic code
        const agent = await app.db.query.agents.findFirst({
          where: eq(schema.agents.civicCode, agentCode),
        });

        if (!agent) {
          app.logger.info({ agentCode }, 'Agent not found');
          return reply.status(404).send({
            error: 'Agent not found',
          });
        }

        // Get form submission
        const form34a = await app.db.query.form34aSubmissions.findFirst({
          where: eq(schema.form34aSubmissions.agentId, agent.id),
          with: {
            candidates: true,
          },
        });

        if (!form34a) {
          app.logger.info({ agentCode }, 'No Form34A submission found for agent');
          return null;
        }

        // Generate signed URL for image
        const { url: imageUrl } = await app.storage.getSignedUrl(form34a.imageUrl);

        app.logger.info(
          { agentCode, form34aId: form34a.id },
          'Form34A found'
        );

        return {
          form34a: {
            id: form34a.id,
            serialNumber: form34a.serialNumber,
            imageUrl,
            county: form34a.county,
            constituency: form34a.constituency,
            ward: form34a.ward,
            pollingStation: form34a.pollingStation,
            submittedAt: form34a.submittedAt,
            verified: form34a.verified,
            hasDiscrepancy: form34a.hasDiscrepancy,
          },
          agent: {
            civicCode: agent.civicCode,
            firstName: agent.firstName,
            lastName: agent.lastName,
            email: agent.email,
          },
          candidates: form34a.candidates,
        };
      } catch (error) {
        app.logger.error(
          { err: error, agentCode },
          'Failed to search Form34A'
        );
        return reply.status(500).send({
          error: 'Failed to search Form34A',
        });
      }
    }
  );

  // Get serial number discrepancies
  app.fastify.get<{ Querystring: { county?: string; constituency?: string; ward?: string } }>(
    '/api/dashboard/serial-discrepancies',
    {
      schema: {
        description: 'Get serial numbers that appear multiple times (discrepancies)',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            county: { type: 'string' },
            constituency: { type: 'string' },
            ward: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { county, constituency, ward } = request.query as {
        county?: string;
        constituency?: string;
        ward?: string;
      };

      app.logger.info(
        { county, constituency, ward },
        'Fetching serial discrepancies'
      );

      try {
        // Get serial numbers that appear more than once
        const duplicateSerials = await app.db
          .select({
            serialNumber: schema.form34aSubmissions.serialNumber,
            count: count(),
          })
          .from(schema.form34aSubmissions)
          .groupBy(schema.form34aSubmissions.serialNumber)
          .having(sql`count(*) > 1`);

        const results: any[] = [];

        for (const dup of duplicateSerials) {
          // Build where conditions
          const conditions: any[] = [eq(schema.form34aSubmissions.serialNumber, dup.serialNumber)];
          if (county) {
            conditions.push(eq(schema.form34aSubmissions.county, county));
          }
          if (constituency) {
            conditions.push(eq(schema.form34aSubmissions.constituency, constituency));
          }
          if (ward) {
            conditions.push(eq(schema.form34aSubmissions.ward, ward));
          }

          const forms = await app.db
            .select()
            .from(schema.form34aSubmissions)
            .where(and(...conditions));

          if (forms.length > 0) {
            // Get agent details for each form
            const formsWithAgents = await Promise.all(
              forms.map(async (form) => {
                const agent = await app.db.query.agents.findFirst({
                  where: eq(schema.agents.id, form.agentId),
                });
                return {
                  agentCode: agent?.civicCode,
                  county: form.county,
                  constituency: form.constituency,
                  ward: form.ward,
                  submittedAt: form.submittedAt,
                };
              })
            );

            results.push({
              serialNumber: dup.serialNumber,
              submissionCount: formsWithAgents.length,
              forms: formsWithAgents,
            });
          }
        }

        app.logger.info(
          { resultCount: results.length, county, constituency, ward },
          'Serial discrepancies retrieved'
        );

        return results;
      } catch (error) {
        app.logger.error(
          { err: error, county, constituency, ward },
          'Failed to fetch serial discrepancies'
        );
        return reply.status(500).send({
          error: 'Failed to fetch serial discrepancies',
        });
      }
    }
  );

  // Get polling stations with no submissions
  app.fastify.get<{ Querystring: { county?: string; constituency?: string; ward?: string } }>(
    '/api/dashboard/missing-submissions',
    {
      schema: {
        description: 'Get polling stations with no Form34A submissions',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            county: { type: 'string' },
            constituency: { type: 'string' },
            ward: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { county, constituency, ward } = request.query as {
        county?: string;
        constituency?: string;
        ward?: string;
      };

      app.logger.info(
        { county, constituency, ward },
        'Fetching missing submissions'
      );

      try {
        let stationsQuery = app.db
          .select()
          .from(schema.pollingStations);

        // Apply filters
        if (county) {
          stationsQuery = stationsQuery.where(
            eq(schema.pollingStations.county, county)
          ) as any;
        }
        if (constituency) {
          stationsQuery = stationsQuery.where(
            eq(schema.pollingStations.constituency, constituency)
          ) as any;
        }
        if (ward) {
          stationsQuery = stationsQuery.where(
            eq(schema.pollingStations.ward, ward)
          ) as any;
        }

        const stations = await stationsQuery;

        const results: any[] = [];

        for (const station of stations) {
          const submission = await app.db.query.form34aSubmissions.findFirst({
            where: eq(schema.form34aSubmissions.pollingStation, station.stationName),
          });

          if (!submission) {
            results.push({
              pollingStation: station.stationName,
              county: station.county,
              constituency: station.constituency,
              ward: station.ward,
              stationCode: station.stationCode,
              hasSubmission: false,
            });
          }
        }

        app.logger.info(
          { resultCount: results.length, county, constituency, ward },
          'Missing submissions retrieved'
        );

        return results;
      } catch (error) {
        app.logger.error(
          { err: error, county, constituency, ward },
          'Failed to fetch missing submissions'
        );
        return reply.status(500).send({
          error: 'Failed to fetch missing submissions',
        });
      }
    }
  );

  // Get polling stations with extra/multiple submissions
  app.fastify.get<{ Querystring: { county?: string; constituency?: string; ward?: string } }>(
    '/api/dashboard/extra-submissions',
    {
      schema: {
        description: 'Get polling stations with multiple submissions',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            county: { type: 'string' },
            constituency: { type: 'string' },
            ward: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { county, constituency, ward } = request.query as {
        county?: string;
        constituency?: string;
        ward?: string;
      };

      app.logger.info(
        { county, constituency, ward },
        'Fetching extra submissions'
      );

      try {
        let formQuery = app.db
          .select({
            pollingStation: schema.form34aSubmissions.pollingStation,
            county: schema.form34aSubmissions.county,
            constituency: schema.form34aSubmissions.constituency,
            ward: schema.form34aSubmissions.ward,
            agentId: schema.form34aSubmissions.agentId,
            submittedAt: schema.form34aSubmissions.submittedAt,
          })
          .from(schema.form34aSubmissions);

        // Apply filters
        if (county) {
          formQuery = formQuery.where(
            eq(schema.form34aSubmissions.county, county)
          ) as any;
        }
        if (constituency) {
          formQuery = formQuery.where(
            eq(schema.form34aSubmissions.constituency, constituency)
          ) as any;
        }
        if (ward) {
          formQuery = formQuery.where(
            eq(schema.form34aSubmissions.ward, ward)
          ) as any;
        }

        const submissions = await formQuery;

        // Group by polling station and get those with multiple submissions
        const stationMap = new Map<string, any[]>();
        for (const sub of submissions) {
          const key = sub.pollingStation;
          if (!stationMap.has(key)) {
            stationMap.set(key, []);
          }
          stationMap.get(key)!.push(sub);
        }

        const results: any[] = [];

        for (const [station, forms] of stationMap) {
          if (forms.length > 1) {
            // Get agent details for each form
            const formDetails = await Promise.all(
              forms.map(async (form) => {
                const agent = await app.db.query.agents.findFirst({
                  where: eq(schema.agents.id, form.agentId),
                });
                return {
                  agentCode: agent?.civicCode,
                  submittedAt: form.submittedAt,
                };
              })
            );

            results.push({
              pollingStation: station,
              county: forms[0].county,
              constituency: forms[0].constituency,
              ward: forms[0].ward,
              submissions: formDetails,
            });
          }
        }

        app.logger.info(
          { resultCount: results.length, county, constituency, ward },
          'Extra submissions retrieved'
        );

        return results;
      } catch (error) {
        app.logger.error(
          { err: error, county, constituency, ward },
          'Failed to fetch extra submissions'
        );
        return reply.status(500).send({
          error: 'Failed to fetch extra submissions',
        });
      }
    }
  );

  // Get duplicate submissions (same station or same serial)
  app.fastify.get<{ Querystring: { county?: string; constituency?: string; ward?: string } }>(
    '/api/dashboard/duplicate-submissions',
    {
      schema: {
        description: 'Get duplicate submissions by station or serial number',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            county: { type: 'string' },
            constituency: { type: 'string' },
            ward: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { county, constituency, ward } = request.query as {
        county?: string;
        constituency?: string;
        ward?: string;
      };

      app.logger.info(
        { county, constituency, ward },
        'Fetching duplicate submissions'
      );

      try {
        const results: any[] = [];

        // Get duplicates by polling station
        let stationQuery = app.db
          .select({
            pollingStation: schema.form34aSubmissions.pollingStation,
            count: count(),
          })
          .from(schema.form34aSubmissions)
          .groupBy(schema.form34aSubmissions.pollingStation)
          .having(sql`count(*) > 1`);

        const duplicateStations = await stationQuery;

        for (const dup of duplicateStations) {
          // Build where conditions
          const conditions: any[] = [eq(schema.form34aSubmissions.pollingStation, dup.pollingStation)];
          if (county) {
            conditions.push(eq(schema.form34aSubmissions.county, county));
          }
          if (constituency) {
            conditions.push(eq(schema.form34aSubmissions.constituency, constituency));
          }
          if (ward) {
            conditions.push(eq(schema.form34aSubmissions.ward, ward));
          }

          const forms = await app.db
            .select()
            .from(schema.form34aSubmissions)
            .where(and(...conditions));

          if (forms.length > 1) {
            const submissions = await Promise.all(
              forms.map(async (form) => {
                const agent = await app.db.query.agents.findFirst({
                  where: eq(schema.agents.id, form.agentId),
                });
                return {
                  agentCode: agent?.civicCode,
                  serialNumber: form.serialNumber,
                  submittedAt: form.submittedAt,
                };
              })
            );

            results.push({
              type: 'same_station',
              pollingStation: dup.pollingStation,
              submissions,
            });
          }
        }

        // Get duplicates by serial number
        const duplicateSerials = await app.db
          .select({
            serialNumber: schema.form34aSubmissions.serialNumber,
            count: count(),
          })
          .from(schema.form34aSubmissions)
          .groupBy(schema.form34aSubmissions.serialNumber)
          .having(sql`count(*) > 1`);

        for (const dup of duplicateSerials) {
          // Build where conditions
          const conditions: any[] = [eq(schema.form34aSubmissions.serialNumber, dup.serialNumber)];
          if (county) {
            conditions.push(eq(schema.form34aSubmissions.county, county));
          }
          if (constituency) {
            conditions.push(eq(schema.form34aSubmissions.constituency, constituency));
          }
          if (ward) {
            conditions.push(eq(schema.form34aSubmissions.ward, ward));
          }

          const forms = await app.db
            .select()
            .from(schema.form34aSubmissions)
            .where(and(...conditions));

          if (forms.length > 1) {
            const submissions = await Promise.all(
              forms.map(async (form) => {
                const agent = await app.db.query.agents.findFirst({
                  where: eq(schema.agents.id, form.agentId),
                });
                return {
                  agentCode: agent?.civicCode,
                  pollingStation: form.pollingStation,
                  submittedAt: form.submittedAt,
                };
              })
            );

            results.push({
              type: 'same_serial',
              serialNumber: dup.serialNumber,
              submissions,
            });
          }
        }

        app.logger.info(
          { resultCount: results.length, county, constituency, ward },
          'Duplicate submissions retrieved'
        );

        return results;
      } catch (error) {
        app.logger.error(
          { err: error, county, constituency, ward },
          'Failed to fetch duplicate submissions'
        );
        return reply.status(500).send({
          error: 'Failed to fetch duplicate submissions',
        });
      }
    }
  );
}
