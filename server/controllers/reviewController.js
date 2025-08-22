const { User, Product, Review, Rent } = require("../models/models");
const sequelize = require('../db');
const { Op, fn, col } = require('sequelize');
const ApiError = require('../error/ApiError');

async function canUserLeaveReview(userId, idProduct) {
  // Правило: пользователь может оставить отзыв, если у него была принятая аренда
  // для этого товара и дата окончания аренды уже прошла.
  if (!userId || !idProduct) return false;

  const rent = await Rent.findOne({
    where: {
      idUser: userId,
      idProduct,
      status: 'accepted',
      dataEnd: { [Op.lt]: new Date() } // аренда завершилась
    }
  });
  return !!rent;
}

class ReviewController {
  async create(req, res, next) {
    // Нормализация id пользователя
    const userId = req.user?.idUser ?? req.user?.id;

    const { idProduct, rate, comment } = req.body;

    if (!userId) return next(ApiError.unauthorized('Не авторизован'));

    const idProdNum = parseInt(idProduct, 10);
    if (Number.isNaN(idProdNum)) {
      return next(ApiError.badRequest('Неверный idProduct'));
    }

    // дружелюбная валидация rate (можно прислать "5" или 4.5)
    const rateNum = Number(rate);
    if (!Number.isFinite(rateNum)) {
      return next(ApiError.badRequest('Неверный формат rate'));
    }
    if (rateNum < 1 || rateNum > 5) {
      return next(ApiError.badRequest('rate вне допустимого диапазона (1-5)'));
    }

    try {
      // Проверим, что продукт существует (быстрая проверка)
      const product = await Product.findByPk(idProdNum);
      if (!product) {
        return next(ApiError.notFound('Товар не найден'));
      }

      // Бизнес-логика: пользователь должен иметь право оставлять отзыв
      const canLeave = await canUserLeaveReview(userId, idProdNum);
      if (!canLeave) {
        return next(ApiError.forbidden('Нельзя оставлять отзыв: нет завершённой аренды этого товара'));
      }

      // Транзакция: создание отзыва + пересчёт среднего
      const t = await sequelize.transaction();
      try {
        // Проверка на дубль (по бизнес-логике: один отзыв от пользователя на товар)
        const existed = await Review.findOne({
          where: { idUser: userId, idProduct: idProdNum },
          transaction: t
        });
        if (existed) {
          await t.rollback();
          return next(ApiError.badRequest('Вы уже оставили отзыв для этого товара'));
        }

        const created = await Review.create({
          idUser: userId,
          idProduct: idProdNum,
          rate: rateNum,
          comment: comment ?? null,
          uploadDate: new Date()
        }, { transaction: t });

        // пересчёт среднего через агрегат БД
        const avgRes = await Review.findOne({
          where: { idProduct: idProdNum },
          attributes: [[fn('AVG', col('rate')), 'avgRate']],
          transaction: t,
          raw: true
        });
        const avg = parseFloat(Number(avgRes.avgRate || 0).toFixed(1));

        await Product.update({ rating: avg }, { where: { idProduct: idProdNum }, transaction: t });

        await t.commit();
        return res.status(201).json(created);
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } catch (e) {
      next(e);
    }
  }

  async getAllByProduct(req, res, next) {
        try {
            // idProduct приходит только в теле запроса
            const idProduct = parseInt(req.body.idProduct, 10);
            if (Number.isNaN(idProduct)) {
            return next(ApiError.badRequest('Неверный idProduct в теле запроса'));
            }

            // Проверка существования продукта
            const product = await Product.findByPk(idProduct);
            if (!product) {
            return next(ApiError.notFound('Товар не найден'));
            }

            // Получаем все отзывы (с информацией об авторе, без пароля)
            const rows = await Review.findAll({
            where: { idProduct },
            include: [
                {
                model: User,
                attributes: ['idUser', 'name', 'secondName', 'middleName']
                }
            ],
            order: [['uploadDate', 'DESC']]
            });

            // Считаем агрегаты: средний рейтинг и количество отзывов
            const avgRes = await Review.findOne({
            where: { idProduct },
            attributes: [[fn('AVG', col('rate')), 'avgRate']],
            raw: true
            });

            const avgRating = parseFloat(Number(avgRes?.avgRate || 0).toFixed(1));
            const countReviews = rows.length;

            return res.json({
            productId: idProduct,
            stats: { avgRating, countReviews },
            reviews: rows
            });
        } catch (e) {
            next(e);
        }
    }

    async getAllByUser(req, res, next) {
        try {
            const idUser = req.user.id; // берем из токена

            // Проверка существования пользователя
            const user = await User.findByPk(idUser);
            if (!user) {
            return next(ApiError.notFound('Пользователь не найден'));
            }

            // Получаем все отзывы пользователя (с информацией о товаре)
            const rows = await Review.findAll({
            where: { idUser },
            include: [
                {
                model: Product,
                attributes: ['idProduct', 'name', 'description', 'price']
                }
            ],
            order: [['uploadDate', 'DESC']]
            });

            return res.json({
            userId: idUser,
            reviews: rows
            });
        } catch (e) {
            console.error('Error in getAllByUser:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при получении отзывов пользователя'));
        }
    }

    async getStatsByProduct(req, res, next) {
        try {
            if (!req.body) {
            return next(ApiError.badRequest('Тело запроса отсутствует. Убедитесь, что express.json() подключён.'));
            }

            const rawId = req.body.idProduct;
            if (typeof rawId === 'undefined' || rawId === null) {
            return next(ApiError.badRequest('В теле запроса не найден idProduct.'));
            }

            const idProduct = parseInt(rawId, 10);
            if (Number.isNaN(idProduct)) {
            return next(ApiError.badRequest('Неверный idProduct (ожидается число).'));
            }

            const product = await Product.findByPk(idProduct);
            if (!product) {
            return next(ApiError.notFound('Товар не найден'));
            }

            // Получаем агрегаты: count и avg
            const statsRaw = await Review.findOne({
            where: { idProduct },
            attributes: [
                [fn('COUNT', col('idReview')), 'countReviews'],
                [fn('AVG', col('rate')), 'avgRate']
            ],
            raw: true
            });

            const countReviews = statsRaw && statsRaw.countReviews !== null ? parseInt(statsRaw.countReviews, 10) : 0;
            const avgRating = statsRaw && statsRaw.avgRate !== null
            ? parseFloat(Number(statsRaw.avgRate).toFixed(1))
            : 0;

            return res.json({
            productId: idProduct,
            countReviews,
            avgRating
            });
        } catch (e) {
            console.error('Error in getStatsByProduct:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Непредвиденная ошибка при получении статистики отзывов.'));
        }
    }

    async getStatsByUser(req, res, next) {
        try {
            const idUser = req.user.id; // берем из токена

            // Проверка существования пользователя
            const user = await User.findByPk(idUser);
            if (!user) {
            return next(ApiError.notFound('Пользователь не найден'));
            }

            // Считаем агрегаты
            const avgRes = await Review.findOne({
            where: { idUser },
            attributes: [[fn('AVG', col('rate')), 'avgRate']],
            raw: true
            });

            const count = await Review.count({ where: { idUser } });
            const avgRating = parseFloat(Number(avgRes?.avgRate || 0).toFixed(1));

            return res.json({
            userId: idUser,
            avgRating,
            totalReviews: count
            });
        } catch (e) {
            console.error('Error in getStatsByUser:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при получении статистики отзывов пользователя'));
        }
    }

    async getOne(req, res, next) {
        try {
            const { idReview } = req.params; // idReview из URL
            const reviewId = parseInt(idReview, 10);

            if (Number.isNaN(reviewId)) {
                return next(ApiError.badRequest('Некорректный idReview'));
            }

            // Находим отзыв (с информацией о пользователе и товаре)
            const review = await Review.findByPk(reviewId, {
                include: [
                    {
                        model: User,
                        attributes: ['idUser', 'name', 'secondName', 'middleName']
                    },
                    {
                        model: Product,
                        attributes: ['idProduct', 'name', 'description', 'price']
                    }
                ]
            });

            if (!review) {
                return next(ApiError.notFound('Отзыв не найден'));
            }

            // Получаем id авторизованного пользователя из токена
            const userId = req.user.id;

            // Проверяем, что отзыв принадлежит пользователю
            if (review.idUser !== userId) {
                return next(ApiError.forbidden('Вы не можете просматривать чужой отзыв'));
            }

            return res.json(review);
        } catch (e) {
            console.error('Error in getOne review:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при получении отзыва'));
        }
    }

    async update(req, res, next) {
        try {
            const { idReview, rate, comment } = req.body;
            const userId = req.user.id;

            if (!idReview) {
            return next(ApiError.badRequest('Не передан idReview'));
            }

            // Находим отзыв
            const review = await Review.findByPk(idReview);
            if (!review) {
            return next(ApiError.notFound('Отзыв не найден'));
            }

            // Проверяем принадлежность пользователю
            if (review.idUser !== userId) {
            return next(ApiError.forbidden('Вы не можете изменять чужой отзыв'));
            }

            // Обновляем поля (только если переданы)
            if (typeof rate !== 'undefined') review.rate = rate;
            if (typeof comment !== 'undefined') review.comment = comment;

            // Обновляем дату
            review.uploadDate = new Date();

            await review.save();

            return res.json({
            message: 'Отзыв успешно обновлён',
            review
            });
        } catch (e) {
            console.error('Error in update review:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при обновлении отзыва'));
        }
    }

    async delete(req, res, next) {
        try {
            const { idReview } = req.body;
            const userId = req.user.id; // Берём id авторизованного пользователя

            if (!idReview) {
            return next(ApiError.badRequest('Не передан idReview'));
            }

            // Находим отзыв
            const review = await Review.findByPk(idReview);
            if (!review) {
            return next(ApiError.notFound('Отзыв не найден'));
            }

            // Проверяем принадлежность пользователю
            if (review.idUser !== userId) {
            return next(ApiError.forbidden('Вы не можете удалять чужой отзыв'));
            }

            // Удаляем отзыв
            await review.destroy();

            return res.json({ message: 'Отзыв успешно удалён' });
        } catch (e) {
            console.error('Error in delete review:', e && (e.stack || e.message || e));
            return next(ApiError.internal('Ошибка при удалении отзыва'));
        }
    }
}

module.exports = new ReviewController();