const Router = require('express')
const router = new Router()

const userRouter = require('./userRouter')
const productRouter = require('./productRouter')
const rentRouter = require('./rentRouter')

router.use('/user', userRouter)
router.use('/product', productRouter)
router.use('/rent', rentRouter)


module.exports = router