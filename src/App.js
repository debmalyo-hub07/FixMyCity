import { useEffect, useMemo, useState } from 'react';
import './App.css';

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

  function renderHero() {
    return (
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Smart civic reporting</span>
          <h1>FixMyCity helps citizens report issues and follow every update.</h1>
          <p>
            Raise complaints with location, category, photos, and description.
            Municipal admins can review, forward, and update progress in one place.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-btn" onClick={() => setPortal('citizen')}>
              Report as Citizen
            </button>
            <button type="button" className="ghost-btn" onClick={() => setPortal('admin')}>
              Admin Access
            </button>
          </div>
          <div className="hero-metrics">
            <article>
              <strong>{stats.total}</strong>
              <span>Total complaints</span>
            </article>
            <article>
              <strong>{stats.active}</strong>
              <span>Active issues</span>
            </article>
            <article>
              <strong>{stats.resolved}</strong>
              <span>Resolved cases</span>
            </article>
          </div>
        </div>

        <div className="hero-panel">
          <div className="portal-toggle">
            <button
              type="button"
              className={portal === 'admin' ? 'is-active' : ''}
              onClick={() => {
                setPortal('admin');
                resetAuthForms();
              }}
            >
              Admin
            </button>
            <button
              type="button"
              className={portal === 'citizen' ? 'is-active' : ''}
              onClick={() => {
                setPortal('citizen');
                resetAuthForms();
              }}
            >
              Citizen
            </button>
          </div>

          {portal === 'citizen' ? (
            <div className="auth-shell">
              <div className="mini-switch">
                <button
                  type="button"
                  className={citizenMode === 'login' ? 'is-active' : ''}
                  onClick={() => setCitizenMode('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={citizenMode === 'register' ? 'is-active' : ''}
                  onClick={() => setCitizenMode('register')}
                >
                  Register
                </button>
              </div>

              {citizenMode === 'login' ? (
                <form className="auth-form" onSubmit={handleCitizenLogin}>
                  <h2>Citizen login</h2>
                  <label>
                    Mobile number
                    <input
                      required
                      type="text"
                      value={loginForm.phone}
                      onChange={(event) =>
                        setLoginForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Password
                    <input
                      required
                      type="password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((current) => ({ ...current, password: event.target.value }))
                      }
                    />
                  </label>
                  <button type="submit" className="primary-btn full-width">
                    Login
                  </button>
                  <p className="helper-text">
                    Demo citizen: `9876543210` / `citizen123`
                  </p>
                </form>
              ) : (
                <form className="auth-form" onSubmit={handleCitizenRegister}>
                  <h2>Create citizen account</h2>
                  <label>
                    Full name
                    <input
                      required
                      type="text"
                      value={registerForm.name}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Mobile number
                    <input
                      required
                      type="text"
                      value={registerForm.phone}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Aadhar number
                    <input
                      required
                      type="text"
                      value={registerForm.aadhar}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, aadhar: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Password
                    <input
                      required
                      type="password"
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, password: event.target.value }))
                      }
                    />
                  </label>
                  <button type="submit" className="primary-btn full-width">
                    Register
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleAdminLogin}>
              <h2>Admin login</h2>
              <label>
                Admin ID
                <input
                  required
                  type="text"
                  value={loginForm.phone}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label>
                Password
                <input
                  required
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </label>
              <button type="submit" className="primary-btn full-width">
                Open Admin Panel
              </button>
              <p className="helper-text">Demo admin: `admin@fixmycity` / `admin123`</p>
            </form>
          )}

          {authMessage ? <p className="auth-message">{authMessage}</p> : null}
        </div>
      </section>
    );
  }

  function renderCitizenDashboard() {
    return (
      <section className="dashboard-grid">
        <div className="card dashboard-header citizen-header">
          <div>
            <span className="eyebrow">Citizen dashboard</span>
            <h2>Welcome back, {session.name}</h2>
            <p>Submit a new complaint, attach proof, and track each action taken by the city team.</p>
          </div>
          <button type="button" className="ghost-btn" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="stats-row">
          <article className="card stat-card">
            <strong>{currentCitizenComplaints.length}</strong>
            <span>Your complaints</span>
          </article>
          <article className="card stat-card">
            <strong>
              {currentCitizenComplaints.filter((item) => item.status !== 'Resolved').length}
            </strong>
            <span>Open cases</span>
          </article>
          <article className="card stat-card">
            <strong>
              {currentCitizenComplaints.filter((item) => item.status === 'Resolved').length}
            </strong>
            <span>Resolved</span>
          </article>
        </div>

        <div className="card complaint-form-card">
          <div className="section-heading">
            <h3>Add a new complaint</h3>
            <p>Provide clear details so the issue can be routed quickly.</p>
          </div>

          <form className="complaint-form" onSubmit={handleComplaintSubmit}>
            <label>
              Problem name
              <input
                required
                type="text"
                placeholder="Example: Broken drain beside bus stop"
                value={complaintForm.title}
                onChange={(event) =>
                  setComplaintForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>

            <label>
              Category
              <select
                value={complaintForm.type}
                onChange={(event) =>
                  setComplaintForm((current) => ({ ...current, type: event.target.value }))
                }
              >
                {complaintTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Exact location
              <input
                required
                type="text"
                placeholder="Street, landmark, ward, area"
                value={complaintForm.location}
                onChange={(event) =>
                  setComplaintForm((current) => ({ ...current, location: event.target.value }))
                }
              />
            </label>

            <label>
              Description
              <textarea
                required
                rows="4"
                placeholder="Explain what is happening, how long it has existed, and any risk."
                value={complaintForm.description}
                onChange={(event) =>
                  setComplaintForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>

            <label>
              Upload picture
              <input type="file" accept="image/*" onChange={handleComplaintImage} />
            </label>

            <button type="submit" className="primary-btn">
              Submit complaint
            </button>
          </form>
        </div>

        <div className="card complaints-list-card">
          <div className="section-heading">
            <h3>Track your complaints</h3>
            <p>Watch status updates from submission to resolution.</p>
          </div>

          <div className="complaints-list">
            {currentCitizenComplaints.length ? (
              currentCitizenComplaints.map((complaint) => (
                <article
                  key={complaint.id}
                  className={`complaint-item ${
                    selectedComplaintId === complaint.id ? 'is-selected' : ''
                  }`}
                  onClick={() => setSelectedComplaintId(complaint.id)}
                >
                  <div className="complaint-item-top">
                    <div>
                      <h4>{complaint.title}</h4>
                      <p>{complaint.location}</p>
                    </div>
                    <span className={`status-pill status-${complaint.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {complaint.status}
                    </span>
                  </div>
                  <p className="meta-line">
                    {complaint.type} . Updated {complaint.updatedAt}
                  </p>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <h4>No complaints yet</h4>
                <p>Your submitted issues will appear here with progress updates.</p>
              </div>
            )}
          </div>
        </div>

        <div className="card detail-card">
          {selectedComplaint ? (
            <>
              <div className="section-heading">
                <h3>Complaint details</h3>
                <p>{selectedComplaint.id}</p>
              </div>
              <img
                className="detail-image"
                src={selectedComplaint.image}
                alt={selectedComplaint.title}
              />
              <div className="detail-body">
                <h4>{selectedComplaint.title}</h4>
                <p>{selectedComplaint.description}</p>
                <div className="detail-meta">
                  <span>{selectedComplaint.type}</span>
                  <span>{selectedComplaint.location}</span>
                  <span>Forwarded to: {selectedComplaint.forwardedTo}</span>
                </div>
              </div>
              <div className="timeline">
                {selectedComplaint.updates.map((update, index) => (
                  <div key={`${update.at}-${index}`} className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <strong>{update.label}</strong>
                      <p>{update.note}</p>
                      <small>{update.at}</small>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h4>Select a complaint</h4>
              <p>Detailed status history will appear here.</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderAdminDashboard() {
    return (
      <section className="dashboard-grid">
        <div className="card dashboard-header admin-header">
          <div>
            <span className="eyebrow">Admin control center</span>
            <h2>All registered complaints</h2>
            <p>Review complaints, assign higher authority, and update citizens in real time.</p>
          </div>
          <button type="button" className="ghost-btn" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="stats-row">
          <article className="card stat-card">
            <strong>{stats.total}</strong>
            <span>Total complaints</span>
          </article>
          <article className="card stat-card">
            <strong>{stats.active}</strong>
            <span>Needs attention</span>
          </article>
          <article className="card stat-card">
            <strong>{stats.citizens}</strong>
            <span>Citizens served</span>
          </article>
        </div>

        <div className="admin-list">
          {complaints.map((complaint) => (
            <article key={complaint.id} className="card admin-complaint">
              <img src={complaint.image} alt={complaint.title} className="admin-complaint-image" />
              <div className="admin-complaint-body">
                <div className="admin-complaint-head">
                  <div>
                    <h3>{complaint.title}</h3>
                    <p>
                      {complaint.citizenName} . {complaint.citizenPhone}
                    </p>
                  </div>
                  <span className={`status-pill status-${complaint.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {complaint.status}
                  </span>
                </div>
                <div className="detail-meta">
                  <span>{complaint.type}</span>
                  <span>{complaint.location}</span>
                  <span>Forwarded to: {complaint.forwardedTo}</span>
                </div>
                <p>{complaint.description}</p>
                <div className="admin-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setSelectedComplaintId(complaint.id)}
                  >
                    View timeline
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() =>
                      handleStatusChange(complaint.id, 'In Review', 'Ward Office')
                    }
                  >
                    Mark In Review
                  </button>
                  <button
                    type="button"
                    className="ghost-btn solid-ghost"
                    onClick={() =>
                      handleStatusChange(
                        complaint.id,
                        'Forwarded',
                        authorityOptions[
                          complaint.id.charCodeAt(complaint.id.length - 1) %
                            authorityOptions.length
                        ]
                      )
                    }
                  >
                    Forward to Authority
                  </button>
                  <button
                    type="button"
                    className="success-btn"
                    onClick={() =>
                      handleStatusChange(complaint.id, 'Resolved', complaint.forwardedTo)
                    }
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="card detail-card">
          {selectedComplaint ? (
            <>
              <div className="section-heading">
                <h3>Selected complaint timeline</h3>
                <p>{selectedComplaint.id}</p>
              </div>
              <div className="timeline">
                {selectedComplaint.updates.map((update, index) => (
                  <div key={`${update.at}-${index}`} className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <strong>{update.label}</strong>
                      <p>{update.note}</p>
                      <small>{update.at}</small>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">FM</div>
          <div>
            <span>FixMyCity</span>
            <small>Citizen issue reporting system</small>
          </div>
        </div>

        <nav className="topbar-nav">
          <button type="button" className="nav-chip" onClick={() => setPortal('citizen')}>
            Citizen
          </button>
          <button type="button" className="nav-chip" onClick={() => setPortal('admin')}>
            Admin
          </button>
          {session ? (
            <span className="session-chip">
              {session.name} . {session.role}
            </span>
          ) : null}
        </nav>
      </header>

      <main className="page-content">
        {session?.role === 'citizen'
          ? renderCitizenDashboard()
          : session?.role === 'admin'
            ? renderAdminDashboard()
            : renderHero()}
      </main>
    </div>
  );
}

export default App;
