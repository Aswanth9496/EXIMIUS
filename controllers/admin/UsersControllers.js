const User = require('../../models/userModel');

const LoadUserManagement = async (req,res)=>{

    try {

        const users = await User.find({});  
        res.render('userManagement', { users })

    } catch (error) {
        
     console.log(error);
     res.status(500).send('Server Error');
      
    }
};

const blockUser = async (req,res)=>{
          try {
            const { userId, action } = req.body;
            const isBlocked = action === 'block' ? true : false;
    
            // Update the user's isBlocked status
            await User.findByIdAndUpdate(userId, { isBlocked });
    
            res.status(200).json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully` });
          } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
            
          }
}




module.exports ={
    LoadUserManagement,
    blockUser
}