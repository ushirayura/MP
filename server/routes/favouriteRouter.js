const Router = require('express')
const router = new Router()
const favouriteController = require('../controllers/favouriteController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/create', favouriteController.create)
router.delete('/delete', favouriteController.remove)
router.get('/:userId', favouriteController.getOne)

module.exports = router