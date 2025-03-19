const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Order = require('../models/Orders');  // 👈 Sửa lại đúng tên file thực tế
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
    res.status(200).json(order);
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
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
      userId: req.session?.userId || null,
      userName: req.session?.userName || "Guest",
      products,
      shipTo,
      shippingFee,
      subTotal,
      discountPrice,
      totalPrice,
      paymentMethod,
      status: "Pending",
      transactionHistory: [{ action: "CREATE_ORDER", details: { createdBy: req.session?.userId || "Guest" }, status: "Pending" }]
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

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.transactionHistory.push({
      action: "UPDATE_STATUS",
      details: { updatedBy: req.session?.userId || "Admin" },
      status
    });

    await order.save();

    res.status(200).json({ message: "Order status updated successfully" });
  } catch {
    res.status(500).json({ message: "Failed to update order status" });
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
  } catch {
    res.status(500).json({ message: "Failed to delete order" });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Lấy thông tin đơn hàng
    const order = await Order.findById(orderId).populate('products.productId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Tạo thư mục invoices nếu chưa có
    const invoiceDir = path.join(__dirname, '../invoices');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir);
    }

    const fileName = `invoice-${orderId}.pdf`;
    const filePath = path.join(invoiceDir, fileName);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 📌 Dùng font hỗ trợ Unicode (Roboto hoặc font có sẵn)
    const fontPath = path.join(__dirname, '../fonts/Roboto-Regular.ttf'); 
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath); // Sử dụng font UTF-8
    } else {
      console.warn('⚠️ Font không tồn tại, đang dùng font mặc định của PDFKit');
    }

    // Logo (nếu có)
    const logoPath = path.join(__dirname, '../assets/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 30, { width: 100 });
    }

    // Tiêu đề
    doc.fontSize(20).text('HÓA ĐƠN BÁN HÀNG', 150, 50, { align: 'center' }).moveDown();

    // Thông tin đơn hàng
    doc.fontSize(12)
      .text(`Mã đơn hàng: ${orderId}`)
      .text(`Ngày tạo: ${new Date(order.createdAt).toLocaleDateString()}`)
      .text(`Khách hàng: ${order.shipTo.fullName}`)
      .text(`Email: ${order.shipTo.email}`)
      .text(`Số điện thoại: ${order.shipTo.phone}`)
      .text(`Địa chỉ: ${order.shipTo.address}`)
      .moveDown();

    // Tiêu đề bảng sản phẩm
    doc.fontSize(14).text('Chi tiết đơn hàng:', { underline: true }).moveDown();

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

    const header = ['STT', 'Tên sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền'];
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

    // Tổng tiền
    doc.moveDown(2);
    doc.fontSize(12)
      .text(`Tổng giá trị: ${order.totalPrice.toLocaleString()} VND`, 50, doc.y, { align: 'right' })
      .moveDown(0.5)
      .text(`Phương thức thanh toán: ${order.paymentMethod}`, 50, doc.y, { align: 'right' });

    // Cảm ơn
    doc.moveDown(2);
    doc.fontSize(12)
      .text('Cảm ơn bạn đã mua hàng!', 50, doc.y, { align: 'center' })
      .moveDown(0.5)
      .text('Liên hệ với chúng tôi: 037 500 1528', 50, doc.y, { align: 'center' });

    doc.end();

    // Gửi file về client
    stream.on('finish', () => {
      res.download(filePath, fileName, (err) => {
        if (err) {
          res.status(500).json({ message: 'Failed to download PDF' });
        }
        fs.unlink(filePath, () => { });
      });
    });

  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
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

