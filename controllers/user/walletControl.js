

const loadWallet = async (req,res)=>{
    try {
        res.render('userWallet');
    } catch (error) {
        console.log(error);
        
    }
};



module.exports ={
    loadWallet
}