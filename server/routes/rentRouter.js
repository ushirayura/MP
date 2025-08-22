const Router = require('express');
const router = new Router();
const rentController = require('../controllers/rentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.post('/create', rentController.create);
router.get('/getAll', rentController.getAll);
router.put('/:id/status', rentController.updateStatus);
router.get('/pending', rentController.getPending);


module.exports = router;
