const Router = require('express')
const router = new Router()
const productController = require('../controllers/productController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/create', productController.create)
router.get('/getAll', productController.sort)
router.get('/:id', productController.getOne)

module.exports = router