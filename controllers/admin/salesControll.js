
const orders = require('../../models/ordersModel');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');




const loadSales = async (req, res) => {

  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 5) || 5;


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

    res.json( {
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
        // Simulated sales data
        const salesData = [
            {
                orderId: 'ORD-1727598990',
                customerId: '607',
                customerName: 'ayush',
                orderDate: '29/9/2024',
                totalAmount: 21000.00,
                paymentMethod: 'razorpay',
                paymentStatus: 'Success'
            },
            {
                orderId: 'ORD-1727599035',
                customerId: '071',
                customerName: 'ayush',
                orderDate: '29/9/2024',
                totalAmount: 31000.00,
                paymentMethod: 'razorpay',
                paymentStatus: 'Success'
            },
            {
                orderId: 'ORD-1727599421',
                customerId: '251',
                customerName: 'aswanth',
                orderDate: '29/9/2024',
                totalAmount: 70500.00,
                paymentMethod: 'razorpay',
                paymentStatus: 'Success'
            }
        ];

        const doc = new PDFDocument({ margin: 50 });
        const filename = 'Sales_Report.pdf';
        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Title
        doc.fontSize(16).text('Sales Report', { align: 'center' });
        doc.moveDown(1);

        // Define table headers and column widths
        const tableHeaders = [
            'Invoice No', 'Customer ID', 'Customer Name', 
            'Order Date', 'Total Amount (RS)', 
            'Payment Method', 'Payment Status'
        ];

        // Adjusted column widths
        const columnWidths = [100, 70, 90, 70, 80, 80, 70];
        const totalTableWidth = columnWidths.reduce((a, b) => a + b, 0); // Calculate total width of the table
        const pageWidth = doc.page.width; // Get the width of the page
        const startX = (pageWidth - totalTableWidth) / 2; // Center the table
        const startY = doc.y; // Starting Y position for the table
        const rowHeight = 15; // Height of each row

        // Draw table headers
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#4F81BD'); // Smaller font size for headers
        tableHeaders.forEach((header, i) => {
            const headerX = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.rect(headerX, startY, columnWidths[i], rowHeight).fill('#EAF3FC');
            doc.fillColor('#000000').text(header, headerX, startY + 2, {
                width: columnWidths[i],
                align: 'center'
            });
        });

        // Draw a line under the headers
        doc.moveTo(startX, startY + rowHeight)
            .lineTo(startX + totalTableWidth, startY + rowHeight)
            .stroke();

        // Draw table rows
        salesData.forEach((sale, index) => {
            const rowY = doc.y + 5; // Starting Y position for each row
            const rowValues = [
                sale.orderId,
                sale.customerId,
                sale.customerName,
                sale.orderDate,
                `RS: ${sale.totalAmount.toFixed(2)}`,
                sale.paymentMethod,
                sale.paymentStatus
            ];

            // Check for page break
            if (rowY + rowHeight > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
            }

            // Fill row background
            const fillColor = index % 2 === 0 ? '#FFFFFF' : '#F2F2F2'; // Alternate row color
            doc.rect(startX, rowY - 5, totalTableWidth, rowHeight).fill(fillColor);

            rowValues.forEach((value, i) => {
                const valueX = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
                doc.fillColor('#000000').fontSize(9).text(value, valueX, rowY + 2, {
                    width: columnWidths[i],
                    align: 'center'
                });
            });

            // Draw border for each row
            doc.moveTo(startX, rowY + rowHeight - 5)
                .lineTo(startX + totalTableWidth, rowY + rowHeight - 5)
                .stroke();
        });

        // Draw footer
        doc.moveDown(2);
        doc.fontSize(8).fillColor('#555555').text('Generated on: ' + new Date().toLocaleString(), { align: 'center' });

        // End the document
        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while exporting sales data to PDF');
    }
};



const exportSalesToExcel = async (req, res) => {
  try {
      const { dateRange, startDateParam } = req.query;
      let startDate;
      const endDate = new Date();

      // Determine startDate based on query or date range
      if (startDateParam) {
          startDate = new Date(startDateParam);
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

      const salesData = await orders.find({
          $or: [
              { paymentStatus: 'Success' },
              { 'products.status': 'Delivered' }
          ],
          'products.status': { $nin: ['Cancelled', 'Returned'] },
          ...(startDate ? { orderDate: { $gte: startDate, $lte: endDate } } : {})
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