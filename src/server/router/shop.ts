import express from 'express';
import productRoute from '../contollers/shopControllers/productRoute';
import orderRoute from '../contollers/shopControllers/orderRoute';
import uploadRoute from '../contollers/shopControllers/uploadRoute';

const router = express.Router();

router.use('/products', productRoute);
router.use('/orders', orderRoute);
router.use('/uploads', uploadRoute);

export default router;
