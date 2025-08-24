const Router = require('express')
const router = new Router()
const productController = require('../controllers/productController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/create', productController.create)
router.get('/getAll', productController.sort)
router.get('/getActive', productController.getActiveProducts)
router.get('/:id', productController.getOne)
router.delete('/delete', productController.remove)
router.patch('/toggleStatus', productController.toggleStatus)



module.exports = router