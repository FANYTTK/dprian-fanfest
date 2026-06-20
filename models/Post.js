const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploaderName: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, default: '', trim: true, maxlength: 280 },
    event: { type: String, required: true, trim: true, maxlength: 80 },
    eventDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// Índice de texto para el buscador (busca en descripción, evento y nombre de quien subió)
postSchema.index({ caption: 'text', event: 'text', uploaderName: 'text' });

module.exports = mongoose.model('Post', postSchema);
