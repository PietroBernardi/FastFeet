import Sequelize, { Model } from 'sequelize';

class Recipient extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        street: Sequelize.STRING,
        complement: Sequelize.STRING,
        state: Sequelize.STRING,
        number: Sequelize.NUMBER,
        city: Sequelize.STRING,
        zip_code: Sequelize.STRING
      },
      {
        sequelize
      }
    );
    return this;
  }
}

export default Recipient;
