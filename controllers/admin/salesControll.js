
const orders = require('../../models/ordersModel');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');



const loadSales = async (req, res) => {
    try {
      // Get the current page and limit from the query parameters (defaults to page 1 and limit 10)
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
  
      // Calculate the number of items to skip based on the current page
      const skip = (page - 1) * limit;
  
      // Fetch total count of orders that match the criteria (for pagination)
      const totalOrdersCount = await orders.countDocuments({
        $or: [
          { paymentStatus: 'Success' }, // Razorpay successful payments
          { 'products.status': 'Delivered' } // COD Delivered
        ],
        'products.status': { $nin: ['Cancelled', 'Returned'] } // Exclude Cancelled or Returned orders
      });
  
      // Fetch sales orders with pagination (skip and limit)
      const salesData = await orders.find({
        $or: [
          { paymentStatus: 'Success' }, // Razorpay successful payments
          { 'products.status': 'Delivered' } // COD Delivered
        ],
        'products.status': { $nin: ['Cancelled', 'Returned'] } // Exclude Cancelled or Returned orders
      })
        .skip(skip)
        .limit(limit);
  
      // Calculate total discount and total sales amount
      const totalDiscount = salesData.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
      const totalSalesAmount = salesData.reduce((sum, order) => sum + order.totalAmount, 0);
  
      // Calculate total pages based on total orders and limit
      const totalPages = Math.ceil(totalOrdersCount / limit);
  
      // Render the sales view with dynamic data and pagination variables
      res.render('sales', {
        totalOrders: totalOrdersCount, // Pass the total orders count
        totalDiscount,
        totalSalesAmount,
        salesData,
        currentPage: page,
        totalPages,
        limit
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('An error occurred while loading sales data');
    }
  };
  





  const exportSalesToPDF = async (req, res) => {
    try {
        const salesData = await orders.find({
            $or: [
                { paymentStatus: 'Success' },
                { 'products.status': 'Delivered' }
            ],
            'products.status': { $nin: ['Cancelled', 'Returned'] }
        }).lean();

        const doc = new PDFDocument();
        let filename = 'Sales_Report.pdf';
        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);
        
        doc.fontSize(25).text('Sales Report', { align: 'center' });
        doc.moveDown();

        salesData.forEach(sale => {
            doc.text(`Invoice No: ${sale.orderId}`);
            doc.text(`Customer Name: ${sale.address.addressName}`);
            doc.text(`Order Date: ${new Date(sale.orderDate).toLocaleDateString()}`);
            doc.text(`Total Amount: RS: ${sale.totalAmount.toFixed(2)}`);
            doc.text(`Payment Method: ${sale.paymentMethod}`);
            doc.text(`Payment Status: ${sale.paymentStatus}`);
            doc.text(`Order Status: ${sale.products[0]?.status || 'N/A'}`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while exporting sales data to PDF');
    }
};

const exportSalesToExcel = async (req, res) => {
    try {
        const salesData = await orders.find({
            $or: [
                { paymentStatus: 'Success' },
                { 'products.status': 'Delivered' }
            ],
            'products.status': { $nin: ['Cancelled', 'Returned'] }
        }).lean();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Data');

        // Set column headers
        worksheet.columns = [
            { header: 'Invoice No', key: 'orderId', width: 30 },
            { header: 'Customer Name', key: 'customerName', width: 30 },
            { header: 'Order Date', key: 'orderDate', width: 15 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 30 },
            { header: 'Payment Status', key: 'paymentStatus', width: 20 },
            { header: 'Order Status', key: 'orderStatus', width: 20 }
        ];

        // Add rows to worksheet
        salesData.forEach(sale => {
            worksheet.addRow({
                orderId: sale.orderId,
                customerName: sale.address.addressName,
                orderDate: new Date(sale.orderDate).toLocaleDateString(),
                totalAmount: `RS: ${sale.totalAmount.toFixed(2)}`,
                paymentMethod: sale.paymentMethod,
                paymentStatus: sale.paymentStatus,
                orderStatus: sale.products[0]?.status || 'N/A'
            });
        });

        res.setHeader('Content-Disposition', 'attachment; filename=Sales_Report.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while exporting sales data to Excel');
    }
};





module.exports ={
    loadSales,
    exportSalesToExcel,
    exportSalesToPDF
}