'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface AttendanceRecord {
  id: string;
  memberId: string;
  member?: { firstName: string; lastName: string };
  checkInTime: string;
  checkOutTime?: string;
  date: string;
  status: string;
}

export default function AttendancePage() {
  const { data: session } = useSession();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordingAttendance, setRecordingAttendance] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  const gymId = (session?.user as any)?.primaryGymId;

  useEffect(() => {
    if (gymId) {
      fetchAttendance();
      fetchMembers();
    }
  }, [gymId]);

  const fetchAttendance = async () => {
    try {
      const response = await fetch(
        `/api/attendance?type=daily&gymId=${gymId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAttendance(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/members?pageSize=100&gymId=${gymId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMembers(data.data.members);
        }
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const recordCheckIn = async () => {
    if (!selectedMemberId) return;

    setRecordingAttendance(true);
    try {
      const response = await fetch(`/api/attendance?gymId=${gymId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          checkInTime: new Date(),
          source: 'MANUAL',
        }),
      });

      if (response.ok) {
        setSelectedMemberId('');
        fetchAttendance();
      }
    } catch (error) {
      console.error('Failed to record attendance:', error);
    } finally {
      setRecordingAttendance(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading attendance...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Attendance</h1>
        <p className="text-gray-400">Manage member check-in and check-out</p>
      </div>

      {/* Quick Check-In */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Check-In</h2>
        <div className="flex gap-4">
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded"
          >
            <option value="">Select Member...</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.firstName} {member.lastName}
              </option>
            ))}
          </select>
          <button
            onClick={recordCheckIn}
            disabled={!selectedMemberId || recordingAttendance}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-semibold"
          >
            {recordingAttendance ? '⏳ Recording...' : '✅ Check In'}
          </button>
        </div>
      </div>

      {/* Today's Attendance */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            Today's Attendance ({attendance.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700 border-b border-slate-600">
                <th className="px-6 py-3 text-left text-gray-300">Member</th>
                <th className="px-6 py-3 text-left text-gray-300">Check In</th>
                <th className="px-6 py-3 text-left text-gray-300">Check Out</th>
                <th className="px-6 py-3 text-left text-gray-300">Duration</th>
                <th className="px-6 py-3 text-left text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                    No attendance records for today
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-700 hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4 text-white">
                      {record.member?.firstName} {record.member?.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {new Date(record.checkInTime).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {record.checkOutTime
                        ? new Date(record.checkOutTime).toLocaleTimeString()
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {record.checkOutTime
                        ? Math.round(
                            (new Date(record.checkOutTime).getTime() -
                              new Date(record.checkInTime).getTime()) /
                              60000
                          ) + ' min'
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
