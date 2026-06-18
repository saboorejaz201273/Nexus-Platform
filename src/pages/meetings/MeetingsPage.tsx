import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getMyMeetings, acceptMeeting, rejectMeeting, cancelMeeting, scheduleMeeting, getAllUsers } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Meeting {
  _id: string;
  title: string;
  description: string;
  organizer: { _id: string; name: string; email: string; role: string };
  participant: { _id: string; name: string; email: string; role: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
}

interface UserOption {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  const [form, setForm] = useState({
    title: '',
    description: '',
    participant: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  const fetchMeetings = async () => {
    try {
      const res = await getMyMeetings();
      setMeetings(res.data);
    } catch (error) {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await acceptMeeting(id);
      toast.success('Meeting accepted');
      fetchMeetings();
    } catch (error) {
      toast.error('Failed to accept meeting');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMeeting(id);
      toast.success('Meeting rejected');
      fetchMeetings();
    } catch (error) {
      toast.error('Failed to reject meeting');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelMeeting(id);
      toast.success('Meeting cancelled');
      fetchMeetings();
    } catch (error) {
      toast.error('Failed to cancel meeting');
    }
  };

  const handleJoinCall = (meetingId: string) => {
    navigate(`/call/${meetingId}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.participant || !form.date || !form.startTime || !form.endTime) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await scheduleMeeting(form);
      toast.success('Meeting scheduled successfully!');
      setShowModal(false);
      setForm({
        title: '',
        description: '',
        participant: '',
        date: '',
        startTime: '',
        endTime: '',
        notes: ''
      });
      fetchMeetings();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to schedule meeting';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  // Convert meetings into calendar events
  const calendarEvents = useMemo(() => {
    return meetings
      .filter((m) => m.status !== 'rejected' && m.status !== 'cancelled')
      .map((m) => {
        const dateStr = m.date.split('T')[0]; // YYYY-MM-DD
        const start = new Date(`${dateStr}T${m.startTime}`);
        const end = new Date(`${dateStr}T${m.endTime}`);
        return {
          id: m._id,
          title: `${m.title} (${m.status})`,
          start,
          end,
          resource: m,
        };
      });
  }, [meetings]);

  const eventStyleGetter = (event: any) => {
    const status = event.resource.status;
    let backgroundColor = '#facc15'; // pending - yellow
    if (status === 'accepted') backgroundColor = '#22c55e'; // green

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        color: 'white',
        border: 'none',
        fontSize: '12px'
      }
    };
  };

  const handleSelectEvent = (event: any) => {
    const meeting = event.resource as Meeting;
    if (meeting.status === 'accepted') {
      handleJoinCall(meeting._id);
    } else {
      toast(`${meeting.title} - Status: ${meeting.status}`);
    }
  };

  if (loading) {
    return <div className="p-6">Loading meetings...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">My Meetings</h1>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                viewMode === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              📅 Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              📋 List
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            + Schedule Meeting
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-4 mb-3 text-sm">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> Pending
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Accepted (click to join call)
            </div>
          </div>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
            />
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        meetings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No meetings scheduled yet.
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => {
              const otherPerson =
                meeting.organizer._id === user?.id ? meeting.participant : meeting.organizer;
              const isParticipant = meeting.participant._id === user?.id;

              return (
                <div key={meeting._id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold">{meeting.title}</h2>
                      <p className="text-gray-600 text-sm">{meeting.description}</p>
                      <p className="text-sm mt-2">
                        With: <span className="font-medium">{otherPerson.name}</span> ({otherPerson.role})
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(meeting.date).toLocaleDateString()} | {meeting.startTime} - {meeting.endTime}
                      </p>
                      {meeting.notes && (
                        <p className="text-sm text-gray-500 mt-1">Note: {meeting.notes}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(meeting.status)}`}>
                      {meeting.status}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {meeting.status === 'pending' && isParticipant && (
                      <>
                        <button
                          onClick={() => handleAccept(meeting._id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(meeting._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {meeting.status === 'accepted' && (
                      <button
                        onClick={() => handleJoinCall(meeting._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        📹 Join Call
                      </button>
                    )}

                    {(meeting.status === 'pending' || meeting.status === 'accepted') && (
                      <button
                        onClick={() => handleCancel(meeting._id)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Schedule Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Schedule Meeting</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g. Investment Discussion"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={2}
                    placeholder="What is this meeting about?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meet With *</label>
                  <select
                    name="participant"
                    value={form.participant}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select person</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Scheduling...' : 'Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};