const mongoose = require('mongoose');
const Member = require('../models/memberModel');

// @desc    Get all members
// @route   GET /members
const getMembers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (status) {
      filter.statusKeanggotaan = status;
    }

    if (search) {
      filter.$or = [
        { nama: { $regex: search, $options: 'i' } },
        { nik: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await Member.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      total: members.length,
      data: members
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member by ID (with populated loans)
// @route   GET /members/:id
const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID anggota tidak valid');
      error.status = 400;
      return next(error);
    }

    const member = await Member.findById(id).populate('pinjaman');

    if (!member) {
      const error = new Error('Data anggota tidak ditemukan');
      error.status = 404;
      return next(error);
    }

    return res.status(200).json({
      status: 'success',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new member
// @route   POST /members
const createMember = async (req, res, next) => {
  try {
    const { nama, nik, noTelepon, email, alamat, statusKeanggotaan } = req.body;

    if (!nama || !nik || !noTelepon) {
      const error = new Error('Data tidak lengkap. nama, nik, dan noTelepon wajib diisi');
      error.status = 400;
      return next(error);
    }

    const existingNik = await Member.findOne({ nik });
    if (existingNik) {
      const error = new Error(`Anggota dengan NIK ${nik} sudah terdaftar`);
      error.status = 400;
      return next(error);
    }

    const member = await Member.create({
      nama,
      nik,
      noTelepon,
      email,
      alamat,
      statusKeanggotaan: statusKeanggotaan || 'aktif'
    });

    return res.status(201).json({
      status: 'success',
      message: 'Data anggota berhasil ditambahkan',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member
// @route   PUT /members/:id
const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID anggota tidak valid');
      error.status = 400;
      return next(error);
    }

    const { nama, nik, noTelepon, email, alamat, statusKeanggotaan } = req.body;

    if (!nama || !nik || !noTelepon) {
      const error = new Error('Data tidak lengkap. nama, nik, dan noTelepon wajib diisi');
      error.status = 400;
      return next(error);
    }

    const member = await Member.findByIdAndUpdate(
      id,
      { nama, nik, noTelepon, email, alamat, statusKeanggotaan },
      { new: true, runValidators: true }
    );

    if (!member) {
      const error = new Error('Data anggota tidak ditemukan');
      error.status = 404;
      return next(error);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Data anggota berhasil diperbarui',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete member
// @route   DELETE /members/:id
const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID anggota tidak valid');
      error.status = 400;
      return next(error);
    }

    const member = await Member.findByIdAndDelete(id);

    if (!member) {
      const error = new Error('Data anggota tidak ditemukan');
      error.status = 404;
      return next(error);
    }

    return res.status(200).json({
      status: 'success',
      message: `Data anggota dengan id ${id} berhasil dihapus`,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
};
