import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  Timestamp 
} from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcMUyEV0kFi9tRVlpFCe8_yzXxl2JvAGE",
  authDomain: "acropolis-7b4a3.firebaseapp.com",
  projectId: "acropolis-7b4a3",
  storageBucket: "acropolis-7b4a3.firebasestorage.app",
  messagingSenderId: "91513595515",
  appId: "1:91513595515:web:cd9978a059a9bc671924de",
  measurementId: "G-5S5JERCS3S"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication functions
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

const convertToDate = (dateField) => {
    if (!dateField) return null;
    
    // If it's a Firebase Timestamp
    if (dateField?.toDate) {
      return dateField.toDate();
    }
    
    // If it's a date string or date object
    const dateObj = dateField instanceof Date ? dateField : new Date(dateField);
    return dateObj;
  };

// Settings functions
export const saveSettings = async (settings) => {
  try {
    const settingsRef = doc(db, 'settings', 'form-settings');
    await setDoc(settingsRef, {
      ...settings,
      lastUpdated: Timestamp.now()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

export const getFormFields = async () => {
  try {
    const settingsRef = doc(db, 'settings', 'form-settings');
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return settingsSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting form fields:', error);
    throw error;
  }
};

// Booking functions
export const createBooking = async (bookingData) => {
    try {
      const bookingsRef = collection(db, 'bookings');
      
      // Process the date field if it exists
      let processedDate = null;
      if (bookingData.date) {
        // If it's just a date without time, set it to start of day
        if (!bookingData.time) {
          const dateObj = new Date(bookingData.date);
          dateObj.setHours(0, 0, 0, 0);
          processedDate = Timestamp.fromDate(dateObj);
        } else {
          // If we have both date and time
          processedDate = Timestamp.fromDate(new Date(bookingData.date));
        }
      }
  
      // Add additional booking metadata
      const enrichedBookingData = {
        ...bookingData,
        createdAt: Timestamp.now(),
        status: 'active',
        scanned: false,
        scannedAt: null
      };
  
      // Only add date if it exists and is valid
      if (processedDate) {
        enrichedBookingData.date = processedDate;
      }
  
      const bookingRef = await addDoc(bookingsRef, enrichedBookingData);
      return bookingRef.id;
    } catch (error) {
      console.error('Booking creation error:', error);
      throw new Error(error.message || 'Failed to create booking');
    }
  };

export const getBookings = async (filters = {}) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    let q = bookingsRef;

    // Apply filters if provided
    if (filters.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);

      q = query(q, 
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );
    }

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      scannedAt: doc.data().scannedAt ? doc.data().scannedAt.toDate() : null
    }));
  } catch (error) {
    console.error('Error getting bookings:', error);
    throw error;
  }
};

export const verifyBooking = async (bookingId) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingDoc = await getDoc(bookingRef);
      
      if (!bookingDoc.exists()) {
        return { 
          valid: false, 
          message: 'Invalid booking ID' 
        };
      }
  
      const bookingData = bookingDoc.data();
      
      // Check if already scanned
      if (bookingData.scanned) {
        return { 
          valid: false, 
          message: 'This booking has already been scanned',
          data: {
            ...bookingData,
            date: convertToDate(bookingData.date),
            createdAt: convertToDate(bookingData.createdAt),
            scannedAt: convertToDate(bookingData.scannedAt)
          },
          scannedAt: convertToDate(bookingData.scannedAt)
        };
      }
  
      // Check if booking is for future date
      const bookingDate = convertToDate(bookingData.date);
      const now = new Date();
      
      if (bookingDate > now) {
        return {
          valid: false,
          message: 'This booking is for a future date',
          data: {
            ...bookingData,
            date: bookingDate,
            createdAt: convertToDate(bookingData.createdAt)
          }
        };
      }
  
      // Mark as scanned
      const scannedAt = Timestamp.now();
      await updateDoc(bookingRef, {
        scanned: true,
        scannedAt: scannedAt
      });
  
      return { 
        valid: true, 
        message: 'Valid booking verified successfully', 
        data: {
          ...bookingData,
          date: bookingDate,
          createdAt: convertToDate(bookingData.createdAt),
          scanned: true,
          scannedAt: scannedAt.toDate()
        }
      };
    } catch (error) {
      console.error('Error verifying booking:', error);
      throw error;
    }
  };

export const checkBookingAvailability = async (date) => {
  try {
    const settings = await getFormFields();
    const maxBookings = settings?.systemSettings?.maxBookingsPerSlot || 10;
    const slotDuration = settings?.systemSettings?.timeSlotDuration || 60;

    const bookingTime = new Date(date);
    const startOfSlot = new Date(bookingTime);
    const endOfSlot = new Date(bookingTime);
    endOfSlot.setMinutes(endOfSlot.getMinutes() + slotDuration);

    const bookingsRef = collection(db, 'bookings');
    const timeSlotQuery = query(
      bookingsRef,
      where('date', '>=', Timestamp.fromDate(startOfSlot)),
      where('date', '<', Timestamp.fromDate(endOfSlot))
    );

    const existingBookings = await getDocs(timeSlotQuery);
    
    return {
      available: existingBookings.size < maxBookings,
      currentBookings: existingBookings.size,
      maxBookings: maxBookings
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
};