const { Rent, Product, User } = require('../models/models');
const { Op } = require('sequelize');
const ApiError = require('../error/ApiError');

class RentController {
  async create(req, res, next) {
    try {
      const { idProduct, dataStart, dataEnd } = req.body;
      const renterId = req.user.id;

      if (!idProduct || !dataStart || !dataEnd) {
        return next(ApiError.badRequest('idProduct, dataStart и dataEnd обязательны'));
      }
      const start = new Date(dataStart);
      const end   = new Date(dataEnd);
      if (isNaN(start) || isNaN(end) || start >= end) {
        return next(ApiError.badRequest('Некорректный диапазон дат аренды'));
      }

      const product = await Product.findByPk(idProduct);
      if (!product) {
        return next(ApiError.notFound('Товар не найден'));
      }
      if (product.userId === renterId) {
        return next(ApiError.badRequest('Нельзя арендовать свой товар'));
      }

      const conflict = await Rent.findOne({
        where: {
          idProduct,
          status: 'accepted',
          [Op.or]: [
            { dataStart: { [Op.between]: [start, end] } },
            { dataEnd:   { [Op.between]: [start, end] } },
            {
              [Op.and]: [
                { dataStart: { [Op.lte]: start } },
                { dataEnd:   { [Op.gte]: end   } }
              ]
            }
          ]
        }
      });
      if (conflict) {
        return next(ApiError.badRequest('Товар уже арендован в этот период'));
      }

      const rent = await Rent.create({
        idUser: renterId,
        idProduct,
        status: 'pending',
        dataStart: start,
        dataEnd:   end,
      });

      return res.status(201).json(rent);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const userId = req.user?.idUser ?? req.user?.id;
      if (!userId) return next(ApiError.unauthorized('Не авторизован'));

      const myProducts = await Product.findAll({
        where: { userId },
        attributes: ['idProduct']
      });
      const myProductIds = myProducts.map(p => p.idProduct);

      const where = {
        [Op.or]: [
          { idUser: userId },
          ...(myProductIds.length ? [{ idProduct: { [Op.in]: myProductIds } }] : [])
        ]
      };

      const rents = await Rent.findAll({
        where,
        include: [
          {
            model: Product,
            attributes: ['name', 'photo'],
            include: [{ model: User, attributes: ['name', 'phone'] }]
          },
          {
            model: User,
            attributes: ['name', 'phone']
          }
        ],
        order: [['dataStart', 'DESC']],
      });

      const output = rents.map(r => {
        const product = r.product ? r.product.toJSON() : null;
        const renter  = r.user    ? r.user.toJSON()    : null;
        const owner   = product && product.user ? product.user : null;

        const isCurrentUserRenter = r.idUser === userId;
        const other = isCurrentUserRenter ? owner : renter;

        return {
          idRent: r.idRent,
          productName: product?.name ?? null,
          photo: product?.photo ?? null,
          dataStart: r.dataStart,
          dataEnd: r.dataEnd,
          otherName: other?.name ?? null,
          otherPhone: other?.phone ?? null,
          status: r.status
        };
      });

      return res.json(output);
    } catch (e) {
      next(e);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const rentId = parseInt(req.params.id, 10);
      const { status } = req.body;
      const ownerId = req.user.id;
      
      if (!rentId || !['accepted', 'rejected'].includes(status)) {
        return next(ApiError.badRequest('Неверные параметры запроса'));
      }

      const rent = await Rent.findByPk(rentId, { include: Product });

      if (!rent) {
        return next(ApiError.notFound('Запрос не найден'));
      }
      if (!rent.product) {
        return next(ApiError.notFound('Товар для аренды не найден'));
      }
      if (rent.product.userId !== ownerId) {
        return next(ApiError.forbidden('Не ваш товар'));
      }

      rent.status = status;
      await rent.save();

      return res.json(rent);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new RentController();
