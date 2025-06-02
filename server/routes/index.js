const Router = require('express')
const router = new Router()

const userRouter = require('./userRouter')
const productRouter = require('./productRouter')
const rentRouter = require('./rentRouter')
const favouriteRouter = require('./favouriteRouter')

router.use('/user', userRouter)
router.use('/product', productRouter)
router.use('/rent', rentRouter)
router.use('/favourite', favouriteRouter)

module.exports = router