const { User, Product } = require('../models/models');
const { Op } = require('sequelize');
const ApiError = require('../error/ApiError');

class ProductController {
  async create(req, res, next) {
    try {
      const {
        name,
        description,
        userId,
        category,
        status,
        photo,
        price,
        rating
      } = req.body;

      if (!name || !description || !userId || !category || !photo || !price) {
        return next(ApiError.badRequest(
          'Поля name, description, userId, category, photo и price обязательны'
        ));
      }

      const userIdNum = parseInt(userId, 10);
      if (Number.isNaN(userId)) {
          return next(ApiError.badRequest('userId должен быть числом'));
      }

      const user = await User.findByPk(userIdNum);
      if (!user) {
        return next(ApiError.badRequest('Пользователь с таким userId не найден'));
      }

      const normalizedName = name.trim();

      const existing = await Product.findOne({
      where: {
        userId,
        name: { [Op.iLike]: normalizedName },
        category
      }
    });

      if (existing) {
        return next(ApiError.badRequest('У пользователя уже есть товар с таким названием в этой категории'));
      }

      const product = await Product.create({
        name,
        description,
        userId,
        category,
        status,
        photo,
        price,
        rating
      });

      return res.status(201).json(product);
    } catch (e) {
      return next(ApiError.badRequest(e.message));
    }
  }

  async sort(req, res, next) {
    try {
      const {
        category,
        name,
        minPrice,
        maxPrice,
        onlyTopRated,
        userId
      } = req.query;
      const where = {};

      if (userId) {
        where.userId = userId;
      }
      if (category) {
        where.category = category;
      }
      if (name) {
        where.name = { [Op.iLike]: `%${name}%` };
      }
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
        if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
      }

      if (onlyTopRated === "true") {
        where.rating = {
          [Op.gte]: 4,
          [Op.lte]: 5
        };
      }

      const products = await Product.findAll({ where });
      return res.json(products);
    } catch (e) {
      return next(ApiError.internal(e.message));
    }
  }

  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const products = await Product.findAll({ where: { userId: id } });

      if (!products.length) {
        return next(ApiError.badRequest('Товары пользователя не найдены'));
      }

      return res.json(products);
    } catch (e) {
      return next(ApiError.badRequest(e.message));
    }
  }

  async remove(req, res, next) {
    try {
      const { userId, productId } = req.body;

      if (!userId || !productId) {
        return next(ApiError.badRequest('Не указан userId или productId'));
      }

      const deletedCount = await Product.destroy({
        where: {
          userId,
          idProduct: productId
        }
      });

      if (deletedCount === 0) {
        return next(ApiError.badRequest('Данный товар уже удалён или не принадлежит пользователю'));
      }

      return res.json({ message: 'Объявление удалено' });
    } catch (e) {
      return next(ApiError.badRequest(e.message));
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { userId, productId } = req.body;

      if (!userId || !productId) {
        return next(ApiError.badRequest('Не указан userId или productId'));
      }

      const userIdNum = parseInt(userId, 10);
      const productIdNum = parseInt(productId, 10);
      if (Number.isNaN(userIdNum) || Number.isNaN(productIdNum)) {
        return next(ApiError.badRequest('userId и productId должны быть числами'));
      }

      const user = await User.findByPk(userIdNum);
      if (!user) {
        return next(ApiError.badRequest('Пользователь с таким userId не найден'));
      }

      const product = await Product.findByPk(productIdNum);
      if (!product) {
        return next(ApiError.badRequest('Товар не найден'));
      }

      if (product.userId !== userIdNum && !user.admin) {
        return next(ApiError.forbidden('Нет прав изменять этот товар'));
      }

      const curStatus = product.status || 'active';
      let newStatus;
      if (curStatus === 'active') newStatus = 'waiting';
      else if (curStatus === 'waiting') newStatus = 'active';
      else {
        return next(ApiError.badRequest(`Нельзя переключить статус "${curStatus}". Только "active" <-> "waiting".`));
      }

      await product.update({ status: newStatus });

      return res.json({ message: `Статус изменён на "${newStatus}"`, product });
    } catch (e) {
      return next(ApiError.internal(e.message));
    }
  }

  async getActiveProducts(req, res, next) {
    try {
      const products = await Product.findAll({
        where: { status: 'active' }
      });

      return res.json(products);
    } catch (e) {
      return next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new ProductController();
