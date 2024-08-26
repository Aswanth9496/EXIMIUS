

// Load home page
const lodeHomePage = async (req, res) => {
    try {
        if (req.session.user) { 
            return res.redirect('/');
        }
        res.render('home');
    } catch (error) {
        console.log(error.message);
    }
}



//load user cart
const loadCart =async (req,res)=>{
    try {
        await res.render('cart')
    } catch (error) {
        console.log(error);
        
    }
};



module.exports = {
    lodeHomePage,
    loadCart,
   
}














