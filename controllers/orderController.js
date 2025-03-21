const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Order = require('../models/Orders');
const Product = require('../models/Products');
const mongoose = require('mongoose');

/**
 * Lấy danh sách đơn hàng (Admin)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const filter = {};

    if (search) {
      filter.userName = { $regex: search, $options: "i" };
    }

    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    const total = await Order.countDocuments(filter);

    res.status(200).json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

/**
 * Lấy đơn hàng theo ID
 */
exports.getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID format." });
    }

    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Kiểm tra quyền truy cập: chỉ user sở hữu hoặc admin mới xem được
    if (req.user.role !== 'admin' && order.userId?.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden: You can only view your own orders" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

/**
 * Tạo đơn hàng mới
 */
exports.createOrder = async (req, res) => {
  try {
    const { products, shipTo, shippingFee, subTotal, discountPrice, totalPrice, paymentMethod } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Order must have at least one product." });
    }

    if (!shipTo || !shipTo.fullName || !shipTo.address) {
      return res.status(400).json({ message: "Shipping information is required." });
    }

    if (!['COD', 'Banking', 'Momo', 'ZaloPay'].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }

    const newOrder = new Order({
      userId: req.user.userId || null,
      userName: shipTo.fullName || "Guest",
      products,
      shipTo,
      shippingFee,
      subTotal,
      discountPrice,
      totalPrice,
      paymentMethod,
      status: "Pending",
      transactionHistory: [{
        action: "CREATE_ORDER",
        details: { createdBy: req.user.userId || "Guest" },
        status: "Pending"
      }]
    });

    await newOrder.save();

    res.status(201).json({ message: "Order placed successfully", orderId: newOrder._id });
  } catch (error) {
    res.status(500).json({ message: "Failed to place order", error: error.message });
  }
};

/**
 * Cập nhật trạng thái đơn hàng (Admin)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Processing", "Delivering", "Finished", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    order.transactionHistory.push({
      action: "UPDATE_STATUS",
      details: { updatedBy: req.user.userId || "Admin" },
      status
    });

    await order.save();

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};

/**
 * Xóa đơn hàng (Admin)
 */
exports.deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order", error: error.message });
  }
};

/**
 * Tạo hóa đơn PDF
 */
exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('products.productId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Kiểm tra quyền truy cập: chỉ user sở hữu hoặc admin
    if (req.user.role !== 'admin' && order.userId?.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden: You can only generate invoice for your own orders" });
    }

    const invoiceDir = path.join(__dirname, '../invoices');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir);
    }

    const fileName = `invoice-${orderId}.pdf`;
    const filePath = path.join(invoiceDir, fileName);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const fontPath = path.join(__dirname, '../fonts/Roboto-Regular.ttf');
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    } else {
      console.warn('⚠️ Font không tồn tại, đang dùng font mặc định của PDFKit');
    }

    const logoPath = path.join(__dirname, '../assets/Logo.png'); //C:\Users\Admin\Documents\Học\Web\codefinal\grba-admin-ui\src\assets\Logo.png
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 30, { width: 100 });
    }

    doc.fontSize(20).text('INVOICE', 150, 50, { align: 'center' }).moveDown();

    doc.fontSize(12)
      .text(`Order ID: ${orderId}`)
      .text(`Order date: ${new Date(order.createdAt).toLocaleDateString()}`)
      .text(`Customer: ${order.shipTo.fullName}`)
      .text(`Email: ${order.shipTo.email}`)
      .text(`Phone Number: ${order.shipTo.phone}`)
      .text(`Address: ${order.shipTo.address}`)
      .moveDown();

    doc.fontSize(14).text('Order Details:', { underline: true }).moveDown();

    const columnWidths = [50, 200, 70, 100, 100];
    const tableStartX = 50;
    const tableStartY = doc.y;

    const drawTableBorders = (yStart, rowCount) => {
      const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      doc.lineWidth(0.5);

      for (let i = 0; i <= rowCount; i++) {
        const y = yStart + i * 20;
        doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
      }

      let currentX = tableStartX;
      columnWidths.forEach(width => {
        doc.moveTo(currentX, yStart).lineTo(currentX, yStart + rowCount * 20).stroke();
        currentX += width;
      });
      doc.moveTo(currentX, yStart).lineTo(currentX, yStart + rowCount * 20).stroke();
    };

    const header = ['STT', 'Product Name', 'Quantity', 'Price', 'Total'];
    const headerY = doc.y;

    header.forEach((text, i) => {
      doc.text(text, tableStartX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0), headerY, {
        width: columnWidths[i],
        align: i === 0 ? 'left' : 'center',
      });
    });

    doc.moveDown(0.5);

    const rowStartY = doc.y;

    order.products.forEach((item, index) => {
      const rowY = rowStartY + index * 20;
      const row = [
        index + 1,
        item.productName,
        item.quantity,
        `${item.price.toLocaleString()} VND`,
        `${(item.quantity * item.price).toLocaleString()} VND`,
      ];

      row.forEach((text, i) => {
        doc.text(text, tableStartX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0), rowY, {
          width: columnWidths[i],
          align: i === 0 ? 'left' : 'center',
        });
      });
    });

    const totalRows = order.products.length + 1;
    drawTableBorders(tableStartY, totalRows);

    doc.moveDown(2);
    doc.fontSize(12)
      .text(`Total: ${order.totalPrice.toLocaleString()} VND`, 50, doc.y, { align: 'right' })
      .moveDown(0.5)
      .text(`Payment method: ${order.paymentMethod}`, 50, doc.y, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(12)
      .text('Thank you for purchasing!', 50, doc.y, { align: 'center' })
      .moveDown(0.5)
      .text('Contact with us: 0123456789', 50, doc.y, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      res.download(filePath, fileName, (err) => {
        if (err) {
          res.status(500).json({ message: 'Failed to download PDF' });
        }
        fs.unlink(filePath, () => {});
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }
    const orders = await Order.find({ userId }).populate('userId', 'name email');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = {
  getAllOrders: exports.getAllOrders,
  getOrderById: exports.getOrderById,
  createOrder: exports.createOrder,
  updateOrderStatus: exports.updateOrderStatus,
  deleteOrder: exports.deleteOrder,
  generateInvoice: exports.generateInvoice
};