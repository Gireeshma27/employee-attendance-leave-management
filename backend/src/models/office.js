import mongoose from "mongoose";

const officeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    coords: {
      type: [Number], // [latitude, longitude]
      required: true,
    },
    radius: {
      type: Number,
      required: true,
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
    versionKey: false,
  },
);

const Office = mongoose.model("Office", officeSchema);

export default Office;
