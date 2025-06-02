const { Favourite, Product } = require('../models/models');
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

            const user = await User.findByPk(userId)
            if (!user) {
                return next(ApiError.badRequest(`Пользователь с id=${userId} не найден`))
            }

            const favourites = Favourite.findAll({
                where: {userId},
                include: [
                    {
                        model: Product,
                        attributes: ['idProduct', 'name', 'description', 'price', 'category', 'rating']
                    }
                ]
            })

            const result = favourites.map(fav => ({
                idFavourite: fav.idFavourite,
                product: fav.Product,
            }))

            return res.json({userId, favourites: result})
        } catch(e) {
            next(ApiError.internal(e))
        }
    }
}

module.exports = FavouriteController