import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { checkIn, checkOut, getMyAttendance } from '@/api/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// A very minimal fallback attendance page: ONLY today, one button.
// Shows current check-in / check-out times and status. No date navigation.
export default function AttendanceSimplePage() {
  // Backend-connected simple page: select any date, one button
  const [status, setStatus] = useState(null); // { check_in, check_out, status }
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatYmd = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = formatYmd(selectedDate);

  const loadDay = async () => {
    setLoading(true);
    try {
      const res = await getMyAttendance({ from: selectedDateStr, to: selectedDateStr });
      setStatus(res?.days?.[0] || null);
    } catch (e) {
      console.error('Load attendance failed:', e);
      toast.error(e?.response?.data?.error || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDay(); }, [selectedDateStr]);

  const isCheckedIn = !!status?.check_in && !status?.check_out;
  const canCheckIn = !status?.check_in && status?.status !== 'leave';
  const canCheckOut = !!status?.check_in && !status?.check_out && status?.status !== 'leave';

  const handleToggle = async () => {
    if (working) return;
    setWorking(true);
    try {
      if (isCheckedIn) {
        await checkOut(selectedDateStr);
        toast.success('Checked out');
      } else {
        await checkIn(selectedDateStr);
        toast.success('Checked in');
      }
      await loadDay();
    } catch (e) {
      console.error('Toggle attendance failed:', e);
      toast.error(e?.response?.data?.error || 'Operation failed');
    } finally {
      setWorking(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Simple Attendance (Today)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Date:</span>
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-2 py-1 rounded border bg-background"
            />
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Check In</div>
              <div className="font-semibold">{formatTime(status?.check_in)}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Check Out</div>
              <div className="font-semibold">{formatTime(status?.check_out)}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Status</div>
              <div className="font-semibold">{status?.status || (status?.check_in ? (status?.check_out ? 'checked-out' : 'checked-in') : '-')}</div>
            </div>
          </div>

          <Button
            disabled={loading || working || (!canCheckIn && !canCheckOut)}
            onClick={handleToggle}
            className="min-w-[140px]"
          >
            {working ? (isCheckedIn ? 'Checking Out...' : 'Checking In...') : (isCheckedIn ? 'Check Out' : 'Check In')}
          </Button>

          {loading && <div className="text-xs text-muted-foreground">Loading...</div>}
        </CardContent>
      </Card>
    </div>
  );
}
