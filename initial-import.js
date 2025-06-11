// // initial-import.js
// const admin = require('firebase-admin');
// const firebaseConfig = require('./firebase.config'); // Đảm bảo file config tồn tại

// // Khởi tạo Firebase
// admin.initializeApp({
//   credential: admin.credential.cert(firebaseConfig),
//   databaseURL: firebaseConfig.databaseURL
// });


// const db = admin.database();

// async function importData() {
//   try {
//     // Đọc file JSON
//     const productsData = require('./data/products.json');
//     // const ordersData = require('./data/orders.json');
//     // const UsersData = require('./data/users.json');
    
//     // Đẩy dữ liệu lên Firebase
//     await db.ref('products').set(productsData);
//     console.log(' Products imported successfully!');
    
//     // await db.ref('orders').set(ordersData);
//     // console.log(' Orders imported successfully!');

//     // await db.ref('users').set(UsersData);
//     // console.log(' User imported successfully!');
    
//     process.exit(0); // Thoát sau khi hoàn thành
//   } catch (error) {
//     console.error(' Import failed:', error);
//     process.exit(1);
//   }
// }

// importData();

const admin = require('firebase-admin');
const firebaseConfig = require('./firebase.config');

// Khởi tạo Firebase
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
  databaseURL: firebaseConfig.databaseURL
});

const db = admin.database();

async function importData() {
  try {
    // const productsData = require('./data/products.json');
    
    // // Đẩy dữ liệu lên Firebase
    // await db.ref('products').set(productsData);
    // console.log('✅ Products imported successfully!');
  const ordersData = require('./data/orders.json');
  const UsersData = require('./data/users.json');
  await db.ref('orders').set(ordersData);
  console.log(' Orders imported successfully!');

  await db.ref('users').set(UsersData);
  console.log(' User imported successfully!');

  
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importData();