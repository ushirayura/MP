const { Rent, Product, User } = require('../models/models');
const { Op } = require('sequelize');
const ApiError = require('../error/ApiError');

class RentController {
  async create(req, res, next) {
    try {
      const { idProduct, dataStart, dataEnd } = req.body;
      const renterId = req.user.idUser;

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
      const { role } = req.query;
      const userId = req.user.idUser;

      const where = {};
      if (role === 'renter') {
        where.idUser = userId;
      } else if (role === 'owner') {
        const myProducts = await Product.findAll({
          where: { userId },
          attributes: ['idProduct']
        });
        where.idProduct = { [Op.in]: myProducts.map(p => p.idProduct) };
      }

      const rents = await Rent.findAll({
        where,
        include: [
          { model: Product, attributes: ['name', 'photo', 'price'] },
          { model: User,    attributes: ['name', 'secondName'] },
        ],
        order: [['dataStart', 'DESC']],
      });

      return res.json(rents);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const rentId = parseInt(req.params.id, 10);
      const { status } = req.body;
      const ownerId = req.user.idUser;

      // валидация
      if (!rentId || !['accepted', 'rejected'].includes(status)) {
        return next(ApiError.badRequest('Неверные параметры запроса'));
      }

      const rent = await Rent.findByPk(rentId, { include: Product });
      if (!rent) {
        return next(ApiError.notFound('Запрос не найден'));
      }
      if (rent.Product.userId !== ownerId) {
        return next(ApiError.forbidden('Не ваш товар'));
      }

      rent.status = status;
      await rent.save();

      return res.json(rent);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RentController();
