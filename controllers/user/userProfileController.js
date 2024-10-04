
const User = require('../../models/userModel');
const bcrypt = require('bcrypt');

const loadProfile = async (req,res)=>{
try {
    
    const userId = req.session.user.id;
    const user = await User.findOne({ _id: userId })


    res.render('AccountDetails',{ user });

} catch (error) {
    console.log(error);
    
}
};



const updateUserPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.query; // Change from req.body to req.query
        const userId = req.session.user.id;

        // Check if all fields are provided
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All password fields are required' });
        }

        // Check if new password and confirmation match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New passwords do not match' });
        }

        const user = await User.findOne({ _id: userId }).exec();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.redirect('/profile');
    } catch (error) {
        console.log('Error updating password:', error);
        res.status(500).json({ message: 'Failed to update password', error: error.message });
    }
};



const updateProfile = async (req, res) => {
    try {
      
        
        const userId = req.session.user.id;
        const { username, mobile } = req.query; 

        if (!username || !mobile) {
            return res.status(400).json({ message: 'Username and mobile number are required.' });
        }

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.name = username;
        user.mobile = mobile;
        await user.save();

        res.json({ username: user.name, mobile: user.mobile });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Failed to update profile.' });
    }
};




module.exports ={
    loadProfile,
    updateUserPassword,
    updateProfile
}