import Mail from '../../lib/Mail';

class OrderCancellationMail {
  get key() {
    return 'OrderCancellationMail';
  }

  async handle({ data }) {
    const { order, deliveryman, recipient } = data;

    await Mail.sendMail({
      to: `${deliveryman.name} <${deliveryman.email}>`,
      subject: `Order cancelled`,
      template: 'orderCancellation',
      context: {
        product: order.product,
        deliveryman: deliveryman.name,
        recipientName: recipient.name,
        recipientStreet: recipient.street,
        recipientNumber: recipient.number,
        recipientZipCode: recipient.zip_code,
        recipientCity: recipient.city,
        recipientState: recipient.state,
        recipientComplement: recipient.complement || 'Uninformed'
      }
    });
  }
}

export default new OrderCancellationMail();
