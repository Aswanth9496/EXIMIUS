const Categories = require('../../models/categoryModel');
const Brands =require('../../models/brandModel');
const products =require('../../models/productsModel');


const LoadStorePage = async (req, res) => {
    try {
        const { search, categories, brands, sort, page = 1 } = req.query; // Default page to 1
        const categorie = await Categories.find();
        const brand = await Brands.find();

        // Set the number of products per page
        const itemsPerPage = 6; // You can change this number as needed

        // Initialize the query object for filtering
        let query = { listed: true };

        // Existing search, category, and brand filtering logic
        if (search) {
            query.name = new RegExp(search, 'i'); // Case-insensitive search
        }

        if (categories) {
            query.category = { $in: categories.split(',') }; // Handle multiple categories
        }

        if (brands) {
            query.brand = { $in: brands.split(',') }; // Handle multiple brands
        }

        // Determine sorting option
        let sortOption = {};
        if (sort === 'low-to-high') {
            sortOption.price = 1; // Sort by price ascending
        } else if (sort === 'high-to-low') {
            sortOption.price = -1; // Sort by price descending
        } else if (sort === 'a-to-z') {
            sortOption.name = 1; // Sort alphabetically ascending
        } else if (sort === 'z-to-a') {
            sortOption.name = -1; // Sort alphabetically descending
        }

        // Calculate total results based on the filtered query
        const totalResults = await products.countDocuments(query);

        // Calculate total pages
        const totalPages = Math.ceil(totalResults / itemsPerPage);

        // Fetch products with pagination
        const product = await products.find(query)
            .sort(sortOption)
            .skip((page - 1) * itemsPerPage) // Skip products from previous pages
            .limit(itemsPerPage) // Limit to itemsPerPage
            .populate('category')
            .populate('brand');

        const userData = req.session.user;

        res.render('store', {
            categorie,
            totalResults,
            brand,
            product,
            userData: userData || null,
            selectedCategories: categories ? categories.split(',') : [],
            selectedBrands: brands ? brands.split(',') : [],
            sort: sort || '', // Pass the sort parameter to the view
            currentPage: Number(page), // Current page number
            totalPages,
            search,
            itemsPerPage
        });
    } catch (error) {
        console.error('Error loading store page:', error);
        res.status(500).send('Internal Server Error');
    }
};




const productDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await products.findById(productId).populate('category').populate('brand');

        if (!product) {
            return res.status(404).send('Product not found')
        }

        const relatedProducts = await products.find({
            brand: product.brand,
            _id: { $ne: productId } // Exclude the current product
        }).limit(4);

        res.render('productDetails', { product, relatedProducts });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}




module.exports ={
    LoadStorePage,
    productDetails,
   
};