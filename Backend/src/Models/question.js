import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    Qno: {
      type: Number,
      required: true,
    },

    topic: {
      type: String,
      required: true,
      lowercase: true,
    },

    question: {
      type: String,
      required: true,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (val) {
          return val.length === 4;
        },
        message: "Exactly 4 options are required",
      },
    },

    answer: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },

    explanation: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate Qno inside same topic
questionSchema.index({ topic: 1, Qno: 1 }, { unique: true });

const Question = mongoose.model("questionDB", questionSchema);

export default Question;