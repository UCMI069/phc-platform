import React, { useState, useEffect } from 'react';
import { neon as supabase } from '../../lib/neon';
import { 
  CreditCard, Users, FileText, Settings, 
  DollarSign, CheckCircle2, XCircle, Loader2, 
  Edit, Trash2, Plus, Eye, Save, X, 
  AlertCircle, CheckCircle2 as CheckCircle2Icon,
  ChevronDown, Search, Filter, MoreHorizontal
} from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('card-prices');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Card Prices
  const [cardPrices, setCardPrices] = useState([]);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceForm, setPriceForm] = useState({
    tier: '',
    name: '',
    price: '',
    description: '',
    colorScheme: '{}',
    benefits: ''
  });
  const [showPriceModal, setShowPriceModal] = useState(false);

  // Credit Card Requests
  const [cardRequests, setCardRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestSearch, setRequestSearch] = useState('');
  const [requestFilter, setRequestFilter] = useState('all');

  // KYC Requests
  const [kycRequests, setKycRequests] = useState([]);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycSearch, setKycSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [viewingKYC, setViewingKYC] = useState(null);

  useEffect(() => {
    fetchCardPrices();
    fetchCardRequests();
    fetchKYCRequests();
  }, []);

  const fetchCardPrices = async () => {
    try {
      const res = await fetch('/api/kyc/prices');
      const data = await res.json();
      if (data.prices) {
        setCardPrices(data.prices.map(p => ({
          ...p,
          price: Number(p.price),
          colorScheme: typeof p.color_scheme === 'string' ? JSON.parse(p.color_scheme) : p.color_scheme,
          benefits: p.benefits || []
        })))
      }
    } catch (err) {
      console.error('Failed to fetch card prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCardRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch('/api/kyc/admin/requests');
      const data = await res.json();
      if (data.requests) {
        setCardRequests(data.requests.map(r => ({
          ...r,
          requested_price: Number(r.requested_price),
          created_at: new Date(r.created_at)
        })))
      }
    } catch (err) {
      console.error('Failed to fetch card requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchKYCRequests = async () => {
    setKycLoading(true);
    try {
      const res = await fetch('/api/kyc/admin/kyc');
      const data = await res.json();
      if (data.requests) {
        setKycRequests(data.requests.map(r => ({
          ...r,
          created_at: new Date(r.created_at)
        })))
      }
    } catch (err) {
      console.error('Failed to fetch KYC requests:', err);
    } finally {
      setKycLoading(false);
    }
  };

  // Card Price Functions
  const handlePriceEdit = (price) => {
    setEditingPrice(price);
    setPriceForm({
      tier: price.tier,
      name: price.name,
      price: price.price,
      description: price.description || '',
      colorScheme: JSON.stringify(price.colorScheme || {}, null, 2),
      benefits: price.benefits?.join('\n') || ''
    });
    setShowPriceModal(true);
  };

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/kyc/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...priceForm,
          colorScheme: priceForm.colorScheme,
          benefits: priceForm.benefits.split('\n').filter(b => b.trim())
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save price');
      setShowPriceModal(false);
      fetchCardPrices();
      setSuccess('Card price saved successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPrice = () => {
    setEditingPrice(null);
    setPriceForm({
      tier: '',
      name: '',
      price: '',
      description: '',
      colorScheme: '{}',
      benefits: ''
    });
    setShowPriceModal(true);
  };

  // Card Request Actions
const handleCardRequestAction = async (requestId, action) => {
      const adminNote = prompt(`${action === 'approve' ? 'Approval' : 'Rejection'} note (optional):`) || '';
      if (adminNote === null) return; // User cancelled

      try {
        const res = await fetch('/api/kyc/requests/' + requestId + '/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action, admin_note: adminNote, admin_id: 'admin' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process decision');
      fetchCardRequests();
      setSuccess(`Credit card request ${action}d successfully`);
    } catch (err) {
      setError(err.message);
    }
  };

  // KYC Actions
const handleKYCAction = async (requestId, action) => {
      const adminNote = prompt(`${action === 'approve' ? 'Approval' : 'Rejection'} note (optional):`) || '';
      if (adminNote === null) return;

      try {
        const res = await fetch('/api/kyc/kyc/' + requestId + '/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action, admin_note: adminNote, admin_id: 'admin' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process decision');
      fetchKYCRequests();
      setSuccess(`KYC verification ${action}d successfully`);
    } catch (err) {
      setError(err.message);
    }
  };

  const viewKYCDocuments = (request) => {
    setViewingKYC(request);
  };

  const closeKYCView = () => {
    setViewingKYC(null);
  };

  // Filter functions
  const filteredCardRequests = cardRequests.filter(r => {
    if (requestFilter !== 'all' && r.status !== requestFilter) return false;
    if (requestSearch && !`${r.first_name} ${r.last_name} ${r.email} ${r.tier_name}`.toLowerCase().includes(requestSearch.toLowerCase())) return false;
    return true;
  });

  const filteredKYCRequests = kycRequests.filter(r => {
    if (kycFilter !== 'all' && r.status !== kycFilter) return false;
    if (kycSearch && !`${r.first_name} ${r.last_name} ${r.email}`.toLowerCase().includes(kycSearch.toLowerCase())) return false;
    return true;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#d97706', icon: <Loader2 size={12} className="spin" /> },
      approved: { bg: '#ecfdf5', color: '#059669', icon: <CheckCircle2Icon size={12} /> },
      rejected: { bg: '#fef2f2', color: '#ef4444', icon: <XCircle size={12} /> }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px', 
        padding: '4px 12px', 
        borderRadius: '20px', 
        fontSize: '12px', 
        fontWeight: 600, 
        background: style.bg, 
        color: style.color 
      }}>
        {style.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatColorScheme = (scheme) => {
    if (typeof scheme === 'string') return scheme;
    return JSON.stringify(scheme, null, 2);
  };

  if (loading) {
    return <div className="admin-loading">Loading Admin Panel...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="header-content">
          <h1>Admin Panel</h1>
          <p>Manage card prices, credit card requests, and KYC verifications</p>
        </div>
        {error && <div className="admin-alert error"><AlertCircle size={16} /> {error}</div>}
        {success && <div className="admin-alert success"><CheckCircle2Icon size={16} /> {success}</div>}
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'card-prices' ? 'active' : ''} 
          onClick={() => setActiveTab('card-prices')}
        >
          <DollarSign size={18} /> Card Prices
        </button>
        <button 
          className={activeTab === 'card-requests' ? 'active' : ''} 
          onClick={() => setActiveTab('card-requests')}
        >
          <CreditCard size={18} /> Card Requests
        </button>
        <button 
          className={activeTab === 'kyc-requests' ? 'active' : ''} 
          onClick={() => setActiveTab('kyc-requests')}
        >
          <FileText size={18} /> KYC Verification
        </button>
      </div>

      <div className="admin-content">
        {/* Card Prices Tab */}
        {activeTab === 'card-prices' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Credit Card Prices</h2>
              <button className="btn-primary" onClick={handleNewPrice}>
                <Plus size={16} /> Add/Edit Price
              </button>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Description</th>
                    <th>Color Scheme</th>
                    <th>Benefits</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cardPrices.map((price) => (
                    <tr key={price.tier}>
                      <td><span className="tier-badge">{price.tier.toUpperCase()}</span></td>
                      <td>{price.name}</td>
                      <td>${Number(price.price).toLocaleString()}</td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{price.description}</td>
                      <td>
                        <pre style={{ fontSize: '11px', maxWidth: '150px', overflow: 'auto' }}>{formatColorScheme(price.colorScheme)}</pre>
                      </td>
                      <td>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                          {price.benefits?.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      </td>
                      <td>
                        <button className="btn-icon" onClick={() => handlePriceEdit(price)} title="Edit">
                          <Edit size={16} />
                        </button>
                      </td>
</tr>
                    ))}
                  </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Credit Card Requests Tab */}
        {activeTab === 'card-requests' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Credit Card Requests</h2>
            </div>
            <div className="table-toolbar">
              <input 
                type="text" 
                placeholder="Search by name, email, or tier..." 
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                className="search-input"
                placeholder="Search..."
              />
              <select value={requestFilter} onChange={(e) => setRequestFilter(e.target.value)} className="filter-select">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Card Tier</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsLoading ? (
                    <tr><td colSpan={7} className="loading-cell">Loading requests...</td></tr>
                  ) : filteredCardRequests.length === 0 ? (
                    <tr><td colSpan={7} className="empty-cell">No requests found</td></tr>
                  ) : (
                    filteredCardRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">{req.first_name?.[0]}{req.last_name?.[0]}</div>
                            <span>{req.first_name} {req.last_name}</span>
                          </div>
                        </td>
                        <td>{req.email}</td>
                        <td><span className="tier-badge">{req.tier_name?.toUpperCase() || req.card_tier.toUpperCase()}</span></td>
                        <td>${Number(req.requested_price || req.tier_price).toLocaleString()}</td>
                        <td>{getStatusBadge(req.status)}</td>
                        <td>{formatDate(req.created_at)}</td>
                        <td>
                          {req.status === 'pending' && (
                            <div className="action-buttons">
                              <button className="btn-success btn-sm" onClick={() => handleCardRequestAction(req.id, 'approve')}>
                                <CheckCircle2Icon size={14} /> Approve
                              </button>
                              <button className="btn-danger btn-sm" onClick={() => handleCardRequestAction(req.id, 'reject')}>
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          )}
                          {req.status !== 'pending' && <span className="text-muted">Processed</span>}
                        </td>
</tr>
                    ))}
                  </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KYC Requests Tab */}
        {activeTab === 'kyc-requests' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>KYC Verification</h2>
            </div>
            <div className="table-toolbar">
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={kycSearch}
                onChange={(e) => setKycSearch(e.target.value)}
                className="search-input"
              />
              <select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)} className="filter-select">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Documents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycLoading ? (
                    <tr><td colSpan={6} className="loading-cell">Loading KYC requests...</td></tr>
                  ) : filteredKYCRequests.length === 0 ? (
                    <tr><td colSpan={6} className="empty-cell">No KYC requests found</td></tr>
                  ) : (
                    filteredKYCRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">{req.first_name?.[0]}{req.last_name?.[0]}</div>
                            <span>{req.first_name} {req.last_name}</span>
                          </div>
                        </td>
                        <td>{req.email}</td>
                        <td>
                          {req.status === 'pending' && (
                            <span className="status-badge pending"><Loader2 size={12} className="spin" /> Pending</span>
                          )}
                          {req.status === 'approved' && (
                            <span className="status-badge approved"><CheckCircle2Icon size={12} /> Approved</span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="status-badge rejected"><XCircle size={12} /> Rejected</span>
                          )}
                        </td>
                        <td>{formatDate(req.created_at)}</td>
                        <td>
                          <div className="doc-status">
                            {req.document_front_url && <span className="doc-badge">Front ✓</span>}
                            {req.document_back_url && <span className="doc-badge">Back ✓</span>}
                            {!req.document_front_url && <span className="doc-badge missing">Missing</span>}
                          </div>
                        </td>
                        <td>
                          <button className="btn-icon" onClick={() => viewKYCDocuments(req)} title="View Documents">
                            <Eye size={16} />
                          </button>
                          {req.status === 'pending' && (
                            <div className="action-buttons">
                              <button className="btn-success btn-sm" onClick={() => handleKYCAction(req.id, 'approve')}>
                                <CheckCircle2Icon size={14} /> Approve
                              </button>
                              <button className="btn-danger btn-sm" onClick={() => handleKYCAction(req.id, 'reject')}>
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPriceModal && (
        <div className="modal-overlay" onClick={() => setShowPriceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPrice ? 'Edit Card Price' : 'Add Card Price'}</h3>
              <button className="modal-close" onClick={() => setShowPriceModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handlePriceSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tier (starter/premium/master/gold)</label>
                  <input 
                    type="text" 
                    value={priceForm.tier} 
                    onChange={(e) => setPriceForm({...priceForm, tier: e.target.value})}
                    required
                    disabled={editingPrice}
                  />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    value={priceForm.name} 
                    onChange={(e) => setPriceForm({...priceForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input 
                    type="number" 
                    value={priceForm.price} 
                    onChange={(e) => setPriceForm({...priceForm, price: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    value={priceForm.description} 
                    onChange={(e) => setPriceForm({...priceForm, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Color Scheme (JSON)</label>
                  <textarea 
                    value={priceForm.colorScheme} 
                    onChange={(e) => setPriceForm({...priceForm, colorScheme: e.target.value})}
                    rows={4}
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  />
                </div>
                <div className="form-group">
                  <label>Benefits (one per line)</label>
                  <textarea 
                    value={priceForm.benefits} 
                    onChange={(e) => setPriceForm({...priceForm, benefits: e.target.value})}
                    rows={6}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowPriceModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KYC Document View Modal */}
      {viewingKYC && (
        <div className="modal-overlay large" onClick={closeKYCView}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>KYC Documents - {viewingKYC.first_name} {viewingKYC.last_name}</h3>
              <button className="modal-close" onClick={closeKYCView}><X size={20} /></button>
            </div>
            <div className="modal-body kyc-view">
              <div className="kyc-doc-grid">
                <div className="kyc-doc">
                  <h4>Front of ID</h4>
                  {viewingKYC.document_front_url ? (
                    <img src={viewingKYC.document_front_url} alt="Front" />
                  ) : (
                    <div className="no-doc">Not provided</div>
                  )}
                </div>
                <div className="kyc-doc">
                  <h4>Back of ID</h4>
                  {viewingKYC.document_back_url ? (
                    <img src={viewingKYC.document_back_url} alt="Back" />
                  ) : (
                    <div className="no-doc">Not provided</div>
                  )}
                </div>
              </div>
              {viewingKYC.admin_note && (
                <div className="admin-note">
                  <strong>Admin Note:</strong> {viewingKYC.admin_note}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeKYCView}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
