import * as Yup from 'yup';

import DeliveryProblem from '../models/DeliveryProblem';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
import Order from '../models/Order';
import CancellationOrderMail from '../jobs/OrderCancellationMail';
import Queue from '../../lib/Queue';

class DeliveryProblemController {
  async show(req, res) {
    const deliveryProblem = await DeliveryProblem.findAll({
      where: { delivery_id: req.params.orderId },
      attributes: ['delivery_id', 'description'],
      include: {
        model: Order,
        as: 'order_problem',
        attributes: ['id', 'product', 'recipient_id', 'deliveryman_id']
      }
    });

    if (!deliveryProblem) {
      return res
        .status(404)
        .json({ Message: 'There is no problems registered to this order.' });
    }

    return res.json(deliveryProblem);
  }

  async index(req, res) {
    const { page = '' } = req.query;
    const atualPage = page || '1';

    const deliveryProblem = await DeliveryProblem.findAll({
      attributes: ['id', 'delivery_id', 'description'],
      offset: (atualPage - 1) * 4,
      include: {
        model: Order,
        as: 'order_problem',
        attributes: ['id', 'product', 'recipient_id', 'deliveryman_id']
      }
    });

    if (!deliveryProblem) {
      return res
        .status(404)
        .json({ Message: 'There is no problems registered' });
    }

    return res.json(deliveryProblem);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
      delivery_id: Yup.number().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Error: 'Delivery Validation fails!' });
    }

    const order = await Order.findOne({
      where: { id: req.params.orderId }
    });

    if (!order) {
      return res.status(400).json({ Error: 'Order does not exist!' });
    }

    if (req.body.delivery_id && req.body.delivery_id !== order.deliveryman_id) {
      return res.status(400).json({ Error: 'You are not allowed to do it' });
    }

    const newProblem = await DeliveryProblem.create({
      delivery_id: req.params.orderId,
      description: req.body.description
    });

    return res.json({
      id: newProblem.id,
      delivery_id: newProblem.delivery_id,
      description: newProblem.description
    });
  }

  async delete(req, res) {
    const deliveryProblem = await DeliveryProblem.findOne({
      where: { id: req.params.id }
    });

    if (!deliveryProblem) {
      return res.status(404).json({
        Message: 'There is no problems registered to this order.'
      });
    }

    const order = await Order.findOne({
      where: { id: deliveryProblem.delivery_id }
    });

    const deliveryman = await Deliveryman.findByPk(order.deliveryman_id);
    const recipient = await Recipient.findByPk(order.recipient_id);

    await Queue.add(CancellationOrderMail.key, {
      order,
      deliveryman,
      recipient
    });

    const deliveryCancel = await order.update({ canceled_at: new Date() });

    return res.status(200).json({ deliveryCancel });
  }
}

export default new DeliveryProblemController();
