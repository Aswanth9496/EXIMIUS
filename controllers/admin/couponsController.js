
const Coupons = require('../../models/couponModel');




const lodeCoupons = async (req,res)=>{
    try {
        const coupons = await Coupons.find();

        res.render('Coupons',{coupons});
    } catch (error) {
        console.log(error);
        
    }
};


const addCoupon = async (req, res) => {
    try {
        const { code, discount, maxDiscountAmount, minPurchaseAmount, expirationDate, status } = req.body;

        // Check if coupon code already exists
        const existingCoupon = await Coupons.findOne({ code });

        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }

        // Check if expiration date is greater than the current date
        const currentDate = new Date().setHours(0, 0, 0, 0); 
        const selectedDate = new Date(expirationDate).setHours(0, 0, 0, 0); 

        if (selectedDate <= currentDate) {
            return res.status(400).json({ message: 'Expiration date must be greater than today\'s date.' });
        }

        // Validate minPurchaseAmount
        if (isNaN(minPurchaseAmount) || minPurchaseAmount <= 0) {
            return res.status(400).json({ message: 'Minimum purchase amount must be a positive number.' });
        }

        // Create and save new coupon
        const newCoupon = new Coupons({
            code,
            discount: parseFloat(discount),
            maxDiscountAmount: parseFloat(maxDiscountAmount), 
            minPurchaseAmount: parseFloat(minPurchaseAmount), 
            expirationDate,
            status: Boolean(status) 
        });

        await newCoupon.save();
        res.status(201).json({ message: 'Coupon added successfully' });

    } catch (error) {
        console.error('Error adding coupon:', error); // Log error details for debugging
        res.status(500).json({ message: 'Error adding coupon', error: error.message });
    }
};



const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the coupon by ID
        const result = await Coupons.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting coupon', error });
    }
};



const editCoupons = async (req,res)=>{

    const { couponId } = req.params;
    const { code, discount, maxDiscountAmount, minPurchaseAmount, expirationDate, status } = req.body;

    try {
        
        const coupon = await  Coupons .findById(couponId);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found.' });
        }

        
        const existingCoupon = await Coupons.findOne({ code, _id: { $ne: couponId } });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon code already exists.' });
        }

        
        coupon.code = code;
        coupon.discount = discount;
        coupon.maxDiscountAmount = maxDiscountAmount;
        coupon.minPurchaseAmount = minPurchaseAmount;
        coupon.expirationDate = expirationDate;
        coupon.status = status;

        await coupon.save();
        res.status(200).json({ message: 'Coupon updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update coupon.' });
    }
}


module.exports ={
    lodeCoupons,
    addCoupon,
    deleteCoupon,
    editCoupons
};

