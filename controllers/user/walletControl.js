const Wallet = require('../../models/walletModel');



const loadWallet = async (req,res)=>{
    try {
        const userId = req.session.user.id;
     
        const userWallet = await Wallet.findOne({  user_id:userId});
        
          res.render('userWallet',{ wallet: userWallet });
     
    } catch (error) {
        console.log(error);
        
    }
};



module.exports ={
    loadWallet
}