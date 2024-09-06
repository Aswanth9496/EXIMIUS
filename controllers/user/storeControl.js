const Categories = require('../../models/categoryModel');
const Brands =require('../../models/brandModel');
const products =require('../../models/productsModel');


const LoadStorePage = async (req, res) => {
    try {
        const { search, categories, brands, sort  } = req.query;
        const categorie = await Categories.find();
        const brand = await Brands.find();

        
        const totalResults = await products.countDocuments();
        

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

        // Initialize sortOption as an empty object
        let sortOption = {};

        // Apply sorting based on the 'sort' parameter
        if (sort) {
            switch (sort) {
                case 'low-to-high':
                    sortOption.price = 1; // Ascending
                    break;
                case 'high-to-low':
                    sortOption.price = -1; // Descending
                    break;
                case 'a-to-z':
                    sortOption.name = 1; // Alphabetical ascending
                    break;
                case 'z-to-a':
                    sortOption.name = -1; // Alphabetical descending
                    break;
                default:
                    break;
            }
        }

        // Fetch products with sorting and other query parameters
        const product = await products.find(query).sort(sortOption).populate('category').populate('brand');

        const userData = req.session.user;

        res.render('store', {
            categorie,
            totalResults,
            brand,
            product,
            userData: userData || null,
            selectedCategories: categories ? categories.split(',') : [],
            selectedBrands: brands ? brands.split(',') : [],
            sort: sort || '' // Pass the sort parameter to the view
        });
    } catch (error) {
        console.error('Error loading store page:', error);
        res.status(500).send('Internal Server Error');
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