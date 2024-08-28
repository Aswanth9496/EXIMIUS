const User = require('../../models/userModel');
const Address = require('../../models/addressModel');



const loadAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await User.findOne({ _id: userId });
        const addresses = await Address.find({ user_id: userId }); // Fetch all addresses for the user

        res.render('userAddress', { user, addresses: addresses || [] });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};


const addAddress = async (req, res) => {
    try {

        const userId = req.session.user.id;
        const user = await User.findOne({ _id: userId });

        const newAddress = new Address({
            user_id: userId,
            addressName: req.body.addressName,
            addressEmail:user.email,
            addressMobile: req.body.addressMobile,
            addressHouse: req.body.addressHouse,
            addressStreet: req.body.addressStreet,
            addressCity: req.body.addressCity,
            addressDistrict: req.body.addressDistrict,
            addressState: req.body.addressState,
            addressPin: req.body.addressPin
        });

        await newAddress.save();

        res.redirect('/address'); // Redirect back to the address page after adding
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        await Address.findByIdAndDelete(addressId);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
};



module.exports ={
    loadAddress,
    addAddress,
    deleteAddress
}