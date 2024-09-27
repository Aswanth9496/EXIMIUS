const Products =require('../../models/productsModel');



// Load home page
const loadHomePage = async (req, res) => {
    try {
        const userData = req.session?.user || null; 
        const products = await  Products.find({ listed: true }).populate('category').populate('brand');

        
        res.render('home', {
            userData ,
            products
        });
    } catch (error) {
        console.error('Error loading home page:', error.message);
    }
};



const logOut = async (req,res)=>{
    try {
        await req.session.destroy();
        res.redirect('/');
        
    } catch (error) {
        console.log(error);
        
    }
};



module.exports = {
    loadHomePage,
    logOut
   
}














