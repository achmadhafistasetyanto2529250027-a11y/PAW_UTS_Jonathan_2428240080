const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const cekApiKey = require('../middlewares/cekApiKey');

router.get('/', loanController.getLoans);
router.get('/:id', loanController.getLoanById);
router.post('/', cekApiKey, loanController.createLoan);
router.put('/:id', cekApiKey, loanController.updateLoan);
router.delete('/:id', cekApiKey, loanController.deleteLoan);
router.post('/:id/pembayaran', cekApiKey, loanController.addPayment);

module.exports = router;
