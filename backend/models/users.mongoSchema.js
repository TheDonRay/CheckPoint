import mongoose from 'mongoose'; 
const { Schema } = mongoose; 

const userSchema = new UserSchema({ 
    name: { 
        type: String, 
        required: true, 
        unique: false 
    }, 
    email: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    role: { 
        type: String, 
        required: true, 
    }, 
    status: { 
        type: String
    }, 
    createdAt: { 
        type: Date 
    }
}); 

const user = mongoose.model("users", userSchema); 

export { user } 