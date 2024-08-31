const Categories = require('../../models/categoryModel');
const Brands =require('../../models/brandModel');
const products =require('../../models/productsModel');

const LoadStorePage = async (req, res) => {
    try {
        const { search, categories, brands } = req.query;
        const categorie = await Categories.find();
        const brand = await Brands.find();

        let query = { listed: true };
        if (search) {
            query.name = new RegExp(search, 'i');
        }
        if (categories) {
            query.category = { $in: categories.split(',') };
        }
        if (brands) {
            query.brand = { $in: brands.split(',') };
        }

        const product = await products.find(query).populate('category').populate('brand');

        const userData = req.session.user;

        res.render('store', {
            categorie,
            brand,
            product,
            userData: userData ? userData : null,
            selectedCategories: categories ? categories.split(',') : [],
            selectedBrands: brands ? brands.split(',') : []
        });
    } catch (error) {
        console.log(error);
    }
};



const productDetails = async (req,res)=>{
    try {
        const productId = req.params.id;
        const product = await products.findById(productId).populate('category').populate('brand');
        
        const relatedProducts = await products.find({
            brand: product.brand,
            _id: { $ne: productId } // Exclude the current product
        }).limit(4);
        
        res.render('productDetails',{product,relatedProducts});
    } catch (error) {
        
        
        console.log(error);
    }
}



module.exports ={
    LoadStorePage,
    productDetails,
   
};