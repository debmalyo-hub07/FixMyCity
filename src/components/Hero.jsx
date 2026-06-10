import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, CheckCircle2, User, Shield, Phone, Key } from 'lucide-react';

export default function Hero({
  portal,
  setPortal,
  citizenMode,
  setCitizenMode,
  stats,
  authMessage,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  handleCitizenLogin,
  handleCitizenRegister,
  handleAdminLogin,
  resetAuthForms,
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <section className="hero-modern">
      <motion.div
        className="hero-copy-modern"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <span className="eyebrow-modern">Smart civic reporting</span>
        <h1>FixMyCity helps citizens report issues and follow every update.</h1>
        <p>
          Raise complaints with location, category, photos, and descriptions.
          Municipal admins can review, forward, and update progress in one place.
        </p>

        <div className="hero-actions-modern">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="primary-btn"
            onClick={() => {
              setPortal('citizen');
              resetAuthForms();
            }}
          >
            Report as Citizen
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="ghost-btn"
            onClick={() => {
              setPortal('admin');
              resetAuthForms();
            }}
          >
            Admin Dashboard
          </motion.button>
        </div>

        <motion.div
          className="hero-metrics-modern"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.article variants={itemVariants} className="metric-box">
            <div className="metric-icon bg-blue-soft text-blue">
              <FileText size={20} />
            </div>
            <div>
              <strong>{stats.total}</strong>
              <span>Total reported</span>
            </div>
          </motion.article>

          <motion.article variants={itemVariants} className="metric-box">
            <div className="metric-icon bg-warning-soft text-warning">
              <Clock size={20} />
            </div>
            <div>
              <strong>{stats.active}</strong>
              <span>Active issues</span>
            </div>
          </motion.article>

          <motion.article variants={itemVariants} className="metric-box">
            <div className="metric-icon bg-success-soft text-success">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <strong>{stats.resolved}</strong>
              <span>Resolved cases</span>
            </div>
          </motion.article>
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-panel-modern"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
      >
        <div className="portal-selector-tabs">
          <button
            type="button"
            className={`portal-tab ${portal === 'citizen' ? 'is-active' : ''}`}
            onClick={() => {
              setPortal('citizen');
              resetAuthForms();
            }}
          >
            <User size={15} style={{ marginRight: '6px' }} />
            Citizen
          </button>
          <button
            type="button"
            className={`portal-tab ${portal === 'admin' ? 'is-active' : ''}`}
            onClick={() => {
              setPortal('admin');
              resetAuthForms();
            }}
          >
            <Shield size={15} style={{ marginRight: '6px' }} />
            Admin
          </button>
        </div>

        <div className="auth-card-body">
          <AnimatePresence mode="wait">
            {portal === 'citizen' ? (
              <motion.div
                key="citizen-auth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="auth-shell-modern"
              >
                <div className="mode-toggle-pill">
                  <button
                    type="button"
                    className={`mode-btn ${citizenMode === 'login' ? 'is-active' : ''}`}
                    onClick={() => setCitizenMode('login')}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${citizenMode === 'register' ? 'is-active' : ''}`}
                    onClick={() => setCitizenMode('register')}
                  >
                    Register
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {citizenMode === 'login' ? (
                    <motion.form
                      key="citizen-login"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="auth-form-modern"
                      onSubmit={handleCitizenLogin}
                    >
                      <div className="form-title-group">
                        <h3>Citizen Portal Login</h3>
                        <p>Access your filed complaints and tracking history.</p>
                      </div>

                      <div className="input-group">
                        <label>Mobile Number</label>
                        <div className="input-wrapper">
                          <Phone size={16} className="input-icon" />
                          <input
                            required
                            type="text"
                            placeholder="Enter 10-digit number"
                            value={loginForm.phone}
                            onChange={(e) =>
                              setLoginForm((prev) => ({ ...prev, phone: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                          <Key size={16} className="input-icon" />
                          <input
                            required
                            type="password"
                            placeholder="••••••••"
                            value={loginForm.password}
                            onChange={(e) =>
                              setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        className="primary-btn full-width"
                      >
                        Log In
                      </motion.button>
                      
                      <div className="demo-credentials">
                        <strong>Demo:</strong> 9876543210 / citizen123
                      </div>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="citizen-register"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="auth-form-modern"
                      onSubmit={handleCitizenRegister}
                    >
                      <div className="form-title-group">
                        <h3>Create Citizen Account</h3>
                        <p>Register to submit complaints and receive updates.</p>
                      </div>

                      <div className="input-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                          <User size={16} className="input-icon" />
                          <input
                            required
                            type="text"
                            placeholder="John Doe"
                            value={registerForm.name}
                            onChange={(e) =>
                              setRegisterForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Mobile Number</label>
                        <div className="input-wrapper">
                          <Phone size={16} className="input-icon" />
                          <input
                            required
                            type="text"
                            placeholder="Enter 10-digit number"
                            value={registerForm.phone}
                            onChange={(e) =>
                              setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Aadhar Number</label>
                        <div className="input-wrapper">
                          <FileText size={16} className="input-icon" />
                          <input
                            required
                            type="text"
                            placeholder="12-digit UID"
                            value={registerForm.aadhar}
                            onChange={(e) =>
                              setRegisterForm((prev) => ({ ...prev, aadhar: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                          <Key size={16} className="input-icon" />
                          <input
                            required
                            type="password"
                            placeholder="Create password"
                            value={registerForm.password}
                            onChange={(e) =>
                              setRegisterForm((prev) => ({ ...prev, password: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        className="primary-btn full-width"
                      >
                        Register
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.form
                key="admin-auth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="auth-form-modern"
                onSubmit={handleAdminLogin}
              >
                <div className="form-title-group">
                  <h3>Admin Control Panel</h3>
                  <p>Access reviews, assignments, and resolution management.</p>
                </div>

                <div className="input-group">
                  <label>Admin ID</label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon" />
                    <input
                      required
                      type="text"
                      placeholder="admin@fixmycity"
                      value={loginForm.phone}
                      onChange={(e) =>
                        setLoginForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <Key size={16} className="input-icon" />
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="primary-btn full-width"
                >
                  Admin Access Login
                </motion.button>

                <div className="demo-credentials">
                  <strong>Demo:</strong> admin@fixmycity / admin123
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {authMessage && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="auth-error-banner"
            >
              <span>{authMessage}</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
