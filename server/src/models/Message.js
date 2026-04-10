import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    conversationId: {
      type: String,
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    attachments: [
      {
        url: {
          type: String,
          trim: true
        },
        fileType: {
          type: String,
          trim: true
        },
        fileName: {
          type: String,
          trim: true
        }
      }
    ],
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
