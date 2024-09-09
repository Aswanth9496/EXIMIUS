const Offers = require('../../models/offersModel');
const Products = require('../../models/productsModel');
const Category = require('../../models/categoryModel');

// Load offers page with categories and products
const loadOffers = async (req, res) => {
    try {
        const categories = await Category.find();
        const products = await Products.find();

        const offers = await Offers.find()
        .populate('products.productId', 'name') 
        .populate('category.categoryId', 'name');

        res.render('offers', { offers, categories, products });
    } catch (error) {
        console.log('Error fetching offers:', error);
        res.status(500).send('Internal Server Error');
    }
};


const addCategoriOffer = async (req, res) => {
    try {
      
        const { name, description, discount, categories, status } = req.body;
        const isActive = status === 'active';

        const existingOffer = await Offers.findOne({
            offerName: { $regex: new RegExp(`^${name}$`, 'i') } // Case-insensitive check
        });

        if (existingOffer) {
            return res.status(400).json({ error: 'An offer with this name already exists.' });
        }

        const newOffer = new Offers({
            offerName:name,
            description,
            discount,
            type:'category',
            category: categories.map(categoryId => ({ categoryId })),
            status:isActive
        });

        await newOffer.save();
       

        res.status(200).json({ message: 'Offer added successfully' });
    } catch (error) {
        console.error('Error adding offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const addProductOffer = async (req, res) => {
    try {
      
        const { name, description, discount, products, status } = req.body;
        const isActive = status === 'active';

        const existingOffer = await Offers.findOne({
            offerName: { $regex: new RegExp(`^${name}$`, 'i') } // Case-insensitive check
        });

        if (existingOffer) {
            return res.status(400).json({ error: 'An offer with this name already exists.' });
        }



        const newOffer = new Offers({
            offerName:name,
            description,
            discount,
            type:'product',
            products: products.map(productId => ({ productId })),
            status:isActive
        });

        await newOffer.save();
       

        res.status(200).json({ message: 'Offer added successfully' });
    } catch (error) {
        console.error('Error adding offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const deleteOffer = async(req,res)=>{
    try {
        const { id } = req.params;
        const result = await Offers.findByIdAndDelete(id);
    
        if (result) {
          res.status(200).json({ message: 'Offer deleted successfully' });
        } else {
          res.status(404).json({ error: 'Offer not found' });
        }
      } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    };


module.exports = {
    loadOffers,
    addCategoriOffer,
    addProductOffer,
    deleteOffer
};
