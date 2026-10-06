// Arquivo: src/routes/index.ts
import { Router } from 'express';
import userRoutes from './user.route.js';
import clienteRoutes from './cliente.route.js';
import authRoutes from './auth.route.js';

const routes = Router();
routes.use(userRoutes);
routes.use(clienteRoutes);
routes.use(authRoutes);
export default routes;