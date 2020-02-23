import Sequelize from 'sequelize';

import User from '../app/models/User';
import Deliveryman from '../app/models/Deliveryman';
import File from '../app/models/File';
import Order from '../app/models/Order';
import Recipient from '../app/models/Recipient';
import DeliveryProblem from '../app/models/DeliveryProblem';

import databaseconfig from '../config/database';

const models = [User, Deliveryman, File, Order, Recipient, DeliveryProblem];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseconfig);

    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }
}

export default new Database();
