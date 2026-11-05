const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: [true, 'Nama anggota wajib diisi'],
      trim: true
    },
    nik: {
      type: String,
      required: [true, 'NIK anggota wajib diisi'],
      unique: true,
      trim: true
    },
    noTelepon: {
      type: String,
      required: [true, 'Nomor telepon wajib diisi'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    alamat: {
      type: String,
      trim: true
    },
    statusKeanggotaan: {
      type: String,
      enum: ['aktif', 'nonaktif'],
      default: 'aktif'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual relationship: pinjaman yang dimiliki anggota
memberSchema.virtual('pinjaman', {
  ref: 'Loan',
  localField: '_id',
  foreignField: 'anggota'
});

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;
