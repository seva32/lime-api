
import express from 'express';
import userRoute from "../contollers/userRoute";

const router = express.Router();

router.use('/', userRoute);

export default router;
