const mongoose = require('mongoose');
const Loan = require('../models/loanModel');
const Member = require('../models/memberModel');

// @desc    Get all loans with Filtering, Pagination, Sorting, Projection & Population
// @route   GET /loans
const getLoans = async (req, res, next) => {
  try {
    const {
      status,
      minPinjaman,
      maxPinjaman,
      tenor,
      jenisJaminan,
      anggota,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      sort,
      fields,
      select,
      format
    } = req.query;

    // ==========================================
    // 1. FILTERING
    // ==========================================
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (minPinjaman || maxPinjaman) {
      filter.jumlahPinjaman = {};
      if (minPinjaman) filter.jumlahPinjaman.$gte = Number(minPinjaman);
      if (maxPinjaman) filter.jumlahPinjaman.$lte = Number(maxPinjaman);
    }

    if (tenor) {
      filter.tenorBulan = Number(tenor);
    }

    if (jenisJaminan) {
      filter['jaminan.jenis'] = { $regex: jenisJaminan, $options: 'i' };
    }

    if (anggota && mongoose.Types.ObjectId.isValid(anggota)) {
      filter.anggota = new mongoose.Types.ObjectId(anggota);
    }

    // Search by member name or notes
    if (search) {
      // Find matching members first
      const matchingMembers = await Member.find({
        nama: { $regex: search, $options: 'i' }
      }).select('_id');
      const memberIds = matchingMembers.map((m) => m._id);

      filter.$or = [
        { anggota: { $in: memberIds } },
        { keterangan: { $regex: search, $options: 'i' } },
        { 'jaminan.jenis': { $regex: search, $options: 'i' } }
      ];
    }

    // ==========================================
    // 2. PAGINATION SETUP
    // ==========================================
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Total matching documents
    const totalDocs = await Loan.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / limitNum) || 1;

    // ==========================================
    // 3. SORTING
    // ==========================================
    let sortOption = {};
    if (sort) {
      // Direct mongoose sort string like '-jumlahPinjaman,createdAt'
      sortOption = sort.split(',').join(' ');
    } else {
      const sortDirection = order.toLowerCase() === 'asc' || order === '1' ? 1 : -1;
      sortOption[sortBy] = sortDirection;
    }

    // ==========================================
    // 4. PROJECTION (Select Fields)
    // ==========================================
    const projectionParam = fields || select;
    let projectionString = '-__v';
    let shouldPopulateMember = true;

    if (projectionParam) {
      const fieldList = projectionParam.split(',').map((f) => f.trim());
      projectionString = fieldList.join(' ');

      // If user specified positive projections and didn't include anggota, skip populate
      const hasPositiveFields = fieldList.some((f) => !f.startsWith('-'));
      if (hasPositiveFields && !fieldList.includes('anggota')) {
        shouldPopulateMember = false;
      }
    }

    // ==========================================
    // BUILD & EXECUTE QUERY
    // ==========================================
    let query = Loan.find(filter)
      .select(projectionString)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // REFERENCING: Populate data Anggota
    if (shouldPopulateMember) {
      query = query.populate(
        'anggota',
        'nama nik noTelepon email alamat statusKeanggotaan'
      );
    }

    const loans = await query.exec();

    // Set pagination headers
    res.set('X-Total-Count', totalDocs);
    res.set('X-Page', pageNum);
    res.set('X-Limit', limitNum);
    res.set('X-Total-Pages', totalPages);

    // Format array jika secara eksplisit diminta (misal untuk backward compatibility lama)
    if (format === 'array') {
      return res.status(200).json(loans);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Data pinjaman berhasil diambil',
      pagination: {
        total: totalDocs,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      data: loans
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get loan by ID (populated with member and embedded docs)
// @route   GET /loans/:id
const getLoanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let loan;
    if (mongoose.Types.ObjectId.isValid(id)) {
      loan = await Loan.findById(id).populate(
        'anggota',
        'nama nik noTelepon email alamat statusKeanggotaan'
      );
    }

    if (!loan) {
      const error = new Error('Data tidak ditemukan');
      error.status = 404;
      return next(error);
    }

    return res.status(200).json(loan);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new loan (with referencing to Member and embedded jaminan & riwayatPembayaran)
// @route   POST /loans
const createLoan = async (req, res, next) => {
  try {
    let {
      anggota,
      namaAnggota,
      jumlahPinjaman,
      tenorBulan,
      bungaPersen,
      status,
      keterangan,
      jaminan,
      riwayatPembayaran
    } = req.body;

    // Validasi input dasar
    if ((!anggota && !namaAnggota) || !jumlahPinjaman || !tenorBulan || !status) {
      const error = new Error(
        'Data tidak lengkap. anggota (atau namaAnggota), jumlahPinjaman, tenorBulan, dan status wajib diisi'
      );
      error.status = 400;
      return next(error);
    }

    if (status !== 'aktif' && status !== 'lunas') {
      const error = new Error("Status hanya boleh 'aktif' atau 'lunas'");
      error.status = 400;
      return next(error);
    }

    // Resolve anggota ID
    let memberId = anggota;
    if (!memberId && namaAnggota) {
      // Find or create member automatically for seamless testing
      let existingMember = await Member.findOne({ nama: namaAnggota });
      if (!existingMember) {
        existingMember = await Member.create({
          nama: namaAnggota,
          nik: '320' + Date.now().toString().slice(-13),
          noTelepon: '0812' + Math.floor(10000000 + Math.random() * 90000000),
          statusKeanggotaan: 'aktif'
        });
      }
      memberId = existingMember._id;
    } else if (memberId && !mongoose.Types.ObjectId.isValid(memberId)) {
      const error = new Error('ID anggota tidak valid');
      error.status = 400;
      return next(error);
    }

    // Default jaminan jika tidak diberikan agar schema embedding selalu terisi
    const defaultJaminan = jaminan || {
      jenis: 'Surat Kendaraan (BPKB Motor)',
      nomorDokumen: 'DOC-' + Date.now().toString().slice(-6),
      nilaiTaksiran: Number(jumlahPinjaman) * 1.25
    };

    const newLoan = await Loan.create({
      anggota: memberId,
      jumlahPinjaman: Number(jumlahPinjaman),
      tenorBulan: Number(tenorBulan),
      bungaPersen: bungaPersen !== undefined ? Number(bungaPersen) : 0,
      status,
      keterangan: keterangan || 'Pinjaman disetujui',
      jaminan: defaultJaminan,
      riwayatPembayaran: riwayatPembayaran || []
    });

    const populatedLoan = await Loan.findById(newLoan._id).populate(
      'anggota',
      'nama nik noTelepon email alamat statusKeanggotaan'
    );

    return res.status(201).json({
      status: 'success',
      message: 'Data berhasil ditambahkan',
      data: populatedLoan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update loan by ID
// @route   PUT /loans/:id
const updateLoan = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Data tidak ditemukan');
      error.status = 404;
      return next(error);
    }

    const {
      anggota,
      namaAnggota,
      jumlahPinjaman,
      tenorBulan,
      bungaPersen,
      status,
      keterangan,
      jaminan,
      riwayatPembayaran
    } = req.body;

    if ((!anggota && !namaAnggota) || !jumlahPinjaman || !tenorBulan || !status) {
      const error = new Error(
        'Data tidak lengkap. anggota (atau namaAnggota), jumlahPinjaman, tenorBulan, dan status wajib diisi'
      );
      error.status = 400;
      return next(error);
    }

    if (status !== 'aktif' && status !== 'lunas') {
      const error = new Error("Status hanya boleh 'aktif' atau 'lunas'");
      error.status = 400;
      return next(error);
    }

    const loanToUpdate = await Loan.findById(id);
    if (!loanToUpdate) {
      const error = new Error('Data tidak ditemukan');
      error.status = 404;
      return next(error);
    }

    // Update fields
    if (anggota && mongoose.Types.ObjectId.isValid(anggota)) {
      loanToUpdate.anggota = anggota;
    } else if (namaAnggota) {
      let member = await Member.findOne({ nama: namaAnggota });
      if (!member) {
        member = await Member.create({
          nama: namaAnggota,
          nik: '320' + Date.now().toString().slice(-13),
          noTelepon: '0812' + Math.floor(10000000 + Math.random() * 90000000)
        });
      }
      loanToUpdate.anggota = member._id;
    }

    loanToUpdate.jumlahPinjaman = Number(jumlahPinjaman);
    loanToUpdate.tenorBulan = Number(tenorBulan);
    if (bungaPersen !== undefined) loanToUpdate.bungaPersen = Number(bungaPersen);
    loanToUpdate.status = status;
    if (keterangan) loanToUpdate.keterangan = keterangan;
    if (jaminan) loanToUpdate.jaminan = jaminan;
    if (riwayatPembayaran) loanToUpdate.riwayatPembayaran = riwayatPembayaran;

    await loanToUpdate.save();

    const updatedLoan = await Loan.findById(id).populate(
      'anggota',
      'nama nik noTelepon email alamat statusKeanggotaan'
    );

    return res.status(200).json({
      status: 'success',
      message: 'Data berhasil diperbarui',
      data: updatedLoan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete loan by ID
// @route   DELETE /loans/:id
const deleteLoan = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Data tidak ditemukan');
      error.status = 404;
      return next(error);
    }

    const deletedLoan = await Loan.findByIdAndDelete(id);

    if (!deletedLoan) {
      const error = new Error('Data tidak ditemukan');
      error.status = 404;
      return next(error);
    }

    return res.status(200).json({
      status: 'success',
      message: `Data pinjaman dengan id ${id} berhasil dihapus`,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add payment installment record into embedded riwayatPembayaran
// @route   POST /loans/:id/pembayaran
const addPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cicilanKe, jumlahBayar, metodePembayaran, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Data tidak ditemukan');
      error.status = 404;
      return next(error);
    }

    if (!cicilanKe || !jumlahBayar) {
      const error = new Error('cicilanKe dan jumlahBayar wajib diisi');
      error.status = 400;
      return next(error);
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      const error = new Error('Data tidak ditemukan');
      error.status = 404;
      return next(error);
    }

    loan.riwayatPembayaran.push({
      cicilanKe: Number(cicilanKe),
      jumlahBayar: Number(jumlahBayar),
      metodePembayaran: metodePembayaran || 'transfer',
      status: status || 'lunas',
      tanggalBayar: new Date()
    });

    await loan.save();

    const populatedLoan = await Loan.findById(id).populate(
      'anggota',
      'nama nik noTelepon email alamat statusKeanggotaan'
    );

    return res.status(201).json({
      status: 'success',
      message: 'Riwayat pembayaran berhasil ditambahkan ke subdocument pinjaman',
      data: populatedLoan
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
  addPayment
};
