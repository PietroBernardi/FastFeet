import * as Yup from 'yup';
import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  isAfter,
  isBefore
} from 'date-fns';
import { Op } from 'sequelize';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';
import Queue from '../../lib/Queue';
import OrderMail from '../jobs/OrderMail';

class OrderController {
  async store(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
      product: Yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Error: 'Order Validation fails' });
    }
    const { recipient_id, deliveryman_id, product } = req.body;

    const isRecipient = await Recipient.findOne({
      where: { id: recipient_id }
    });

    if (!isRecipient) {
      return res
        .status(400)
        .json({ Error: 'Order: Recipient does not exist!' });
    }

    const isDeliveryman = await Deliveryman.findOne({
      where: { id: deliveryman_id }
    });

    if (!isDeliveryman) {
      return res
        .status(400)
        .json({ Error: 'Order: Deliveryman does not exist!' });
    }

    await Order.create(req.body);

    const deliveryman = await Deliveryman.findByPk(deliveryman_id);
    const recipient = await Recipient.findByPk(recipient_id);

    await Queue.add(OrderMail.key, {
      product,
      deliveryman,
      recipient
    });

    return res.json(req.body);
  }

  async index(req, res) {
    const { page, productName = '' } = req.query;
    const atualPage = page || '1';

    const orders = await Order.findAll({
      where: {
        product: {
          [Op.iLike]: `%${productName}%`
        }
      },
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email', 'avatar_id'],
          include: {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url']
          }
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'street',
            'zip_code',
            'number',
            'state',
            'city',
            'complement'
          ]
        },
        {
          model: File,
          as: 'signature',
          attributes: ['name', 'path', 'url']
        }
      ],
      attributes: [
        'id',
        'product',
        'deliveryman_id',
        'recipient_id',
        'canceled_at',
        'start_date',
        'end_date'
      ],
      offset: (atualPage - 1) * 4
    });
    return res.json(orders);
  }

  async delete(req, res) {
    const isId = await Order.findOne({ where: { id: req.params.id } });

    if (!isId) {
      return res.status(400).json({ Error: 'Order does not exist!' });
    }

    await Order.destroy({ where: { id: req.params.id } });

    return res.status(200).json({ message: 'Order man has been removed.' });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
      product: Yup.string()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Error: 'Order Validation fails' });
    }

    const order = await Order.findOne({ where: { id: req.params.id } });

    if (!order) {
      return res.status(400).json({ Error: 'Order does not exist.' });
    }

    await order.update(req.body);
    return res.status(200).json({ order });
  }

  async delivered(req, res) {
    const order = await Order.findOne({ where: { id: req.params.id } });

    if (!order) {
      return res.status(400).json({ Error: 'Order does not exist.' });
    }

    const { originalname: name, filename: path } = req.file;

    const newFile = await File.create({
      name,
      path
    });

    const finishedDelivery = await order.update({
      signatures_id: newFile.id,
      end_date: new Date()
    });

    return res.json(finishedDelivery);
  }

  async withdraw(req, res) {
    const { deliverymanId, orderId } = req.params;

    const deliveryman = await Deliveryman.findByPk(deliverymanId);
    if (!deliveryman) {
      return res.status(400).json({ Error: 'Deliveryman does not exist.' });
    }

    const order = await Order.findOne({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(400).json({ Error: 'Order does not exist.' });
    }

    if (order.deliveryman_id !== parseInt(deliverymanId, 0)) {
      return res
        .status(400)
        .json({ Error: 'The order does not belong to this deliveryman' });
    }

    if (order.canceled_at) {
      return res.status(400).json({ Error: 'Order has been cancelled' });
    }

    if (order.start_date) {
      return res
        .status(400)
        .json({ Error: 'Order has already been withdrawn' });
    }

    const date = new Date();

    const startDelivery = setSeconds(setMinutes(setHours(date, 8), 0), 0);
    const endDelivery = setSeconds(setMinutes(setHours(date, 18), 0), 0);

    if (!(isAfter(date, startDelivery) && isBefore(date, endDelivery))) {
      return res.status(400).json({
        Error: 'The order can only be initiated between 8 am and 6 pm'
      });
    }

    const { count: countAttempts } = await Order.findAndCountAll({
      where: {
        deliveryman_id: deliverymanId,
        canceled_at: null,
        start_date: { [Op.between]: [startOfDay(date), endOfDay(date)] }
      }
    });

    if (countAttempts >= 5) {
      return res.status(400).json({
        Error: 'Deliveryman: You have reached the withdrawal limit for today.'
      });
    }

    const deliveryStart = await order.update({ start_date: new Date() });

    return res.json(deliveryStart);
  }
}

export default new OrderController();
