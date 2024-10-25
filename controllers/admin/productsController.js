const products = require('../../models/productsModel');
const category =require('../../models/categoryModel');
const brand =require('../../models/brandModel');
const path = require('path');
const fs = require('fs');



// load the product page
const loadProductsPage = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1; // Get the current page from query parameters or default to 1
      const limit = 3; // Number of products per page
      const skip = (page - 1) * limit; // Calculate the number of products to skip

      const totalProducts = await products.countDocuments(); // Get the total number of products
      const totalPages = Math.ceil(totalProducts / limit); // Calculate the total number of pages

      const product = await products.find()
          .skip(skip)
          .limit(limit)
          .populate("category")
          .populate("brand");

      res.render('products', { product, page, totalPages });
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};


// for loading the add product page
const loadAddproduct = async(req,res)=>{
    try {
        const categorys = await category.find({ status:false});
        const brands = await brand.find({ status:'Active'});

        console.log(categorys,'555');
        res.render('addProducts',{categorys,brands});
       
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' }); 
    }
};


// for adding product
const addProduct = async (req, res) => {
    try {
      const { productName, branded, category,quantity, price, description} = req.body;
  console.log(req.body);
  
      // Check if required fields are provided
      if (!productName || !branded || !category || !quantity || !description || price === undefined) {
        return res.status(400).send('All fields are required.');
      }
   
      // Process the uploaded images
      const images = req.files.map(file => file.filename);
     
      // Check if the product already exists
      const productExist = await products.findOne({  name:productName });
      if (productExist) {
        return res.status(400).send('Product already exists');
      }
  
      // Create a new product
      const newProduct = new products({
        name:productName,
        productimages: images,
        brand:branded,
        category:category,
        quantity:quantity,
        discription:description,
        price:price,
        listed: true 
      });
  
      // Save the product to the database
      await newProduct.save();
      res.redirect('/admin/product');
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };



  
  const loadEditProduct = async (req, res) => {
    try {
      const productId = req.query.id;
     
      if (!productId) {
        return res.status(400).send('Product ID is required.');
      }
      
      const product = await products.findById(productId).populate("category").populate("brand"); 
      if (!product) {
        return res.status(404).send('Product not found.');
      }
      
      const categories = await category.find(); 
      const brands = await brand.find(); 
         
         
      res.render('editProduct', { product, categories, brands }); 
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };



  // Update product details
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log(req.body,'tyugftyghvgh');
    
    const { productName, branded, category, quantity, price, description } = req.body;
    // const parseBody = JSON.parse(req.body)
    // console.log(parseBody,'ttty');
    
    const product = await products.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found.');
    }

   
     // Process uploaded images and replace the corresponding images
     if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        if (index < 3) {
          // Optional: Delete the old image from the server
          const oldImagePath = path.join(__dirname, '../../public/productIMG', product.productimages[index]);
         
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Error deleting old image:', err);
          });

          // Replace the image at the specified index
          product.productimages[index] = file.filename;
        }
      });
    }

    // Update product details
    product.name = productName;
    product.brand = branded;
    product.category = category;
    product.quantity = quantity;
    product.price = price;
    product.description = description;
    

    // Save the updated product
    await product.save();

    res.redirect('/admin/Product');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

  


const toggleListingStatus = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { status } = req.body;

    if (!productId || !status) {
      return res.status(400).json({ message: 'Invalid request.' });
    }

    const product = await products.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Update the 'listed' status
    product.listed = (status === 'list');
    await product.save();

    res.status(200).json({ message: `Product has been ${status === 'list' ? 'listed' : 'unlisted'}.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


module.exports ={
    loadProductsPage,
    addProduct,
    loadAddproduct,
    loadEditProduct,
    updateProduct,
    toggleListingStatus
   
}