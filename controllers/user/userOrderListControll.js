const Order = require('../../models/ordersModel');



const loadOrderList = async (req,res)=>{
    try {

        const userId = req.session.user.id;
        const orders = await Order.find({ userId: userId }).sort({ orderDate: -1 });

        res.render('orderList', { orders });
    } catch (error) {
        console.log(error);
        
    }
};



module.exports={
    loadOrderList
}
