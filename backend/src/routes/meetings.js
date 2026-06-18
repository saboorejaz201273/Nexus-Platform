const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  scheduleMeeting,
  getMyMeetings,
  acceptMeeting,
  rejectMeeting,
  cancelMeeting
} = require('../controllers/meetingController');

router.post('/', auth, scheduleMeeting);
router.get('/', auth, getMyMeetings);
router.put('/:id/accept', auth, acceptMeeting);
router.put('/:id/reject', auth, rejectMeeting);
router.put('/:id/cancel', auth, cancelMeeting);

module.exports = router;