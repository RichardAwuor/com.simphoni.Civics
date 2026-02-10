import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

// Kenya counties with their codes
const kenyaCounties = [
  { name: 'Baringo', code: '001' },
  { name: 'Bomet', code: '002' },
  { name: 'Bungoma', code: '003' },
  { name: 'Busia', code: '004' },
  { name: 'Calibri', code: '005' },
  { name: 'Elgeyo-Marakwet', code: '006' },
  { name: 'Embu', code: '007' },
  { name: 'Garissa', code: '008' },
  { name: 'Homa Bay', code: '009' },
  { name: 'Isiolo', code: '010' },
  { name: 'Kajiado', code: '011' },
  { name: 'Kakamega', code: '012' },
  { name: 'Kericho', code: '013' },
  { name: 'Kiambu', code: '014' },
  { name: 'Kilifi', code: '015' },
  { name: 'Kirinyaga', code: '016' },
  { name: 'Kisii', code: '017' },
  { name: 'Kisumu', code: '018' },
  { name: 'Kitui', code: '019' },
  { name: 'Kwale', code: '020' },
  { name: 'Laikipia', code: '021' },
  { name: 'Lamu', code: '022' },
  { name: 'Machakos', code: '023' },
  { name: 'Makueni', code: '024' },
  { name: 'Mandera', code: '025' },
  { name: 'Marsabit', code: '026' },
  { name: 'Meru', code: '027' },
  { name: 'Migori', code: '028' },
  { name: 'Mombasa', code: '029' },
  { name: 'Murang\'a', code: '030' },
  { name: 'Nairobi', code: '031' },
  { name: 'Nakuru', code: '032' },
  { name: 'Nandi', code: '033' },
  { name: 'Narok', code: '034' },
  { name: 'Nyamira', code: '035' },
  { name: 'Nyeri', code: '036' },
  { name: 'Samburu', code: '037' },
  { name: 'Siaya', code: '038' },
  { name: 'Taita-Taveta', code: '039' },
  { name: 'Tana River', code: '040' },
  { name: 'Transnzoia', code: '041' },
  { name: 'Turkana', code: '042' },
  { name: 'Tharaka-Nithi', code: '043' },
  { name: 'Uasin Gishu', code: '044' },
  { name: 'Vihiga', code: '045' },
  { name: 'Wajir', code: '046' },
  { name: 'West Pokot', code: '047' },
];

// Sample constituencies per county (can be expanded)
const constituenciesByCounty: Record<string, Array<{ name: string; code: string }>> = {
  'Nairobi': [
    { name: 'Kamukunji', code: '001' },
    { name: 'Kasarani', code: '002' },
    { name: 'Lang\'ata', code: '003' },
    { name: 'Makadara', code: '004' },
    { name: 'Mathare', code: '005' },
    { name: 'Nyaya', code: '006' },
    { name: 'Starehe', code: '007' },
    { name: 'Westlands', code: '008' },
  ],
  'Mombasa': [
    { name: 'Changamwe', code: '001' },
    { name: 'Kisauni', code: '002' },
    { name: 'Likoni', code: '003' },
    { name: 'Mvita', code: '004' },
  ],
  'Kiambu': [
    { name: 'Gatundu North', code: '001' },
    { name: 'Gatundu South', code: '002' },
    { name: 'Juja', code: '003' },
    { name: 'Kabete', code: '004' },
    { name: 'Kamakis', code: '005' },
    { name: 'Kiambaa', code: '006' },
    { name: 'Kikuyu', code: '007' },
    { name: 'Limuru', code: '008' },
    { name: 'Ruiru', code: '009' },
    { name: 'Thika Town', code: '010' },
  ],
  'Kisumu': [
    { name: 'Alego Usonga', code: '001' },
    { name: 'Central', code: '002' },
    { name: 'East', code: '003' },
    { name: 'Nyakach', code: '004' },
    { name: 'Nyando', code: '005' },
    { name: 'Seme', code: '006' },
    { name: 'West', code: '007' },
  ],
  'Nakuru': [
    { name: 'Bahati', code: '001' },
    { name: 'Eldama Ravine', code: '002' },
    { name: 'Gilgil', code: '003' },
    { name: 'Kuresoi North', code: '004' },
    { name: 'Kuresoi South', code: '005' },
    { name: 'Molo', code: '006' },
    { name: 'Nakuru Town', code: '007' },
    { name: 'Naivasha', code: '008' },
    { name: 'Njoro', code: '009' },
    { name: 'Rongai', code: '010' },
    { name: 'Subukia', code: '011' },
  ],
};

// Sample wards per constituency (can be expanded)
const wardsByConstituency: Record<string, Array<{ name: string; code: string }>> = {
  'Kamukunji': [
    { name: 'Eastleigh North', code: '0001' },
    { name: 'Eastleigh South', code: '0002' },
    { name: 'Kamukunji', code: '0003' },
    { name: 'Pumwani', code: '0004' },
  ],
  'Kasarani': [
    { name: 'Dandora', code: '0001' },
    { name: 'Embakasi', code: '0002' },
    { name: 'Kasarani', code: '0003' },
    { name: 'Ruai', code: '0004' },
    { name: 'Woodley', code: '0005' },
  ],
  'Changamwe': [
    { name: 'Changamwe', code: '0001' },
    { name: 'Junda', code: '0002' },
    { name: 'Kipevu', code: '0003' },
  ],
  'Kisauni': [
    { name: 'Bamburi', code: '0001' },
    { name: 'Chaani', code: '0002' },
    { name: 'Kisauni', code: '0003' },
    { name: 'Mikindani', code: '0004' },
  ],
  'Gatundu North': [
    { name: 'Gatundu North', code: '0001' },
    { name: 'Murera', code: '0002' },
  ],
  'Gatundu South': [
    { name: 'Gatundu South', code: '0001' },
    { name: 'Gitotom', code: '0002' },
  ],
  'Central': [
    { name: 'Chemelil', code: '0001' },
    { name: 'Kibos', code: '0002' },
    { name: 'Kisumu Central', code: '0003' },
  ],
  'Bahati': [
    { name: 'Bahati', code: '0001' },
    { name: 'Favours', code: '0002' },
    { name: 'Kiamwathi', code: '0003' },
    { name: 'Shauri Moyo', code: '0004' },
  ],
};

export function registerLocationsRoutes(app: App) {
  // Get all counties
  app.fastify.get(
    '/api/locations/counties',
    {
      schema: {
        description: 'Get all Kenyan counties',
        tags: ['locations'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching all counties');
      return kenyaCounties;
    }
  );

  // Get constituencies for a county
  app.fastify.get<{ Params: { county: string } }>(
    '/api/locations/constituencies/:county',
    {
      schema: {
        description: 'Get constituencies for a county',
        tags: ['locations'],
        params: {
          type: 'object',
          properties: {
            county: { type: 'string' },
          },
          required: ['county'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { county } = request.params as { county: string };
      app.logger.info({ county }, 'Fetching constituencies');

      const constituencies = constituenciesByCounty[county] || [];
      return constituencies.map((c) => ({
        name: c.name,
        code: c.code,
        county,
      }));
    }
  );

  // Get wards for a constituency
  app.fastify.get<{ Params: { constituency: string } }>(
    '/api/locations/wards/:constituency',
    {
      schema: {
        description: 'Get wards for a constituency',
        tags: ['locations'],
        params: {
          type: 'object',
          properties: {
            constituency: { type: 'string' },
          },
          required: ['constituency'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { constituency } = request.params as { constituency: string };
      app.logger.info({ constituency }, 'Fetching wards');

      const wards = wardsByConstituency[constituency] || [];
      return wards.map((w) => ({
        name: w.name,
        code: w.code,
        constituency,
      }));
    }
  );
}
