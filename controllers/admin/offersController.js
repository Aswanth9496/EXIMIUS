const Offers = require('../../models/offersModel');
const Products = require('../../models/productsModel');
const Category = require('../../models/categoryModel');





// Helper function to calculate the best offer
const calculateBestOffer = (product) => {
    if (!product.offers || product.offers.length === 0) {
        return null; // No offer available
    }

    // Find the highest discount offer
    const bestOffer = product.offers.reduce((best, current) => {
        return current.discount > best.discount ? current : best;
    });

    // Calculate the offer price based on the best offer
    const offerPrice = product.price - (product.price * bestOffer.discount / 100);
    
    return offerPrice;
};






// Load offers page with categories and products
const loadOffers = async (req, res) => {
    try {
        const categories = await Category.find();
        const products = await Products.find();

        const offers = await Offers.find().populate('products.productId', 'name').populate('category.categoryId', 'name');

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

        const products = await Products.find({ category: { $in: categories } });

        for (const product of products) {
            product.offers.push({
                offerId: newOffer._id,
                discount: discount,
            });
            
            // Update the product's offerPrice based on highest discount
            product.offerPrice = calculateBestOffer(product);
            await product.save();
        }
       

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


        const productList = await Products.find({ _id: { $in: products } });

        for (const product of productList) {
            product.offers.push({
                offerId: newOffer._id,
                discount: discount,
            });

            // Update the product's offerPrice based on highest discount
            product.offerPrice = calculateBestOffer(product);
            await product.save();
        }
       

        res.status(200).json({ message: 'Offer added successfully' });
    } catch (error) {
        console.error('Error adding offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the offer to be deleted
        const offer = await Offers.findByIdAndDelete(id);

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        // Determine whether it was a product or category offer
        if (offer.type === 'category') {
            // Find all products in the affected categories
            const products = await Products.find({ 'category': { $in: offer.category.map(c => c.categoryId) } });

            for (const product of products) {
                // Remove the offer from the product's offers array
                product.offers = product.offers.filter(o => o.offerId.toString() !== offer._id.toString());

                // Recalculate the offerPrice for the product
                product.offerPrice = calculateBestOffer(product);

                await product.save();
            }
        } else if (offer.type === 'product') {
            // Find all affected products
            const products = await Products.find({ '_id': { $in: offer.products.map(p => p.productId) } });

            for (const product of products) {
                // Remove the offer from the product's offers array
                product.offers = product.offers.filter(o => o.offerId.toString() !== offer._id.toString());

                // Recalculate the offerPrice for the product
                product.offerPrice = calculateBestOffer(product);

                await product.save();
            }
        }

        res.status(200).json({ message: 'Offer deleted and product prices updated successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};





const editoffer = async (req,res)=>{
    try {

        const { id } = req.params;
        const { name, description, discount, status, products, categories } = req.body;
        const isActive = status === 'active';


        const existingOffer = await Offers.findOne({ 
            _id: { $ne: id }, 
            offerName: { $regex: new RegExp(`^${name}$`, 'i') } 
        });

        if (existingOffer) {
            return res.status(400).json({ error: 'An offer with this name already exists.' });
        }


        const offerToUpdate = await Offers.findById(id);

        if (!offerToUpdate) {
            return res.status(404).json({ error: 'Offer not found' });
        }


        offerToUpdate.offerName = name;
        offerToUpdate.description = description;
        offerToUpdate.discount = discount;
        offerToUpdate.status = isActive;


        if (offerToUpdate.type === 'product') {
            offerToUpdate.products = products.map(productId => ({ productId }));
        } else if (offerToUpdate.type === 'category') {
            offerToUpdate.category = categories.map(categoryId => ({ categoryId }));
        }

        await offerToUpdate.save();

        res.status(200).json({ message: 'Offer updated successfully' });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
        
    }
}



module.exports = {
    loadOffers,
    addCategoriOffer,
    addProductOffer,
    deleteOffer,
    editoffer
};
