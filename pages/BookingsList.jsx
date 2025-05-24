import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Search, Calendar, Filter } from 'lucide-react';

export default function BookingsList() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedBookings = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate?.() || null,
            createdAt: data.createdAt?.toDate?.() || null,
            scannedAt: data.scannedAt?.toDate?.() || null
          };
        });
        
        setBookings(fetchedBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesDate = !dateFilter || (booking.date && 
      new Date(booking.date).toLocaleDateString() === new Date(dateFilter).toLocaleDateString());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'scanned' && booking.scanned) ||
      (statusFilter === 'pending' && !booking.scanned);

    return matchesSearch && matchesDate && matchesStatus;
  });

  const formatDateTime = (date) => {
    if (!date) return 'Not specified';
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-accent rounded-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Bookings</h1>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="relative">
                <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-card border border-border rounded-md"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-card border border-border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="scanned">Scanned</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-card animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{booking.fullName || 'No Name'}</h3>
                  <p className="text-muted-foreground text-sm">{booking.email || 'No Email'}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  booking.scanned 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {booking.scanned ? 'Scanned' : 'Pending'}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <p>📅 Created: {formatDateTime(booking.createdAt)}</p>
                {booking.date && <p>🕒 Booking for: {formatDateTime(booking.date)}</p>}
                {booking.guests && <p>👥 {booking.guests} guests</p>}
              </div>
              {booking.scannedAt && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Scanned at: {formatDateTime(booking.scannedAt)}
                </p>
              )}
            </div>
          ))}

          {filteredBookings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found.
            </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}