import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, saveSettings } from '../lib/firebase';

export default function Settings() {
  const navigate = useNavigate();
  const [fields, setFields] = useState([
    { 
      id: 1, 
      name: 'fullName', 
      label: 'Full Name', 
      type: 'text', 
      required: true,
      validation: 'text',
      minLength: 2
    },
    { 
      id: 2, 
      label: 'Email', 
      name: 'email',
      type: 'email', 
      required: true,
      validation: 'email'
    },
    { 
      id: 3, 
      label: 'Phone', 
      name: 'phone',
      type: 'tel', 
      required: true,
      validation: 'phone',
      minLength: 10
    },
    { 
      id: 4, 
      label: 'Date & Time', 
      name: 'date',
      type: 'datetime-local', 
      required: true,
      validation: 'date'
    },
    { 
      id: 5, 
      label: 'Number of Guests', 
      name: 'guests',
      type: 'number', 
      required: true,
      validation: 'number',
      min: 1,
      max: 10
    }
  ]);

  const [systemSettings, setSystemSettings] = useState({
    maxBookingsPerSlot: 10,
    timeSlotDuration: 60, // in minutes
    advanceBookingDays: 30,
    emailNotifications: true
  });

  const [newField, setNewField] = useState({
    label: '',
    name: '',
    type: 'text',
    required: false,
    validation: 'text'
  });

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'form-settings');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setFields(data.fields || fields);
          setSystemSettings(data.systemSettings || systemSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
  
    loadSettings();
  }, []); // Empty dependency array means this runs once on mount

  const handleAddField = () => {
    if (newField.label && newField.name) {
      setFields([...fields, { ...newField, id: Date.now() }]);
      setNewField({
        label: '',
        name: '',
        type: 'text',
        required: false,
        validation: 'text'
      });
    }
  };

  const handleRemoveField = (id) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const handleSaveSettings = async () => {
    try {
      await saveSettings({
        fields,
        systemSettings,
        updatedAt: new Date().toISOString()
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
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
          <h1 className="text-xl font-bold">Settings</h1>
          <button
            onClick={handleSaveSettings}
            className="ml-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Fields Management */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Form Fields</h2>
              
              <div className="space-y-4">
                {fields.map((field) => (
                  <div key={field.id} className="flex items-start gap-4 p-4 bg-accent/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.label}</span>
                        {field.required && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Required</span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">Type: {field.type}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveField(field.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <h3 className="font-medium mb-4">Add New Field</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Label"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    className="px-3 py-2 bg-background border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Field Name"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    className="px-3 py-2 bg-background border rounded-md"
                  />
                  <select
                    value={newField.type}
                    onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                    className="px-3 py-2 bg-background border rounded-md"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="datetime-local">Date & Time</option>
                  </select>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        className="rounded border-primary"
                      />
                      Required
                    </label>
                    <button
                      onClick={handleAddField}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">System Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Maximum Bookings per Time Slot
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={systemSettings.maxBookingsPerSlot}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      maxBookingsPerSlot: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 bg-background border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Time Slot Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={systemSettings.timeSlotDuration}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      timeSlotDuration: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 bg-background border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Advance Booking Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={systemSettings.advanceBookingDays}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      advanceBookingDays: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 bg-background border rounded-md"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={systemSettings.emailNotifications}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        emailNotifications: e.target.checked
                      })}
                      className="rounded border-primary"
                    />
                    Enable Email Notifications
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}