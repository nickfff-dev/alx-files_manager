import express from 'express';
import mapRoutes from './routes/index';

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

mapRoutes(app);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;
module.exports = app;
