const { Product } = require('../models/models');
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
        photo,
        price,
        rating
      } = req.body;

      if (!name || !description || !userId || !category || !photo || !price) {
        return next(ApiError.badRequest(
          'Поля name, description, userId, category, photo и price обязательны'
        ));
      }

      const product = await Product.create({
        name,
        description,
        userId,
        category,
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
}

module.exports = new ProductController();
