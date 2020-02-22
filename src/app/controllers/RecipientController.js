import * as Yup from 'yup';
import Recipient from '../models/Recipient';

class RecipientController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string(),
      complement: Yup.string(),
      state: Yup.string(),
      number: Yup.number(),
      city: Yup.string(),
      zip_code: Yup.string()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Recipient Validation fails' });
    }

    const { id, name, street } = await Recipient.create(req.body);

    return res.json({
      id,
      name,
      street
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string(),
      complement: Yup.string(),
      state: Yup.string(),
      number: Yup.number(),
      city: Yup.string(),
      zip_code: Yup.string()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Recipient Validation fails' });
    }
    const { name } = req.body;

    const recipient = await Recipient.findByPk(req.params.id);

    if (name && name === recipient.name) {
      const recipientExists = await Recipient.findOne({
        where: { name: recipient.name }
      });

      if (recipientExists) {
        return res.status(400).json({ error: 'Recipient already exists' });
      }
    }

    const { id } = await recipient.update(req.body);

    return res.json({
      id,
      name
    });
  }

  async index(req, res) {
    const recipient = await Recipient.findAll({});
    return res.json(recipient);
  }
}

export default new RecipientController();
