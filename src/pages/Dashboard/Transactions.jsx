import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './Transactions.css';
import { ArrowUpRight, ArrowDownLeft, Search, Filter, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../assets/PHC-logo.png';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      if (!user) return;
      setLoading(true);

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // Fetch Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setTransactions(txData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.direction === filter;
    const matchesSearch = (tx.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add Logo (if possible)
    // Using a simpler approach: draw a purple rectangle for branding
    doc.setFillColor(66, 20, 95); // #42145f
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PHC', 14, 25);
    
    // Header Info
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text('Personal Banking Statement', 160, 15, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 22, { align: 'right' });
    doc.text(`Reference: PHC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 160, 29, { align: 'right' });

    // User Profile Information
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Holder:', 14, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${profile?.first_name} ${profile?.last_name}`, 14, 62);
    doc.text(`${profile?.email}`, 14, 68);
    if (profile?.country) doc.text(`${profile?.country}`, 14, 74);

    doc.setFont('helvetica', 'bold');
    doc.text('Account Details:', 140, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Currency: ${profile?.currency || 'GBP'}`, 140, 62);
    doc.text(`Status: Active`, 140, 68);
    
    // Define the table columns and rows
    const tableColumn = ["Date", "Description", "Status", "Type", "Amount"];
    const tableRows = [];

    let totalCredit = 0;
    let totalDebit = 0;

    filteredTransactions.forEach(tx => {
      const amount = parseFloat(tx.amount);
      if (tx.direction === 'credit') totalCredit += amount;
      else totalDebit += amount;

      const txData = [
        new Date(tx.created_at).toLocaleDateString('en-GB'),
        tx.description || 'Electronic Transfer',
        tx.status === 'posted' ? 'Completed' : (tx.status === 'pending' || tx.status === 'pending_transfer' ? 'Pending' : 'Failed'),
        tx.direction.charAt(0).toUpperCase() + tx.direction.slice(1),
        `${tx.direction === 'credit' ? '+' : '-'}${formatCurrency(tx.amount)}`
      ];
      tableRows.push(txData);
    });

    // Generate the table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 85,
      theme: 'grid',
      headStyles: { 
        fillColor: [66, 20, 95], 
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: { 
        fillColor: [250, 245, 255] 
      },
      margin: { top: 85 }
    });

    // Summary/Total Section
    const finalY = doc.lastAutoTable.finalY + 15;
    
    doc.setDrawColor(66, 20, 95);
    doc.setLineWidth(0.5);
    doc.line(120, finalY, 196, finalY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Statement Summary', 140, finalY + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Total Credits:', 140, finalY + 20);
    doc.setTextColor(0, 150, 0);
    doc.text(`+${formatCurrency(totalCredit)}`, 196, finalY + 20, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    doc.text('Total Debits:', 140, finalY + 28);
    doc.setTextColor(200, 0, 0);
    doc.text(`-${formatCurrency(totalDebit)}`, 196, finalY + 28, { align: 'right' });

    doc.setDrawColor(200, 200, 200);
    doc.line(140, finalY + 34, 196, finalY + 34);

    doc.setTextColor(66, 20, 95);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Net Balance:', 140, finalY + 42);
    doc.text(`${formatCurrency(totalCredit - totalDebit)}`, 196, finalY + 42, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('PHC Online Banking - Private & Confidential', 105, 285, { align: 'center' });
    doc.text('This is a computer-generated document and does not require a physical signature.', 105, 290, { align: 'center' });

    // Save the PDF
    doc.save(`PHC_Statement_${new Date().getTime()}.pdf`);
  };

  if (loading) return <div className="loading-spinner">Loading transactions...</div>;

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <div className="header-info">
          <h2>Transaction History</h2>
          <p>Monitor and manage your recent financial activities.</p>
        </div>
        <button className="download-btn" onClick={handleExportPDF}>
          <Download size={18} />
          <span>Export to PDF</span>
        </button>
      </div>

      <div className="transactions-filters">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <Filter size={18} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="credit">Credits (Income)</option>
              <option value="debit">Debits (Spending)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="transactions-table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Status</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx.id}>
                <td className="tx-date">
                  {new Date(tx.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td className="tx-desc">
                  <div className="desc-content">
                    <span className="tx-title">{tx.description || 'Electronic Transfer'}</span>
                    <span className="tx-id">ID: {tx.id.slice(0, 8)}</span>
                  </div>
                </td>
                <td>
                  <span className={`tx-status-badge ${tx.status === 'pending' || tx.status === 'pending_transfer' ? 'pending' : tx.status || 'posted'}`}>
                    {tx.status === 'posted' ? 'Completed' : 
                     tx.status === 'pending' || tx.status === 'pending_transfer' ? 'Pending' : 
                     tx.status === 'failed' ? 'Failed' : 'Completed'}
                  </span>
                </td>
                <td>
                  <span className={`tx-type-icon ${tx.direction}`}>
                    {tx.direction === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    {tx.direction === 'credit' ? 'Credit' : 'Debit'}
                  </span>
                </td>
                <td className={`tx-amount ${tx.direction}`}>
                  {tx.direction === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-table">No transactions found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
