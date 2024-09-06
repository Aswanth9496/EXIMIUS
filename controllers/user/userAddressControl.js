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




const updateAddress = async (req, res) => {
    try {

        const { id } = req.params;
        const {  addressName, addressMobile, addressHouse, addressStreet, addressCity, addressDistrict, addressState, addressPin } = req.body;

        const updatedAddress = await Address.findByIdAndUpdate(
            id,
            {
                addressName,
                addressMobile,
                addressHouse,
                addressStreet,
                addressCity,
                addressDistrict,
                addressState,
                addressPin
            },
            { new: true } // Return the updated document
        );

        if (!updatedAddress) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        res.json({ success: true, address: updatedAddress });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Server Error' });
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
    deleteAddress,
    updateAddress
};