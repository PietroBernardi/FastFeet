import expreess from 'express';
import routes from './routes';

import './database';

class App {
  constructor() {
    this.server = expreess();

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use(expreess.json());
  }

  routes() {
    this.server.use(routes);
  }
}

export default new App().server;
