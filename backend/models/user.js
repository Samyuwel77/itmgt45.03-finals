const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // ---- new fields below ----
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  // --------------------------
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Place' }]
});

module.exports = mongoose.model('User', userSchema);