const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes = require('./routes/userRoute'); 
const productRoutes = require('./routes/productRoute'); 
const orderRoutes = require('./routes/orderRoute');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/TheKansoDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors({
  origin: 'http://localhost:4200', // Front-end Angular/React/Vue
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE']
}));

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.listen(port, () => console.log(`Server running on port ${port}`));