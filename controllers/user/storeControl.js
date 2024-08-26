const categories = require('../../models/categoryModel');
const brands =require('../../models/brandModel');
const products =require('../../models/productsModel');

const LoadStorePage = async (req,res)=>{
    try {
       const  categorie = await categories.find();
       const brand = await brands.find();
       const product = await products.find({ listed: true }).populate('category').populate('brand');
        
        res.render('store',{categorie,brand,product});
    } catch (error) {
        console.log(error);
    }
};


const productDetails = async (req,res)=>{
    try {
        const productId = req.params.id;
        const product = await products.findById(productId).populate('category').populate('brand');
        const relatedProducts = await products.find({brand:product.brand}).limit(4);
        
        res.render('productDetails',{product,relatedProducts});
    } catch (error) {
        
        
        console.log(error);
    }
}



module.exports ={
    LoadStorePage,
    productDetails
}