import { Router } from 'express';
import { watchController } from '../controllers/watchController';

const router = Router();
router.post('/', watchController);

export default router;
