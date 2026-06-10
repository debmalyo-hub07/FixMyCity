import { useEffect, useMemo, useState } from 'react';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import CitizenDashboard from './components/CitizenDashboard';
import AdminDashboard from './components/AdminDashboard';

const STORAGE_KEYS = {
  users: 'fixmycity-users',
  complaints: 'fixmycity-complaints',
  session: 'fixmycity-session',
};

const complaintTypes = [
  'Road problem',
  'Potholes',
  'Drainage problem',
  'Others',
];

const authorityOptions = [
  'Municipal Engineering Department',
  'Road Maintenance Cell',
  'Drainage and Sanitation Department',
  'Ward Office',
];

const initialComplaints = [
  {
    id: 'CMP-2401',
    citizenName: 'Aarav Sen',
    citizenPhone: '9876543210',
    title: 'Large potholes near market road',
    type: 'Potholes',
    location: 'MG Road, near City Market Gate 2',
    description:
      'Two deep potholes are causing traffic jams and bike skids during evening hours.',
    status: 'In Review',
    forwardedTo: 'Road Maintenance Cell',
    updatedAt: '2026-06-08 10:30',
    createdAt: '2026-06-07 18:45',
    image:
      'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=900&q=80',
    updates: [
      { label: 'Submitted', note: 'Complaint registered by citizen.', at: '2026-06-07 18:45' },
      { label: 'In Review', note: 'Area inspection requested by admin.', at: '2026-06-08 10:30' },
    ],
  },
  {
    id: 'CMP-2402',
    citizenName: 'Diya Kapoor',
    citizenPhone: '9123456780',
    title: 'Overflowing roadside drain',
    type: 'Drainage problem',
    location: 'Lake View Colony, Block B',
    description:
      'Drain water is overflowing onto the road and creating a strong smell near the school entrance.',
    status: 'Forwarded',
    forwardedTo: 'Drainage and Sanitation Department',
    updatedAt: '2026-06-08 09:10',
    createdAt: '2026-06-06 14:20',
    image:
      'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=900&q=80',
    updates: [
      { label: 'Submitted', note: 'Complaint registered by citizen.', at: '2026-06-06 14:20' },
      { label: 'In Review', note: 'Ward office reviewed the complaint.', at: '2026-06-07 11:00' },
      {
        label: 'Forwarded',
        note: 'Issue forwarded to Drainage and Sanitation Department.',
        at: '2026-06-08 09:10',
      },
    ],
  },
];

const initialUsers = [
  {
    name: 'Aarav Sen',
    phone: '9876543210',
    aadhar: '123412341234',
    password: 'citizen123',
  },
  {
    name: 'Diya Kapoor',
    phone: '9123456780',
    aadhar: '987698769876',
    password: 'citizen123',
  },
];

const emptyComplaintForm = {
  title: '',
  type: complaintTypes[0],
  location: '',
  description: '',
  image: '',
};

function readStorage(key, fallback) {
  const stored = localStorage.getItem(key);
  if (!stored) {
    return fallback;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    return fallback;
  }
}

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getNowStamp() {
  return new Date().toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function App() {
  const [portal, setPortal] = useState('citizen');
  const [citizenMode, setCitizenMode] = useState('login');
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [session, setSession] = useState(null);
  const [authMessage, setAuthMessage] = useState('');
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    aadhar: '',
    password: '',
  });
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: '',
  });
  const [complaintForm, setComplaintForm] = useState(emptyComplaintForm);
  const [selectedComplaintId, setSelectedComplaintId] = useState('CMP-2401');

  useEffect(() => {
    const storedUsers = readStorage(STORAGE_KEYS.users, initialUsers);
    const storedComplaints = readStorage(STORAGE_KEYS.complaints, initialComplaints);
    const storedSession = readStorage(STORAGE_KEYS.session, null);

    setUsers(storedUsers);
    setComplaints(storedComplaints);
    setSession(storedSession);
    setSelectedComplaintId(storedComplaints[0]?.id || '');
  }, []);

  useEffect(() => {
    if (users.length) {
      persist(STORAGE_KEYS.users, users);
    }
  }, [users]);

  useEffect(() => {
    if (complaints.length) {
      persist(STORAGE_KEYS.complaints, complaints);
    }
  }, [complaints]);

  useEffect(() => {
    if (session) {
      persist(STORAGE_KEYS.session, session);
    } else {
      localStorage.removeItem(STORAGE_KEYS.session);
    }
  }, [session]);

  const currentCitizenComplaints = useMemo(() => {
    if (!session || session.role !== 'citizen') {
      return [];
    }

    return complaints.filter((complaint) => complaint.citizenPhone === session.phone);
  }, [complaints, session]);

  const selectedComplaint = useMemo(() => {
    return complaints.find((complaint) => complaint.id === selectedComplaintId) || complaints[0];
  }, [complaints, selectedComplaintId]);

  const stats = useMemo(() => {
    const citizenSet = new Set(complaints.map((complaint) => complaint.citizenPhone));

    return {
      total: complaints.length,
      active: complaints.filter((complaint) => complaint.status !== 'Resolved').length,
      resolved: complaints.filter((complaint) => complaint.status === 'Resolved').length,
      citizens: citizenSet.size,
    };
  }, [complaints]);

  const adminCredentials = {
    id: 'admin@fixmycity',
    password: 'admin123',
    name: 'City Admin',
  };

  function resetAuthForms() {
    setAuthMessage('');
    setLoginForm({ phone: '', password: '' });
    setRegisterForm({ name: '', phone: '', aadhar: '', password: '' });
  }

  function handleCitizenRegister(event) {
    event.preventDefault();

    const normalizedPhone = registerForm.phone.trim();
    const normalizedAadhar = registerForm.aadhar.trim();

    if (users.some((user) => user.phone === normalizedPhone)) {
      setAuthMessage('A citizen account with this mobile number already exists.');
      return;
    }

    const newUser = {
      name: registerForm.name.trim(),
      phone: normalizedPhone,
      aadhar: normalizedAadhar,
      password: registerForm.password,
    };

    const nextUsers = [...users, newUser];
    setUsers(nextUsers);
    setSession({ role: 'citizen', name: newUser.name, phone: newUser.phone });
    setCitizenMode('login');
    setAuthMessage('Citizen account created successfully.');
    setRegisterForm({ name: '', phone: '', aadhar: '', password: '' });
  }

  function handleCitizenLogin(event) {
    event.preventDefault();

    const matchingUser = users.find(
      (user) =>
        user.phone === loginForm.phone.trim() && user.password === loginForm.password
    );

    if (!matchingUser) {
      setAuthMessage('Invalid citizen mobile number or password.');
      return;
    }

    setSession({
      role: 'citizen',
      name: matchingUser.name,
      phone: matchingUser.phone,
    });
    setAuthMessage('');
  }

  function handleAdminLogin(event) {
    event.preventDefault();

    if (
      loginForm.phone.trim() !== adminCredentials.id ||
      loginForm.password !== adminCredentials.password
    ) {
      setAuthMessage('Invalid admin ID or password.');
      return;
    }

    setSession({
      role: 'admin',
      name: adminCredentials.name,
      phone: adminCredentials.id,
    });
    setAuthMessage('');
  }

  function handleComplaintImage(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setComplaintForm((current) => ({
        ...current,
        image: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleComplaintSubmit(event) {
    event.preventDefault();

    if (!session || session.role !== 'citizen') {
      return;
    }

    const createdAt = getNowStamp();
    const newComplaint = {
      id: `CMP-${Date.now().toString().slice(-6)}`,
      citizenName: session.name,
      citizenPhone: session.phone,
      title: complaintForm.title.trim(),
      type: complaintForm.type,
      location: complaintForm.location.trim(),
      description: complaintForm.description.trim(),
      image:
        complaintForm.image ||
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=80',
      status: 'Submitted',
      forwardedTo: 'Pending review',
      createdAt,
      updatedAt: createdAt,
      updates: [
        {
          label: 'Submitted',
          note: 'Complaint submitted by citizen.',
          at: createdAt,
        },
      ],
    };

    const nextComplaints = [newComplaint, ...complaints];
    setComplaints(nextComplaints);
    setSelectedComplaintId(newComplaint.id);
    setComplaintForm(emptyComplaintForm);
  }

  function handleStatusChange(complaintId, nextStatus, forwardedTo) {
    const stamp = getNowStamp();

    setComplaints((currentComplaints) =>
      currentComplaints.map((complaint) => {
        if (complaint.id !== complaintId) {
          return complaint;
        }

        return {
          ...complaint,
          status: nextStatus,
          forwardedTo,
          updatedAt: stamp,
          updates: [
            ...complaint.updates,
            {
              label: nextStatus,
              note:
                nextStatus === 'Forwarded'
                  ? `Complaint forwarded to ${forwardedTo}.`
                  : `Complaint marked as ${nextStatus.toLowerCase()}.`,
              at: stamp,
            },
          ],
        };
      })
    );
  }

  function logout() {
    setSession(null);
    resetAuthForms();
  }

  return (
    <div className="app-shell">
      <Header
        portal={portal}
        setPortal={setPortal}
        session={session}
        logout={logout}
      />

      <main className="page-content">
        {session?.role === 'citizen' ? (
          <CitizenDashboard
            session={session}
            logout={logout}
            currentCitizenComplaints={currentCitizenComplaints}
            selectedComplaintId={selectedComplaintId}
            setSelectedComplaintId={setSelectedComplaintId}
            selectedComplaint={selectedComplaint}
            complaintForm={complaintForm}
            setComplaintForm={setComplaintForm}
            complaintTypes={complaintTypes}
            handleComplaintImage={handleComplaintImage}
            handleComplaintSubmit={handleComplaintSubmit}
          />
        ) : session?.role === 'admin' ? (
          <AdminDashboard
            stats={stats}
            logout={logout}
            complaints={complaints}
            selectedComplaintId={selectedComplaintId}
            setSelectedComplaintId={setSelectedComplaintId}
            selectedComplaint={selectedComplaint}
            handleStatusChange={handleStatusChange}
            authorityOptions={authorityOptions}
          />
        ) : (
          <Hero
            portal={portal}
            setPortal={setPortal}
            citizenMode={citizenMode}
            setCitizenMode={setCitizenMode}
            stats={stats}
            authMessage={authMessage}
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            registerForm={registerForm}
            setRegisterForm={setRegisterForm}
            handleCitizenLogin={handleCitizenLogin}
            handleCitizenRegister={handleCitizenRegister}
            handleAdminLogin={handleAdminLogin}
            resetAuthForms={resetAuthForms}
          />
        )}
      </main>
    </div>
  );
}

export default App;
