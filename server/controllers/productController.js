const {Product} = require('../models/models')
const ApiError = require('../error/ApiError')

class ProductController {
    async create(req, res, next) {
        try {
            const {name, description, userId, category, price, rating} = req.body

            const product = await Product.create({name, description, userId, category, price, rating});

            return res.json(product);
        }
        catch(e) {
            next(ApiError.badRequest(e.message))
        }

    }

    async sort(req, res, next) {
        try {
            const { category, name, minPrice, maxPrice, minRating, maxRating, userId } = req.query;
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
            if (minRating || maxRating) {
                where.rating = {};
                if (minRating) where.rating[Op.gte] = parseFloat(minRating);
                if (maxRating) where.rating[Op.lte] = parseFloat(maxRating);
            }

            const products = await Product.findAll({ where });
            return res.json(products);
        }
        catch(e) {
            next(ApiError.internal(e));
        }
    }

    async getOne(req, res, next) {
        try {
            const {id} = req.params;

            const products = await Product.findAll({ where: { userId: id } });
            
            if (!products.length) {
                return next(ApiError.badRequest('Товары пользователя не найдены'));
            }

            return res.json(products);
        }    
        catch(e) {
            next(ApiError.badRequest(e));
        }
    }

    async remove(req, res, next) {
        try {
            const {productId} = req.body;
            const userId = req.user.id;
            
            if (!productId) {
                return next(ApiError.badRequest('Не указан productId'))
            }

            const deletedCount = await Product.destroy({
                where: {
                    userId,
                    idProduct: productId
                }
            })

            if (deletedCount === 0) {
                return next(ApiError.badRequest('Данный товар уже удален'))
            }

            return res.json({message: 'Объявление удалено'})
        } catch(e) {
            next(ApiError.badRequest(e));
        }
    }
}


module.exports = new ProductController()