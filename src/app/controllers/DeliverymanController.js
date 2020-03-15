import * as Yup from 'yup';
import { Op } from 'sequelize';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class DeliveryMansController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Delivery man: Validation fails' });
    }

    const deliverymansExists = await Deliveryman.findOne({
      where: { email: req.body.email }
    });

    if (deliverymansExists) {
      return res.status(400).json({ error: 'Delivery man already exists.' });
    }

    const { id, name, email } = await Deliveryman.create(req.body);

    return res.json({
      id,
      name,
      email
    });
  }

  async index(req, res) {
    const { deliverymanName = '' } = req.query;

    const deliveryman = await Deliveryman.findAll({
      where: {
        name: {
          [Op.iLike]: `%${deliverymanName}%`
        }
      },
      order: ['id'],
      attributes: ['id', 'name', 'email'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url']
        }
      ]
    });

    return res.json(deliveryman);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Deliveryman: Validation fails.' });
    }

    const { email, name } = req.body;

    const deliveryman = await Deliveryman.findByPk(req.params.id);

    if (!deliveryman) {
      return res.status(400).json({ Error: 'Deliveryman does not exist.' });
    }

    if (email && email !== deliveryman.email) {
      const deliverymanExists = await Deliveryman.findOne({
        where: { email }
      });

      if (deliverymanExists) {
        return res
          .status(400)
          .json({ error: 'Deliveryman email already exists.' });
      }
    }

    const { id } = await deliveryman.update(req.body);

    return res.json({
      id,
      name,
      email
    });
  }

  async delete(req, res) {
    const deliverymanExists = await Deliveryman.findByPk(req.params.id);

    if (!deliverymanExists) {
      return res.status(400).json({ error: 'Delivery man do not exists' });
    }

    await Deliveryman.destroy({ where: { id: req.params.id } });

    return res.status(200).json({ message: 'Delivery man has been removed.' });
  }
}

export default new DeliveryMansController();
