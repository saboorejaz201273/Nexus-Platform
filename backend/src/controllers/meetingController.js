const Meeting = require('../models/Meeting');

// Schedule Meeting
exports.scheduleMeeting = async (req, res) => {
  try {
    const { title, description, participant, date, startTime, endTime, notes } = req.body;

    // Conflict detection
    const conflict = await Meeting.findOne({
      participant,
      date,
      status: { $ne: 'rejected' },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } }
      ]
    });

    if (conflict) {
      return res.status(400).json({ message: 'Time slot already booked!' });
    }

    const meeting = await Meeting.create({
      title, description,
      organizer: req.user.id,
      participant, date, startTime, endTime, notes
    });

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get My Meetings
exports.getMyMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { organizer: req.user.id },
        { participant: req.user.id }
      ]
    })
    .populate('organizer', 'name email role')
    .populate('participant', 'name email role')
    .sort({ date: 1 });

    res.status(200).json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept Meeting
exports.acceptMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted' },
      { new: true }
    );
    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject Meeting
exports.rejectMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel Meeting
exports.cancelMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};