import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Scan, BookOpen, Settings, Users } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export default function AdminDashboard() {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    scannedBookings: 0,
    pendingBookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const bookingsRef = collection(db, 'bookings');
        
        // Get total bookings
        const totalSnapshot = await getDocs(bookingsRef);
        const total = totalSnapshot.size;

        // Get bookings for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayQuery = query(
          bookingsRef,
          where('createdAt', '>=', Timestamp.fromDate(today)),
          where('createdAt', '<', Timestamp.fromDate(tomorrow))
        );
        const todaySnapshot = await getDocs(todayQuery);
        const todayCount = todaySnapshot.size;

        // Get scanned bookings for today
        const scannedQuery = query(
          bookingsRef,
          where('scannedAt', '>=', Timestamp.fromDate(today)),
          where('scannedAt', '<', Timestamp.fromDate(tomorrow))
        );
        const scannedSnapshot = await getDocs(scannedQuery);
        const scannedCount = scannedSnapshot.size;

        // Get all pending (unscanned) bookings
        const pendingQuery = query(
          bookingsRef,
          where('scanned', '==', false)
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        const pendingCount = pendingSnapshot.size;

        setStats({
          totalBookings: total,
          todayBookings: todayCount,
          scannedBookings: scannedCount,
          pendingBookings: pendingCount
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    {
      title: 'Scanner',
      icon: <Scan className="w-6 h-6" />,
      path: '/admin/scanner',
      color: 'bg-emerald-500/10 text-emerald-500'
    },
    {
      title: 'Bookings',
      icon: <BookOpen className="w-6 h-6" />,
      path: '/admin/bookings',
      color: 'bg-blue-500/10 text-blue-500'
    },
    {
      title: 'Settings',
      icon: <Settings className="w-6 h-6" />,
      path: '/admin/settings',
      color: 'bg-purple-500/10 text-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">Cafe QR Admin</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-muted-foreground">{user?.email}</span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card p-6 rounded-lg border border-border animate-pulse">
                <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Total Bookings</h3>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.totalBookings}</p>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Today's Bookings</h3>
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.todayBookings}</p>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Scanned Today</h3>
                <Scan className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.scannedBookings}</p>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Pending</h3>
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.pendingBookings}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="p-6 bg-card border border-border rounded-lg text-center hover:bg-accent transition group"
            >
              <div className={`inline-flex items-center justify-center p-3 rounded-full ${item.color} mb-4 group-hover:scale-110 transition`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-medium">{item.title}</h3>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}