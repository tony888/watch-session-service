import express from 'express';
import {PORT} from '../config/config';
import watchRoutes from './routes/watchRoutes';
import healthRoutes from './routes/healthCheckRoutes';
const app = express();
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use('/watch', watchRoutes);		
app.use('/health', healthRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
export { app } ;
