const Category = require('../../models/categoryModel');

// Load category management page
const loadCategoryManagementPage = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('Category', { categories });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Add a new category
const addCategory = async (req, res) => {
    try {
        const { categoryName, categoryStatus } = req.body;

        if (!categoryName) {
            return res.status(400).json({ type: 'error', msg: 'Category name is required' });
        }

        const categoryExists = await Category.findOne({
            name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
        });

        if (categoryExists) {
            return res.status(400).json({ type: 'error', msg: 'Category with this name already exists' });
        }

        const isValidName = /^[A-Za-z\s]+$/.test(categoryName);
        if (!isValidName) {
            return res.status(400).json({ type: 'error', msg: 'Category name must contain only letters' });
        }

        const newCategory = new Category({
            name: categoryName,
            status: categoryStatus === 'true'
        });

        await newCategory.save();
        res.status(200).json({ type: 'success', msg: 'Category added successfully' });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ type: 'error', msg: 'Server Error' });
    }
};

// List and unlist category
const toggleStatus = async (req, res) => {
    try {
        const { categoryId, status } = req.body;
        
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        category.status = status === 'list';
        await category.save();

        res.json({ success: true, message: 'Category status updated successfully' });
    } catch (error) {
        console.error('Error toggling category status:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update the category name
const updateCategoryName = async (req, res) => {
    try {
        const { categoryId, categoryName } = req.body;

        if (!categoryId || !categoryName) {
            return res.status(400).json({ type: 'error', msg: 'Category ID and new name are required' });
        }

        const isValidName = /^[A-Za-z\s]+$/.test(categoryName);
        if(!isValidName){
            return res.status(400).json({ type: 'error', msg: 'Category name must contain only letters' }); 
        }

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ type: 'error', msg: 'Category not found' });
        }

        const existingCategory = await Category.findOne({
            _id: { $ne: categoryId }, 
            name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
        });

        if (existingCategory) {
            return res.status(400).json({ type: 'error', msg: 'A category with this name already exists' });
        }

        // Update category name
        category.name = categoryName;
        await category.save();

        res.status(200).json({ type: 'success', msg: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ type: 'error', msg: 'Server Error' });
    }
};

module.exports = {
    loadCategoryManagementPage,
    addCategory,
    toggleStatus,
    updateCategoryName
};
