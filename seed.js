require('dotenv').config();
const mongoose = require('mongoose');
const Member = require('./models/memberModel');
const Loan = require('./models/loanModel');

const seedData = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/koperasi_db';
    await mongoose.connect(mongoURI);
    console.log('[Seed] Terhubung ke MongoDB:', mongoURI);

    // Hapus data lama agar bersih
    await Loan.deleteMany({});
    await Member.deleteMany({});
    console.log('[Seed] Data lama dibersihkan');

    // 1. Buat Data Anggota (Referenced Collection)
    const members = await Member.create([
      {
        nama: 'Ibu Sari',
        nik: '3201234567890001',
        noTelepon: '081234567891',
        email: 'sari@koperasi.id',
        alamat: 'Jl. Merdeka No. 10, Jakarta Pusat',
        statusKeanggotaan: 'aktif'
      },
      {
        nama: 'Bapak Budi',
        nik: '3201234567890002',
        noTelepon: '081234567892',
        email: 'budi@koperasi.id',
        alamat: 'Jl. Sudirman No. 45, Bandung',
        statusKeanggotaan: 'aktif'
      },
      {
        nama: 'Kak Andi',
        nik: '3201234567890003',
        noTelepon: '081234567893',
        email: 'andi@koperasi.id',
        alamat: 'Jl. Diponegoro No. 88, Surabaya',
        statusKeanggotaan: 'aktif'
      },
      {
        nama: 'Jonathan Immanuel A.',
        nik: '2428240080123456',
        noTelepon: '081234567880',
        email: 'jonathan@mahasiswa.ac.id',
        alamat: 'Palembang, Sumatera Selatan',
        statusKeanggotaan: 'aktif'
      },
      {
        nama: 'Siti Rahma',
        nik: '3201234567890005',
        noTelepon: '081234567895',
        email: 'siti@koperasi.id',
        alamat: 'Jl. Gajah Mada No. 12, Yogyakarta',
        statusKeanggotaan: 'nonaktif'
      }
    ]);

    console.log(`[Seed] ${members.length} anggota berhasil dibuat`);

    // 2. Buat Data Pinjaman dengan Referencing (anggota) & Embedding (jaminan & riwayatPembayaran)
    const loans = await Loan.create([
      {
        anggota: members[0]._id, // Ibu Sari
        jumlahPinjaman: 5000000,
        tenorBulan: 12,
        bungaPersen: 1.5,
        status: 'aktif',
        keterangan: 'Pinjaman modal usaha warung kelontong',
        jaminan: {
          jenis: 'BPKB Motor Honda Vario 2021',
          nomorDokumen: 'BPKB-B-1234-JKT',
          nilaiTaksiran: 12000000
        },
        riwayatPembayaran: [
          { cicilanKe: 1, jumlahBayar: 450000, metodePembayaran: 'transfer', status: 'lunas' },
          { cicilanKe: 2, jumlahBayar: 450000, metodePembayaran: 'transfer', status: 'lunas' }
        ]
      },
      {
        anggota: members[1]._id, // Bapak Budi
        jumlahPinjaman: 2000000,
        tenorBulan: 6,
        bungaPersen: 1.0,
        status: 'lunas',
        keterangan: 'Pinjaman renovasi atap rumah',
        jaminan: {
          jenis: 'Sertifikat Emas Antam 10gr',
          nomorDokumen: 'ANTAM-998877',
          nilaiTaksiran: 10500000
        },
        riwayatPembayaran: [
          { cicilanKe: 1, jumlahBayar: 350000, metodePembayaran: 'tunai', status: 'lunas' },
          { cicilanKe: 2, jumlahBayar: 350000, metodePembayaran: 'tunai', status: 'lunas' },
          { cicilanKe: 3, jumlahBayar: 350000, metodePembayaran: 'tunai', status: 'lunas' },
          { cicilanKe: 4, jumlahBayar: 350000, metodePembayaran: 'tunai', status: 'lunas' },
          { cicilanKe: 5, jumlahBayar: 350000, metodePembayaran: 'tunai', status: 'lunas' },
          { cicilanKe: 6, jumlahBayar: 350000, metodePembayaran: 'tunai', status: 'lunas' }
        ]
      },
      {
        anggota: members[2]._id, // Kak Andi
        jumlahPinjaman: 10000000,
        tenorBulan: 24,
        bungaPersen: 2.0,
        status: 'aktif',
        keterangan: 'Pinjaman biaya pendidikan magister',
        jaminan: {
          jenis: 'BPKB Mobil Toyota Avanza 2018',
          nomorDokumen: 'BPKB-L-5678-SBY',
          nilaiTaksiran: 110000000
        },
        riwayatPembayaran: [
          { cicilanKe: 1, jumlahBayar: 550000, metodePembayaran: 'transfer', status: 'lunas' }
        ]
      },
      {
        anggota: members[3]._id, // Jonathan Immanuel A.
        jumlahPinjaman: 7500000,
        tenorBulan: 18,
        bungaPersen: 1.2,
        status: 'aktif',
        keterangan: 'Pengembangan proyek sistem informasi koperasi digital',
        jaminan: {
          jenis: 'Perangkat Laptop Apple MacBook Pro M2',
          nomorDokumen: 'APL-MBP-2023-SN991',
          nilaiTaksiran: 22000000
        },
        riwayatPembayaran: [
          { cicilanKe: 1, jumlahBayar: 485000, metodePembayaran: 'transfer', status: 'lunas' }
        ]
      },
      {
        anggota: members[4]._id, // Siti Rahma
        jumlahPinjaman: 3000000,
        tenorBulan: 12,
        bungaPersen: 1.5,
        status: 'lunas',
        keterangan: 'Pembelian mesin jahit konveksi',
        jaminan: {
          jenis: 'Mesin Jahit Industri Juki High Speed',
          nomorDokumen: 'JKI-882190-IND',
          nilaiTaksiran: 6500000
        },
        riwayatPembayaran: [
          { cicilanKe: 1, jumlahBayar: 280000, metodePembayaran: 'transfer', status: 'lunas' }
        ]
      }
    ]);

    console.log(`[Seed] ${loans.length} pinjaman dengan referencing & embedding berhasil dibuat`);
    console.log('[Seed] Seeding data selesai!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Terjadi error:', err);
    process.exit(1);
  }
};

seedData();
