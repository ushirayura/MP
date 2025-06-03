const Router = require('express')
const router = new Router()
const productController = require('../controllers/productController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/create', productController.create)
router.get('/getAll', productController.sort)
router.get('/:productId', productController.getOne)
router.delete('/remove', productController.remove)


module.exports = router