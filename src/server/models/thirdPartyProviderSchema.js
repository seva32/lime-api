// import mongoose from 'mongoose';

// const ThirdPartyProviderSchema = mongoose.model(
//   'ThirdPartyProviderSchema',
//   new mongoose.Schema({
//     provider_name: {
//       type: String,
//       default: null,
//     },
//     provider_id: {
//       type: String,
//       default: null,
//     },
//     provider_data: {
//       type: {},
//       default: null,
//     },
//   }),
// );

// export default ThirdPartyProviderSchema;

import mongoose from 'mongoose';

const { Schema } = mongoose;
mongoose.set('useCreateIndex', true);

const thirdPartyProviderSchema = new Schema({
  provider_name: {
    type: String,
    default: null,
  },
  provider_id: {
    type: String,
    default: null,
  },
  provider_data: {
    type: {},
    default: null,
  },
});

const ModelClass = mongoose.model(
  'thirdPartyProvider',
  thirdPartyProviderSchema,
);

export default ModelClass;
