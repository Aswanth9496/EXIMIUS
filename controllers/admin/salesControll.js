
const orders = require('../../models/ordersModel');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');




const loadSales = async (req, res) => {

  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Validate page and limit
    if (page < 1 || limit < 1 || limit > 100) { // Added upper limit for pagination
      return res.status(400).send('Invalid page or limit. Ensure limit is between 1 and 100.');
    }

    const skip = (page - 1) * limit;

    // Construct the query to fetch all sales data
    const query = {
      paymentStatus: 'Success',
      'products.status': { $nin: ['Cancelled', 'Returned'] }
    };

    const totalOrdersCount = await orders.countDocuments(query);
    const salesData = await orders.find(query).skip(skip).limit(limit);

    console.log(`Total filtered sales: ${salesData.length}`);

    const totalDiscount = salesData.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
    const totalSalesAmount = salesData.reduce((sum, order) => {
      return sum + order.products.reduce((total, product) => {
        return product.status !== 'Cancelled' && product.status !== 'Returned' ? total + product.totalPrice : total;
      }, 0);
    }, 0);

    const totalPages = Math.ceil(totalOrdersCount / limit);

    res.render('sales', {
      totalOrders: totalOrdersCount,
      totalDiscount,
      totalSalesAmount,
      salesData,
      currentPage: page,
      totalPages,
      limit
    });
  } catch (error) {
    console.error('Error fetching all sales data:', error);
    res.status(500).send('An error occurred while loading sales data. Please try again later.');
  }
};







const filterSales = async (req, res) => {
  try {
    console.log("Received request to filter sales:", req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1) {
      console.error('Invalid page or limit');
      return res.status(400).send('Invalid page or limit');
    }

    const dateRange = req.query.dateRange || 'all';
    const startDateParam = req.query.startDate ? new Date(req.query.startDate) : null;

    // Validate startDate if provided
    if (startDateParam && isNaN(startDateParam.getTime())) {
      console.error('Invalid startDate:', req.query.startDate);
      return res.status(400).send('Invalid startDate');
    }

    // Log the date range and start date determination
    console.log('Date Range:', dateRange);
    console.log('Start Date Param:', startDateParam);

    let startDate;
    const endDate = new Date();

    // Determine startDate based on query or date range
    if (startDateParam) {
      startDate = startDateParam;
    } else {
      switch (dateRange) {
        case '1w':
          startDate = new Date();
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '1m':
          startDate = new Date();
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '1y':
          startDate = new Date();
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case 'all':
        default:
          startDate = null;
          break;
      }
    }

    const skip = (page - 1) * limit;

    const query = {
      paymentStatus: 'Success',
      'products.status': { $nin: ['Cancelled', 'Returned'] }
    };

    if (startDate) {
      query.orderDate = {
        $gte: startDate,
        $lte: endDate
      };
    }

    console.log('MongoDB Query:', query);

    const totalOrdersCount = await orders.countDocuments(query);
    const salesData = await orders.find(query).skip(skip).limit(limit);

    console.log(`Total filtered sales: ${salesData.length}`);

    const totalDiscount = salesData.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
    const totalSalesAmount = salesData.reduce((sum, order) => {
      const validAmount = order.products.reduce((total, product) => {
        return product.status !== 'Cancelled' && product.status !== 'Returned' ? total + product.totalPrice : total;
      }, 0);
      return sum + validAmount;
    }, 0);

    const totalPages = Math.ceil(totalOrdersCount / limit);

    res.render('sales', {
      totalOrders: totalOrdersCount,
      totalDiscount,
      totalSalesAmount,
      salesData,
      currentPage: page,
      totalPages,
      limit
    });
  } catch (error) {
    console.error('Error fetching filtered sales data:', error.message || error);
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

      // Title
      doc.fontSize(25).text('Sales Report', { align: 'center' });
      doc.moveDown(2);

      // Define the table headers
      const tableHeaders = [
          'Invoice No', 'Customer Name', 'Order Date', 
          'Total Amount (RS)', 'Payment Method', 
          'Payment Status', 'Order Status'
      ];

      const columnWidths = [100, 100, 100, 100, 100, 100, 100]; // Adjust column widths as needed
      const startX = 50; // Starting X position for the table
      let startY = doc.y; // Starting Y position for the table

      // Draw table headers
      doc.fontSize(12).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
          doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), startY, {
              width: columnWidths[i],
              align: 'center'
          });
      });

      // Draw a line under the headers
      doc.moveTo(startX, startY + 20)
         .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), startY + 20)
         .stroke();

      // Reset font for the table rows
      doc.font('Helvetica').moveDown();

      // Draw table rows
      salesData.forEach(sale => {
          let rowY = doc.y + 10; // Starting Y position for each row

          const rowValues = [
              sale.orderId,
              sale.address.addressName,
              new Date(sale.orderDate).toLocaleDateString(),
              `RS: ${sale.totalAmount.toFixed(2)}`,
              sale.paymentMethod,
              sale.paymentStatus,
              sale.products[0]?.status || 'N/A'
          ];

          rowValues.forEach((value, i) => {
              doc.text(value, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), rowY, {
                  width: columnWidths[i],
                  align: 'center'
              });
          });

          // Move down to the next row
          doc.moveDown();
      });

      // End the document
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
    exportSalesToPDF,
    filterSales
}