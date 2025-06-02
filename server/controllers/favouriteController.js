const { User, Favourite, Product } = require('../models/models');
const ApiError = require('../error/ApiError');

class FavouriteController {
    async create(req, res, next) {
        try {
            const {userId, productId} = req.body;

            if (!userId || !productId) {
                return next(ApiError.badRequest('Не указан userId или productId'))
            }

            const user = await User.findByPk(userId);
            if (!user) {
                return next(ApiError.badRequest(`Пользователь с id=${userId} не найден`))
            }

            const product = await Product.findByPk(productId);
            if (!product) {
                return next(ApiError.badRequest(`Товар с id=${productId} не найден`))
            }

            const exists = await Favourite.findOne({
                where: {
                    userId,
                    idProduct: productId,
                }
            })

            if (exists) {
                return next(ApiError.conflict('Этот товар уже находится в избранном у данного пользователя'))
            }

            const favourite = await Favourite.create({
                userId,
                idProduct: productId
            })

            return res.json({message: 'Товар успешоно добавлен в избранное', favourite})
        } catch (e) {
            next(ApiError.internal(e))
        }
    }

    async remove(req, res, next) {
        try {
            const {userId, productId} = req.body

            if (!userId || !productId) {
                return next(ApiError.badRequest('Не указан userId или productId'))
            }

            const deletedCount = await Favourite.destroy({
                where: {
                    userId,
                    idProduct: productId
                }
            })

            if (deletedCount === 0) {
                return next(ApiError.badRequest('Запись не найдена в избранном'))
            }

            return res.json({message: 'Товар удалён из избранного'})
        } catch (e) {
            next(ApiError.internal(e))
        }
    }

    async getOne(req, res, next) {
        try {
            const {userId} = req.params

            if (!userId) {
                return next(ApiError.badRequest('Не указан userId'));
            }
            
            const user = await User.findByPk(userId)
            if (!user) {
                return next(ApiError.badRequest(`Пользователь с id=${userId} не найден`))
            }

            const favRecords = await Favourite.findAll({
                where: { userId },
                attributes: ['idProduct'],
            });

            if (!favRecords || favRecords.length === 0) {
                return res.json({ userId, products: [] });
            }

            const productIds = favRecords.map(r => r.idProduct);
            
            const products = await Product.findAll({
                where: { idProduct: productIds },
                attributes: ['idProduct', 'name', 'description', 'price', 'category', 'rating']
            });

            return res.json({userId, products})
        } catch(e) {
            next(ApiError.internal(e))
        }
    }
}

module.exports = new FavouriteController()