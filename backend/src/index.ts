import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';

// Import route registration functions
import { registerAuthRoutes } from './routes/auth.js';
import { registerAgentRoutes } from './routes/agents.js';
import { registerLocationsRoutes } from './routes/locations.js';
import { registerIncidentsRoutes } from './routes/incidents.js';
import { registerForm34aRoutes } from './routes/form34a.js';
import { registerDashboardRoutes } from './routes/dashboard.js';
import { registerPollingStationsRoutes } from './routes/polling-stations.js';

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Create application with combined schema
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication with Better Auth
app.withAuth();

// Enable storage for file uploads
app.withStorage();

// Register routes - IMPORTANT: Only register AFTER app is created
registerAuthRoutes(app);
registerAgentRoutes(app);
registerLocationsRoutes(app);
registerIncidentsRoutes(app);
registerForm34aRoutes(app);
registerDashboardRoutes(app);
registerPollingStationsRoutes(app);

await app.run();
app.logger.info('Kenya Civic - WANJIKU@63 - Application running');
