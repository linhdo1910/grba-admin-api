const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const firebaseConfig = require('./firebase.config'); // Đảm bảo file config tồn tại



// Kiểm tra kết nối Firebase
const db = admin.database();
db.ref('test').once('value')
  .then(() => console.log('Connected to Firebase!'))
  .catch(err => console.error('Firebase connection error:', err));

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE']
}));

// Routes
const userRoutes = require('./routes/userRoute');
const productRoutes = require('./routes/productRoute');
const orderRoutes = require('./routes/orderRoute');
const blogRoutes = require('./routes/blogRoute');


app.use("/api/blogs", blogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Khởi động server
app.listen(port, () => console.log(`Server running on port ${port}`));