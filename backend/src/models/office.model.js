import mongoose from "mongoose";

const officeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide an office name"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Please provide an address"],
    },
    coords: {
      type: [Number], // [latitude, longitude]
      required: [true, "Please provide coordinates"],
    },
    radius: {
      type: Number,
      required: [true, "Please provide a radius in meters"],
      default: 100,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.version = `${(ret.__v || 0) + 1}.0`;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        ret.version = `${(ret.__v || 0) + 1}.0`;
        delete ret.__v;
        return ret;
      },
    },
  },
);

const Office = mongoose.model("Office", officeSchema);

export default Office;
