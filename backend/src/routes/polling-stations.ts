import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as schema from '../db/schema.js';

// Sample polling stations data for Kenya
const samplePollingStations = [
  // Nairobi - Kamukunji
  { county: 'Nairobi', constituency: 'Kamukunji', ward: 'Eastleigh North', stationName: 'Eastleigh North Primary School', stationCode: 'KAM-001-0001-001' },
  { county: 'Nairobi', constituency: 'Kamukunji', ward: 'Eastleigh North', stationName: 'Eastleigh Medical Centre', stationCode: 'KAM-001-0001-002' },
  { county: 'Nairobi', constituency: 'Kamukunji', ward: 'Eastleigh South', stationName: 'Eastleigh South Primary School', stationCode: 'KAM-001-0002-001' },
  { county: 'Nairobi', constituency: 'Kamukunji', ward: 'Kamukunji', stationName: 'Kamukunji Secondary School', stationCode: 'KAM-001-0003-001' },
  { county: 'Nairobi', constituency: 'Kamukunji', ward: 'Pumwani', stationName: 'Pumwani Primary School', stationCode: 'KAM-001-0004-001' },

  // Nairobi - Kasarani
  { county: 'Nairobi', constituency: 'Kasarani', ward: 'Dandora', stationName: 'Dandora Primary School', stationCode: 'KAS-002-0001-001' },
  { county: 'Nairobi', constituency: 'Kasarani', ward: 'Embakasi', stationName: 'Embakasi Secondary School', stationCode: 'KAS-002-0002-001' },
  { county: 'Nairobi', constituency: 'Kasarani', ward: 'Kasarani', stationName: 'Kasarani Primary School', stationCode: 'KAS-002-0003-001' },
  { county: 'Nairobi', constituency: 'Kasarani', ward: 'Ruai', stationName: 'Ruai Primary School', stationCode: 'KAS-002-0004-001' },
  { county: 'Nairobi', constituency: 'Kasarani', ward: 'Woodley', stationName: 'Woodley Primary School', stationCode: 'KAS-002-0005-001' },

  // Mombasa - Changamwe
  { county: 'Mombasa', constituency: 'Changamwe', ward: 'Changamwe', stationName: 'Changamwe Primary School', stationCode: 'CHG-001-0001-001' },
  { county: 'Mombasa', constituency: 'Changamwe', ward: 'Junda', stationName: 'Junda Primary School', stationCode: 'CHG-001-0002-001' },
  { county: 'Mombasa', constituency: 'Changamwe', ward: 'Kipevu', stationName: 'Kipevu Primary School', stationCode: 'CHG-001-0003-001' },

  // Mombasa - Kisauni
  { county: 'Mombasa', constituency: 'Kisauni', ward: 'Bamburi', stationName: 'Bamburi Primary School', stationCode: 'KIS-002-0001-001' },
  { county: 'Mombasa', constituency: 'Kisauni', ward: 'Chaani', stationName: 'Chaani Primary School', stationCode: 'KIS-002-0002-001' },
  { county: 'Mombasa', constituency: 'Kisauni', ward: 'Kisauni', stationName: 'Kisauni Primary School', stationCode: 'KIS-002-0003-001' },
  { county: 'Mombasa', constituency: 'Kisauni', ward: 'Mikindani', stationName: 'Mikindani Primary School', stationCode: 'KIS-002-0004-001' },

  // Kiambu - Gatundu North
  { county: 'Kiambu', constituency: 'Gatundu North', ward: 'Gatundu North', stationName: 'Gatundu North Primary School', stationCode: 'GAT-001-0001-001' },
  { county: 'Kiambu', constituency: 'Gatundu North', ward: 'Murera', stationName: 'Murera Primary School', stationCode: 'GAT-001-0002-001' },

  // Kiambu - Gatundu South
  { county: 'Kiambu', constituency: 'Gatundu South', ward: 'Gatundu South', stationName: 'Gatundu South Primary School', stationCode: 'GAS-002-0001-001' },
  { county: 'Kiambu', constituency: 'Gatundu South', ward: 'Gitotom', stationName: 'Gitotom Primary School', stationCode: 'GAS-002-0002-001' },

  // Kisumu - Central
  { county: 'Kisumu', constituency: 'Central', ward: 'Chemelil', stationName: 'Chemelil Primary School', stationCode: 'CEN-001-0001-001' },
  { county: 'Kisumu', constituency: 'Central', ward: 'Kibos', stationName: 'Kibos Primary School', stationCode: 'CEN-001-0002-001' },
  { county: 'Kisumu', constituency: 'Central', ward: 'Kisumu Central', stationName: 'Kisumu Central Primary School', stationCode: 'CEN-001-0003-001' },

  // Nakuru - Bahati
  { county: 'Nakuru', constituency: 'Bahati', ward: 'Bahati', stationName: 'Bahati Primary School', stationCode: 'BAH-001-0001-001' },
  { county: 'Nakuru', constituency: 'Bahati', ward: 'Favours', stationName: 'Favours Primary School', stationCode: 'BAH-001-0002-001' },
  { county: 'Nakuru', constituency: 'Bahati', ward: 'Kiamwathi', stationName: 'Kiamwathi Primary School', stationCode: 'BAH-001-0003-001' },
  { county: 'Nakuru', constituency: 'Bahati', ward: 'Shauri Moyo', stationName: 'Shauri Moyo Primary School', stationCode: 'BAH-001-0004-001' },
];

export function registerPollingStationsRoutes(app: App) {
  // Initialize polling stations (one-time setup)
  app.fastify.post(
    '/api/admin/init-polling-stations',
    {
      schema: {
        description: 'Initialize polling stations database (admin only)',
        tags: ['admin'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Initializing polling stations');

      try {
        // Clear existing stations
        await app.db.delete(schema.pollingStations);

        // Insert sample polling stations
        for (const station of samplePollingStations) {
          await app.db
            .insert(schema.pollingStations)
            .values({
              county: station.county,
              constituency: station.constituency,
              ward: station.ward,
              stationName: station.stationName,
              stationCode: station.stationCode,
              expectedAgents: 1,
            });
        }

        app.logger.info(
          { count: samplePollingStations.length },
          'Polling stations initialized'
        );

        return {
          success: true,
          message: `Initialized ${samplePollingStations.length} polling stations`,
          count: samplePollingStations.length,
        };
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to initialize polling stations'
        );
        return reply.status(500).send({
          error: 'Failed to initialize polling stations',
        });
      }
    }
  );
}
