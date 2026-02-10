import mongoose from "mongoose"
import validator from "validator"
import bcrypt from "bcrypt"

const Userschema = new mongoose.Schema({
    username: {type: String , required: true},
    email: {type: String, required: true, validate: [validator.isEmail, "Please provide a valid email"], lowercase: true ,trim: true , unique: true },
    password: {type: String , required: true, minlength: 8}

})

Userschema.pre("save", async function(){
    if(!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 12);
});

const User = mongoose.model("User", Userschema);

export default User;