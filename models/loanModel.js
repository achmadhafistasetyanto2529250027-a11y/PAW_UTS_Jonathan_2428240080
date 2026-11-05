const mongoose = require('mongoose');

// ==========================================
// 1. EMBEDDED SCHEMA: Jaminan (Collateral)
// ==========================================
const jaminanSchema = new mongoose.Schema(
  {
    jenis: {
      type: String,
      required: [true, 'Jenis jaminan wajib diisi'],
      trim: true
    },
    nomorDokumen: {
      type: String,
      required: [true, 'Nomor dokumen jaminan wajib diisi'],
      trim: true
    },
    nilaiTaksiran: {
      type: Number,
      required: [true, 'Nilai taksiran jaminan wajib diisi'],
      min: [0, 'Nilai taksiran tidak boleh negatif']
    }
  },
  { _id: false }
);

// =======================================================
// 2. EMBEDDED SCHEMA: Riwayat Pembayaran (Installment Records)
// ==========================================
const riwayatPembayaranSchema = new mongoose.Schema(
  {
    cicilanKe: {
      type: Number,
      required: [true, 'Cicilan ke- berapa wajib diisi'],
      min: 1
    },
    tanggalBayar: {
      type: Date,
      default: Date.now
    },
    jumlahBayar: {
      type: Number,
      required: [true, 'Jumlah bayar wajib diisi'],
      min: [0, 'Jumlah bayar tidak boleh negatif']
    },
    metodePembayaran: {
      type: String,
      enum: ['transfer', 'tunai'],
      default: 'transfer'
    },
    status: {
      type: String,
      enum: ['lunas', 'sebagian'],
      default: 'lunas'
    }
  },
  { _id: true }
);

// =======================================================
// 3. MAIN SCHEMA: Loan (Pinjaman)
// Menggabungkan REFERENCING (Anggota) & EMBEDDING (Jaminan & Riwayat Pembayaran)
// =======================================================
const loanSchema = new mongoose.Schema(
  {
    // REFERENCING: Menghubungkan Loan dengan Member via ObjectId
    anggota: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Referensi data anggota peminjam wajib diisi']
    },
    jumlahPinjaman: {
      type: Number,
      required: [true, 'Jumlah pinjaman wajib diisi'],
      min: [100000, 'Jumlah pinjaman minimal Rp 100.000']
    },
    tenorBulan: {
      type: Number,
      required: [true, 'Tenor pinjaman (bulan) wajib diisi'],
      min: [1, 'Tenor minimal 1 bulan']
    },
    bungaPersen: {
      type: Number,
      default: 0,
      min: [0, 'Bunga tidak boleh negatif']
    },
    status: {
      type: String,
      enum: {
        values: ['aktif', 'lunas'],
        message: "Status pinjaman hanya boleh 'aktif' atau 'lunas'"
      },
      default: 'aktif'
    },
    keterangan: {
      type: String,
      trim: true
    },
    // EMBEDDING 1: Subdocument jaminan tunggal
    jaminan: {
      type: jaminanSchema,
      required: false
    },
    // EMBEDDING 2: Array of subdocuments riwayat pembayaran
    riwayatPembayaran: {
      type: [riwayatPembayaranSchema],
      default: []
    },
    tanggalPengajuan: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        // Fallback namaAnggota dari populated anggota jika ada
        if (ret.anggota && typeof ret.anggota === 'object' && ret.anggota.nama) {
          ret.namaAnggota = ret.anggota.nama;
        }
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Virtual untuk namaAnggota jika populated
loanSchema.virtual('namaAnggota').get(function () {
  if (this.anggota && typeof this.anggota === 'object' && this.anggota.nama) {
    return this.anggota.nama;
  }
  return undefined;
});

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
