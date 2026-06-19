const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { meetingValidation } = require('../middleware/validators');
const {
  scheduleMeeting,
  getMyMeetings,
  acceptMeeting,
  rejectMeeting,
  cancelMeeting
} = require('../controllers/meetingController');

router.post('/', auth, meetingValidation, validate, scheduleMeeting);
router.get('/', auth, getMyMeetings);
router.put('/:id/accept', auth, acceptMeeting);
router.put('/:id/reject', auth, rejectMeeting);
router.put('/:id/cancel', auth, cancelMeeting);

module.exports = router;