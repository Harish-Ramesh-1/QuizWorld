import mongoose from "mongoose"

const singlehis = new mongoose.Schema({
    gameId: {type: String, required: true},
    userId: {type: String, required: true},
    username: {type: String, required: false},
    topic: {type: String, required: true},
    rounds: {type: Number, required: true},
    score: {type: Number, required: true},
    totalQuestions: {type: Number, required: false},
    createdAt: {type: Date, default: Date.now}
})

const singleHistory = mongoose.model("singlehistories", singlehis);

export default singleHistory;