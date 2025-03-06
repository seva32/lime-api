import mongoose from 'mongoose';

const { Schema } = mongoose;

const tokenSchema = new Schema({
  refreshToken: {
    type: String,
    default: null,
  },
  hash: {
    type: String,
    default: null,
  },
  osfamily: {
    type: String,
    default: null,
  },
  browserfamily: {
    type: String,
    default: null,
  },
});

const ModelClass = mongoose.model('token', tokenSchema);

export default ModelClass;
