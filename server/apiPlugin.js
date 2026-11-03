import { handleApiRequest } from './handler.js';

export function apiPlugin() {
  return {
    name: 'chatworld-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        return handleApiRequest(req, res, next);
      });
    },
  };
}
