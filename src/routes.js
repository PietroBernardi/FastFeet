import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import DeliverymanController from './app/controllers/DeliverymanController';
import DeliverymanSessionController from './app/controllers/DeliverymanSessionController';
import OrderController from './app/controllers/OrderController';
import FileController from './app/controllers/FileController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

/**
 * Users routes
 */
routes.post('/users', UserController.store);

/**
 * Sessions routes
 */
routes.post('/sessions', SessionController.store);

/**
 * Orders routes
 */
routes.put('/order/:orderId/withdraw/:deliverymanId', OrderController.withdraw);
routes.put(
  '/orders/deliver/:deliverymanId',
  upload.single('file'),
  OrderController.delivered
);

/**
 * Deliveryman Session routes
 */
routes.get('/deliveryman/:deliverymanId', DeliverymanSessionController.index);
routes.get(
  '/deliveryman/:deliverymanId/deliveries',
  DeliverymanSessionController.deliveries
);

/**
 * Delivery Problem routes
 */
routes.post('/delivery/:orderId/problems', DeliveryProblemController.store);

routes.use(authMiddleware);

/**
 * Auth: Users routes
 */
routes.put('/users', UserController.update);

/**
 * Auth: Recipients routes
 */
routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);
routes.get('/recipients', RecipientController.index);

/**
 * Auth: Deliverymans routes
 */
routes.get('/deliverymans', DeliverymanController.index);
routes.post('/deliverymans', DeliverymanController.store);
routes.put('/deliverymans/:id', DeliverymanController.update);
routes.delete('/deliverymans/:id', DeliverymanController.delete);

/**
 * Auth: Files
 */
routes.post('/files', upload.single('file'), FileController.store);

/**
 * Auth: Orders routes
 */
routes.post('/orders', OrderController.store);
routes.get('/orders', OrderController.index);
routes.delete('/orders/:id', OrderController.delete);
routes.put('/orders/:id', OrderController.update);

/**
 * Auth: Delivery Problem routes
 */
routes.get('/delivery/problems', DeliveryProblemController.index);
routes.get('/delivery/:orderId/problems', DeliveryProblemController.show);
routes.delete('/problem/:id/cancel-delivery', DeliveryProblemController.delete);

export default routes;
