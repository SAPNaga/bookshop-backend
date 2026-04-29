const cds = require('@sap/cds');

module.exports = class CatalogService extends cds.ApplicationService {

  async init() {
    const { Books, Orders } = this.entities;

    this.before('CREATE', Books, (req) => {
      const { price, stock, title } = req.data;
      if (!title || title.trim() === '') return req.error(400, 'Title is required');
      if (price < 0) return req.error(400, 'Price cannot be negative');
      if (stock < 0) return req.error(400, 'Stock cannot be negative');
    });

    this.after('READ', Books, (books) => {
      const list = Array.isArray(books) ? books : [books];
      list.forEach(b => { if (b) b.inStock = b.stock > 0; });
    });

    this.before('CREATE', Orders, (req) => {
      if (!req.data.orderNumber) {
        req.data.orderNumber = `ORD-${Date.now()}`;
      }
    });

    this.on('submitOrder', async (req) => {
      const { orderId } = req.data;
      const tx = cds.transaction(req);
      const order = await tx.read(Orders).where({ ID: orderId });
      if (!order.length) return req.error(404, `Order ${orderId} not found`);
      await tx.update(Orders).set({ status: 'SUBMITTED' }).where({ ID: orderId });
      return tx.read(Orders).where({ ID: orderId });
    });

    this.on('topBooks', async (req) => {
      const limit = req.data.limit || 5;
      return cds.run(SELECT.from(Books).orderBy({ stock: 'desc' }).limit(limit));
    });

    return super.init();
  }
};