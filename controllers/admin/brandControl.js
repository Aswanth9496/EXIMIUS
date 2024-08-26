const Brand = require('../../models/brandModel');


// lade the brand page
const loadBrands = async (req,res)=>{
    try {
        const brands = await Brand.find();
        res.render('brands.ejs',{ brands })

    } catch (error) {

        console.log(error.massage);
        res.status(500).send('Server Error');
    }
};


// addd a new brand
const addBrand = async (req, res) => {
    try {
        const { brandName, brandDescription } = req.body;

        // Check if the brand already exists (case-insensitive)
        const existingBrand = await Brand.findOne({
            BrandName: { $regex: new RegExp(`^${brandName}$`, 'i') }
        });

        if (existingBrand) {
            return res.status(400).send('Brand already exists');
        }

        // Create a new brand
        const newBrand = new Brand({
            BrandName: brandName,
            description: brandDescription,
            status: 'Active'
        });

        // Save the new brand to the database
        await newBrand.save();

        // Redirect to the brands page
        res.redirect('/admin/brands');
    } catch (err) {
        // Log the error and send a server error response
        console.error('Error adding brand:', err);
        res.status(500).send('Internal Server Error');
    }
};

// update brand
const updateBrand = async (req, res) => {
    try {
        const { brandName, brandDescription } = req.body;
        const { brandId } = req.params;
       
        
        if (!brandId) {
            return res.status(400).json({ message: 'Brand ID is required' });

        }

        const allowedCharactersRegex = /^[a-zA-Z0-9\s-]+$/; 
        if (!allowedCharactersRegex.test(brandName)) {
            return res.status(400).json({ message: 'Brand name contains invalid characters' });
        }

        const existingBrand = await Brand.findOne({
            _id: { $ne: brandId }, // 
            BrandName: { $regex: new RegExp(`^${brandName}$`, 'i') } 
        });

        if (existingBrand) {
            return res.status(400).json({ message: 'Brand with this name already exists' });
        }

        // Update brand
        await Brand.findByIdAndUpdate(brandId, {
            BrandName: brandName,
            description: brandDescription
        });
         

        res.status(200).json({success:true, message: 'Brand updated successfully' });
    } catch (err) {
        console.error('Error updating brand:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const toggleStatus = async (req, res) => {
    try {
        const brandId = req.params.brandId ;
        console.log(brandId);
        
        // Find the brand by ID
        const brand = await Brand.findById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Toggle the status
        brand.status = brand.status === 'Active' ? 'Inactive' : 'Active';
        await brand.save();

        res.status(200).json({ message: 'Status updated successfully', status: brand.status });
    } catch (err) {
        console.error('Error toggling brand status:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports ={
    loadBrands,
    addBrand,
    updateBrand,
    toggleStatus
}