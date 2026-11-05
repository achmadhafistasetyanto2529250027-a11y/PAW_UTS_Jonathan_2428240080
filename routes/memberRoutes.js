const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const cekApiKey = require('../middlewares/cekApiKey');

router.get('/', memberController.getMembers);
router.get('/:id', memberController.getMemberById);
router.post('/', cekApiKey, memberController.createMember);
router.put('/:id', cekApiKey, memberController.updateMember);
router.delete('/:id', cekApiKey, memberController.deleteMember);

module.exports = router;
