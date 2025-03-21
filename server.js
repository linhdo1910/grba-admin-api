const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// 🛠 Kiểm tra tên file trước khi import!
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

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/TheKansoDB" }),
  cookie: { secure: false, httpOnly: true, maxAge: 86400000 }
}));

// 🛠 Kiểm tra từng dòng xem lỗi đến từ đâu!

const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:4200', // Đổi thành domain của front-end
  credentials: true
}));

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.listen(port, () => console.log(`Server running on port ${port}`));
