

// Load home page
const lodeHomePage = async (req, res) => {
    try {
        const userData =req.session.user   
        
        res.render('home',{
            userData: userData ? userData:null
        });
    } catch (error) {
        console.log(error.message);
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
    lodeHomePage,
    logOut
   
}














