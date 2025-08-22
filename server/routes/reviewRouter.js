const Router = require('express');
const router = new Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.post('/create', reviewController.create);
router.get('/getAllByProduct', reviewController.getAllByProduct);
router.get('/getAllByUser', reviewController.getAllByUser);
router.get('/getStatsByProduct', reviewController.getStatsByProduct);
router.get('/getStatsByUser', reviewController.getStatsByUser);
router.get('/getOne/:idReview', reviewController.getOne);
router.put('/update', reviewController.update);
router.delete('/delete', reviewController.delete);


module.exports = router;