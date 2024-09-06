

const lodeCoupons = async (req,res)=>{
    try {
        res.render('Coupons')
    } catch (error) {
        console.log(error);
        
    }
};


module.exports ={
    lodeCoupons
};

