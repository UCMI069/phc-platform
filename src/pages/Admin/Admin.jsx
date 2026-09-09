import React, { useEffect, useState } from 'react';
import { neon as supabase } from '../../lib/neon';
import { useNotification } from '../../context/NotificationContext';
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  ShieldCheck, 
  Crown,
  Bell,
  Bitcoin,
  UserPlus, 
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Eye,
  Settings,
  ShieldAlert,
  Save,
  Clock,
  MessageCircle,
  Mail
} from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const { addNotification, confirm } = useNotification();
  const [profiles, setProfiles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [upgradePrices, setUpgradePrices] = useState({
    starter: 0,
    vip: 0,
    gold: 0,
    platinum: 0
  });
  const [upgradeDecisionDraft, setUpgradeDecisionDraft] = useState({});
  const [supportMessages, setSupportMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSupport, setSelectedSupport] = useState(null);
  const [supportResponse, setSupportResponse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editAccountType, setEditAccountType] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [pingTitle, setPingTitle] = useState('Admin Ping');
  const [pingMessage, setPingMessage] = useState('');
  const [cryptoDetails, setCryptoDetails] = useState([]);
  const [cryptoForm, setCryptoForm] = useState({
    id: null,
    currency: '',
    network: '',
    walletAddress: '',
    qrImageUrl: '',
    instructions: ''
  });
  const [cryptoUploading, setCryptoUploading] = useState(false);
  const [editBankDetails, setEditBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    sortCode: '',
    recipientName: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState('users'); // 'users', 'deposits', 'upgrades', 'crypto', 'transactions', 'support'
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingKYC: 0,
    pendingSupport: 0,
    pendingUpgrades: 0
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) return;

      const user = data.user;
      const { data: currentProfile, error: currentProfileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (currentProfileError || !currentProfile?.is_admin) {
        console.error('Admin check failed:', currentProfileError);
        addNotification('Access Denied: You do not have admin privileges.', 'error');
        setLoading(false);
        return;
      }

      // Fetch Profiles
      const { data: allProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        addNotification('Error fetching users: ' + profileError.message, 'error');
      }
      
      const profilesList = allProfiles || [];
      setProfiles(profilesList);

      // Fetch Accounts separately
      const { data: allAccounts } = await supabase
        .from('accounts')
        .select('*');

      // Attach accounts to profiles
      const accountsByUser = {};
      (allAccounts || []).forEach(acc => {
        if (!accountsByUser[acc.user_id]) accountsByUser[acc.user_id] = [];
        accountsByUser[acc.user_id].push(acc);
      });
      const profilesListWithAccounts = profilesList.map(p => ({
        ...p,
        accounts: accountsByUser[p.id] || [],
      }));
      setProfiles(profilesListWithAccounts);

      // Fetch All Transactions
      const { data: allTxs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (txError) console.error('Transaction fetch error:', txError);
      
      // Fetch profiles for transaction user IDs
      const txUserIds = [...new Set((allTxs || []).map(tx => tx.user_id).filter(Boolean))];
      let txProfiles = [];
      if (txUserIds.length > 0) {
        const { data } = await supabase.from('profiles').select('*').in('id', txUserIds);
        txProfiles = data || [];
      }
      const txProfileMap = {};
      txProfiles.forEach(p => { txProfileMap[p.id] = p; });
      
      const txsWithProfiles = (allTxs || []).map(tx => ({
        ...tx,
        profiles: txProfileMap[tx.user_id] || null,
      }));
      setTransactions(txsWithProfiles);
      setPendingActions(txsWithProfiles.filter(tx => tx.status === 'pending' || tx.status === 'pending_transfer'));

      // Fetch All Support Messages
      const { data: allSupport, error: supportError } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (supportError) console.error('Support fetch error:', supportError);
      
      // Fetch profiles for support message user IDs
      const supUserIds = [...new Set((allSupport || []).map(m => m.user_id).filter(Boolean))];
      let supProfiles = [];
      if (supUserIds.length > 0) {
        const { data } = await supabase.from('profiles').select('*').in('id', supUserIds);
        supProfiles = data || [];
      }
      const supProfileMap = {};
      supProfiles.forEach(p => { supProfileMap[p.id] = p; });
      
      const supportWithProfiles = (allSupport || []).map(m => ({
        ...m,
        profiles: supProfileMap[m.user_id] || null,
      }));
      setSupportMessages(supportWithProfiles);

      // Fetch Upgrade Prices
      const { data: priceRows, error: priceError } = await supabase
        .from('account_upgrade_prices')
        .select('tier, price');

      if (!priceError) {
        const nextPrices = { starter: 0, vip: 0, gold: 0, platinum: 0 };
        (priceRows || []).forEach((r) => {
          const k = String(r.tier || '').toLowerCase();
          nextPrices[k] = r.price ?? 0;
        });
        setUpgradePrices(nextPrices);
      }

      // Fetch Upgrade Requests
      const { data: reqRows, error: reqError } = await supabase
        .from('account_upgrade_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!reqError) {
        // Fetch profiles for request user IDs
        const reqUserIds = [...new Set((reqRows || []).map(r => r.user_id).filter(Boolean))];
        let reqProfiles = [];
        if (reqUserIds.length > 0) {
          const { data } = await supabase.from('profiles').select('*').in('id', reqUserIds);
          reqProfiles = data || [];
        }
        const reqProfileMap = {};
        reqProfiles.forEach(p => { reqProfileMap[p.id] = p; });
        
        const reqsWithProfiles = (reqRows || []).map(r => ({
          ...r,
          profiles: reqProfileMap[r.user_id] || null,
        }));
        setUpgradeRequests(reqsWithProfiles);
      }

      // Fetch Crypto Deposit Details
      const { data: cryptoRows, error: cryptoError } = await supabase
        .from('crypto_deposit_details')
        .select('*')
        .order('currency', { ascending: true });

      if (!cryptoError) {
        setCryptoDetails(cryptoRows || []);
      }

      // Calculate Stats
      const totalUsers = allProfiles?.length || 0;
      const txList = allTxs || [];
      const deposits = txList.filter(t => t.direction === 'credit' && t.status === 'posted').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0) || 0;
      const withdrawals = txList.filter(t => t.direction === 'debit' && t.status === 'posted').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0) || 0;

      setStats({
        totalUsers,
        totalDeposits: deposits,
        totalWithdrawals: withdrawals,
        pendingKYC: txList.filter(tx => tx.status === 'pending_admin').length || 0,
        pendingSupport: allSupport?.filter(s => s.status === 'pending').length || 0,
        pendingUpgrades: (reqRows || []).filter((r) => r.status === 'pending').length || 0
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccountDetails = async (userId, accountId) => {
    if (!editBalance && !editAccountType && !editBankDetails.bankName) return;
    setSubmitting(true);
    try {
      const newBalance = parseFloat(editBalance);
      const currentBalance = parseFloat(selectedUser.accounts?.[0]?.balance) || 0;
      const currentType = selectedUser.accounts?.[0]?.type || '';
      const difference = newBalance - currentBalance;

      // Update account details
      const updates = { 
        balance: newBalance,
        type: editAccountType
      };
      
      const { error: updateError } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', accountId);

      if (updateError) throw updateError;

      // Update bank deposit details in profile
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          deposit_bank_name: editBankDetails.bankName,
          deposit_account_number: editBankDetails.accountNumber,
          deposit_sort_code: editBankDetails.sortCode,
          deposit_recipient_name: editBankDetails.recipientName
        })
        .eq('id', userId);

      if (profileUpdateError) throw profileUpdateError;

      // Create transaction and notification if balance changed
      if (difference !== 0) {
        const direction = difference > 0 ? 'credit' : 'debit';
        const description = direction === 'credit' ? 'Credit' : 'Debit';
        const absAmount = Math.abs(difference);

        // Create Transaction
        await supabase.from('transactions').insert({
          user_id: userId,
          account_id: accountId,
          amount: absAmount,
          direction: direction,
          description: description,
          status: 'posted'
        });

        // Create Notification
        await supabase.from('notifications').insert({
          user_id: userId,
          title: description,
          message: `Your account has been ${direction === 'credit' ? 'credited with' : 'debited by'} ${formatCurrency(absAmount, selectedUser.currency)}.`,
          type: direction === 'credit' ? 'deposit' : 'debit'
        });
      }

      // Notification for account type change if it changed
      if (editAccountType !== currentType) {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Account Update',
          message: `Your account type has been updated to ${editAccountType.toUpperCase()}.`,
          type: 'info'
        });
      }

      addNotification('Account updated successfully', 'success');
      fetchAdminData();
      setSelectedUser(null);
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageTransaction = async (txId, newStatus) => {
    setSubmitting(true);
    try {
      const tx = transactions.find(t => t.id === txId);
      
      // LOGIC FOR APPROVAL (Credit Balance for Deposits, just mark as posted for Transfers since they were deducted at source)
      if (newStatus === 'posted') {
        if (tx.status === 'pending_admin' && tx.direction === 'credit') {
          // It's a deposit: add to balance
          const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.account_id).single();
          await supabase.from('accounts').update({ balance: (parseFloat(acc?.balance) || 0) + parseFloat(tx.amount) }).eq('id', tx.account_id);
        }
        // If it's a transfer (debit), the balance was already deducted in Transfer.jsx
      }

      // LOGIC FOR REJECTION (Refund balance for Transfers)
      if (newStatus === 'failed' && tx.status === 'pending_transfer' && tx.direction === 'debit') {
        // Refund the amount to the user's account
        const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.account_id).single();
        await supabase.from('accounts').update({ balance: (parseFloat(acc?.balance) || 0) + parseFloat(tx.amount) }).eq('id', tx.account_id);
      }
      
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', txId);

      if (error) throw error;

      // Add notification for the user
      const isTransfer = tx.status === 'pending_transfer';
      const isLoan = tx.description?.toLowerCase().includes('loan');
      const typeLabel = isTransfer ? 'Transfer' : (isLoan ? 'Loan' : 'Deposit');
      
      const title = newStatus === 'posted' ? `${typeLabel} Approved` : `${typeLabel} Declined`;
      let message = '';
      
      if (isTransfer) {
        message = newStatus === 'posted' 
          ? `Your transfer of ${formatCurrency(tx.amount, 'GBP')} to ${tx.recipient_name} has been processed successfully.`
          : `Your transfer of ${formatCurrency(tx.amount, 'GBP')} to ${tx.recipient_name} was declined. The funds have been returned to your account.`;
      } else {
        message = newStatus === 'posted' 
          ? `Your ${typeLabel.toLowerCase()} of ${formatCurrency(tx.amount, 'GBP')} has been approved and credited to your account.`
          : `Your ${typeLabel.toLowerCase()} of ${formatCurrency(tx.amount, 'GBP')} has been declined. Please contact support for more information.`;
      }

      await supabase.from('notifications').insert({
        user_id: tx.user_id,
        title: title,
        message: message,
        type: newStatus === 'posted' ? 'deposit' : 'error'
      });

      addNotification(`${typeLabel} ${newStatus === 'posted' ? 'Approved' : 'Declined'} successfully`, 'success');
      fetchAdminData();
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBlock = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ blocked: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Account Status',
        message: !currentStatus
          ? 'Your account has been locked by an administrator. Please contact support.'
          : 'Your account lock has been removed. You can now access your account.',
        type: 'alert'
      });
      addNotification(`User ${currentStatus ? 'unblocked' : 'blocked'} successfully`, 'success');
      fetchAdminData();
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  const handleToggleInactive = async (userId, currentInactive) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_inactive: !currentInactive })
        .eq('id', userId);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Account Status',
        message: !currentInactive
          ? 'Your account has been set to INACTIVE. You can sign in, but transactions and requests are disabled.'
          : 'Your account is ACTIVE again. You can now use all features.',
        type: 'alert'
      });

      addNotification(`User marked as ${currentInactive ? 'active' : 'inactive'} successfully`, 'success');
      fetchAdminData();
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  const handleSendPing = async (userId) => {
    if (!pingMessage) {
      addNotification('Ping message is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        title: pingTitle || 'Admin Ping',
        message: pingMessage,
        type: 'ping'
      });

      if (error) throw error;
      addNotification('Ping sent successfully', 'success');
      setPingMessage('');
      fetchAdminData();
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyAdjustment = async (userId, accountId, direction) => {
    const amount = parseFloat(adjustAmount);
    if (!amount || amount <= 0) {
      addNotification('Enter a valid amount greater than 0.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data: acc, error: accError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', accountId)
        .single();

      if (accError) throw accError;

      const currentBalance = Number(acc?.balance || 0);
      const nextBalance = direction === 'credit' ? currentBalance + amount : currentBalance - amount;

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: nextBalance })
        .eq('id', accountId);

      if (updateError) throw updateError;

      const description = adjustDescription || (direction === 'credit' ? 'Admin Credit' : 'Admin Debit');

      await supabase.from('transactions').insert({
        user_id: userId,
        account_id: accountId,
        amount,
        direction,
        description,
        status: 'posted'
      });

      await supabase.from('notifications').insert({
        user_id: userId,
        title: direction === 'credit' ? 'Account Credited' : 'Account Debited',
        message: `Your account has been ${direction === 'credit' ? 'credited with' : 'debited by'} ${formatCurrency(amount, selectedUser?.currency)}.${description ? ` (${description})` : ''}`,
        type: direction === 'credit' ? 'deposit' : 'debit'
      });

      addNotification(`${direction === 'credit' ? 'Credit' : 'Debit'} applied successfully`, 'success');
      setAdjustAmount('');
      setAdjustDescription('');
      fetchAdminData();
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveUpgradePrices = async () => {
    setSubmitting(true);
    try {
      const rows = Object.entries(upgradePrices).map(([tier, price]) => ({
        tier,
        price: parseFloat(price) || 0
      }));

      const { error } = await supabase
        .from('account_upgrade_prices')
        .upsert(rows, { onConflict: 'tier' });

      if (error) throw error;
      addNotification('Upgrade prices saved', 'success');
      fetchAdminData();
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecideUpgrade = async (req, decision) => {
    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const adminUser = authData?.user;
      if (!adminUser) throw new Error('Not authenticated');

      const draft = upgradeDecisionDraft[req.id] || {};
      const approvedPrice = draft.price !== undefined && draft.price !== '' ? parseFloat(draft.price) : (req.requested_price ?? null);
      const adminNote = draft.note || null;

      const nextStatus = decision === 'approve' ? 'approved' : 'denied';

      const { error: updateReqError } = await supabase
        .from('account_upgrade_requests')
        .update({
          status: nextStatus,
          approved_price: decision === 'approve' ? approvedPrice : null,
          admin_note: adminNote,
          admin_id: adminUser.id,
          decided_at: new Date().toISOString()
        })
        .eq('id', req.id);

      if (updateReqError) throw updateReqError;

      if (decision === 'approve') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ account_level: String(req.requested_tier || '').toLowerCase() })
          .eq('id', req.user_id);

        if (profileError) throw profileError;
      }

      await supabase.from('notifications').insert({
        user_id: req.user_id,
        title: decision === 'approve' ? 'Upgrade Approved' : 'Upgrade Declined',
        message: decision === 'approve'
          ? `Your request to upgrade to ${String(req.requested_tier).toUpperCase()} has been approved.`
          : `Your request to upgrade to ${String(req.requested_tier).toUpperCase()} has been declined.${adminNote ? ` Note: ${adminNote}` : ''}`,
        type: 'upgrade'
      });

      addNotification(`Upgrade ${decision === 'approve' ? 'approved' : 'declined'} successfully`, 'success');
      fetchAdminData();
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCryptoForm = () => {
    setCryptoForm({
      id: null,
      currency: '',
      network: '',
      walletAddress: '',
      qrImageUrl: '',
      instructions: ''
    });
  };

  const handleCryptoQrUpload = async (file) => {
    if (!file) return;
    setCryptoUploading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `crypto-qr-${Date.now()}-${Math.random().toString(16).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('cryptoqr')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('cryptoqr')
        .getPublicUrl(fileName);

      setCryptoForm((prev) => ({ ...prev, qrImageUrl: publicData.publicUrl }));
      addNotification('QR code uploaded. Save crypto details to apply.', 'success');
    } catch (err) {
      addNotification(
        err.message || "Failed to upload QR image. Ensure the cryptoqr storage bucket exists and is Public.",
        'error'
      );
    } finally {
      setCryptoUploading(false);
    }
  };

  const handleSaveCryptoDetails = async () => {
    const currency = String(cryptoForm.currency || '').trim();
    const walletAddress = String(cryptoForm.walletAddress || '').trim();

    if (!currency || !walletAddress) {
      addNotification('Currency and wallet address are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        currency,
        network: cryptoForm.network ? String(cryptoForm.network).trim() : null,
        wallet_address: walletAddress,
        qr_image_url: cryptoForm.qrImageUrl ? String(cryptoForm.qrImageUrl).trim() : null,
        instructions: cryptoForm.instructions ? String(cryptoForm.instructions).trim() : null,
        updated_at: new Date().toISOString()
      };

      const { error } = cryptoForm.id
        ? await supabase.from('crypto_deposit_details').update(payload).eq('id', cryptoForm.id)
        : await supabase.from('crypto_deposit_details').insert(payload);

      if (error) throw error;

      addNotification('Crypto deposit details saved.', 'success');
      resetCryptoForm();
      fetchAdminData();
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCryptoDetails = (row) => {
    setCryptoForm({
      id: row.id,
      currency: row.currency || '',
      network: row.network || '',
      walletAddress: row.wallet_address || '',
      qrImageUrl: row.qr_image_url || '',
      instructions: row.instructions || ''
    });
  };

  const handleDeleteCryptoDetails = async (row) => {
    const confirmed = await confirm({
      title: 'Delete Crypto Details',
      message: `Delete ${String(row.currency || '').toUpperCase()} ${row.network ? `(${row.network})` : ''} deposit details?`,
      confirmText: 'Delete',
      danger: true
    });

    if (!confirmed) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('crypto_deposit_details').delete().eq('id', row.id);
      if (error) throw error;
      addNotification('Crypto details deleted.', 'success');
      resetCryptoForm();
      fetchAdminData();
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAdmin = async (userId, currentAdminStatus) => {
    const action = currentAdminStatus ? 'demote' : 'promote';
    const confirmed = await confirm({
      title: `${action.toUpperCase()} User`,
      message: `Are you sure you want to ${action} this user?`,
      confirmText: action.toUpperCase(),
      danger: currentAdminStatus
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentAdminStatus })
        .eq('id', userId);

      if (error) throw error;
      addNotification(`User ${action}d successfully`, 'success');
      fetchAdminData();
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = await confirm({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This will remove all their data permanently.',
      confirmText: 'Delete Permanently',
      danger: true
    });

    if (!confirmed) return;
    
    setSubmitting(true);
    try {
      // Delete related data first, then user
      await supabase.from('transactions').delete().eq('user_id', userId);
      await supabase.from('notifications').delete().eq('user_id', userId);
      await supabase.from('support_messages').delete().eq('user_id', userId);
      await supabase.from('accounts').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) throw error;
      addNotification('User deleted successfully', 'success');
      fetchAdminData();
    } catch (err) {
      addNotification('Error deleting user: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateIncomingDeposit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userId = formData.get('userId');
    const amount = formData.get('amount');
    const description = formData.get('description');

    try {
      const { data: acc } = await supabase.from('accounts').select('id').eq('user_id', userId).single();
      if (!acc) throw new Error("User has no active account");

      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        account_id: acc.id,
        amount: parseFloat(amount),
        direction: 'credit',
        description: description || 'Incoming Transfer',
        status: 'pending'
      });

      if (error) throw error;

      // Update account balance
      const { data: currentAcc } = await supabase.from('accounts').select('balance').eq('id', acc.id).single();
      const newBalance = (parseFloat(currentAcc?.balance) || 0) + parseFloat(amount);
      await supabase.from('accounts').update({ balance: newBalance }).eq('id', acc.id);

      addNotification('Incoming deposit created. User will see it as "Pending".', 'success');
      fetchAdminData();
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  const handleResolveSupport = async () => {
    if (!supportResponse) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({
          status: 'resolved',
          admin_response: supportResponse,
          resolved_at: new Date().toISOString()
        })
        .eq('id', selectedSupport.id);

      if (error) throw error;

      // Notify the user
      await supabase.from('notifications').insert({
        user_id: selectedSupport.user_id,
        title: 'Support Message Resolved',
        message: `Your inquiry about "${selectedSupport.subject}" has been resolved. Response: ${supportResponse}`,
        type: 'alert'
      });

      addNotification('Support message resolved and user notified', 'success');
      fetchAdminData();
      setSelectedSupport(null);
      setSupportResponse('');
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount, userCurrency = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: userCurrency,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  };

  if (loading) return <div className="loading-spinner">Loading admin panel...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-info">
          <h2>Admin Management</h2>
          <p>Global oversight and management of all banking operations.</p>
        </div>
        <div className="admin-nav-tabs">
          <button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}>
            <Users size={16} /> Users
          </button>
          <button className={view === 'deposits' ? 'active' : ''} onClick={() => setView('deposits')}>
            <ArrowDownLeft size={16} /> Pending {pendingActions.length > 0 && <span className="badge">{pendingActions.length}</span>}
          </button>
          <button className={view === 'upgrades' ? 'active' : ''} onClick={() => setView('upgrades')}>
            <Crown size={16} /> Upgrades {stats.pendingUpgrades > 0 && <span className="badge">{stats.pendingUpgrades}</span>}
          </button>
          <button className={view === 'crypto' ? 'active' : ''} onClick={() => setView('crypto')}>
            <Bitcoin size={16} /> Crypto
          </button>
          <button className={view === 'transactions' ? 'active' : ''} onClick={() => setView('transactions')}>
            <Clock size={16} /> History
          </button>
          <button className={view === 'support' ? 'active' : ''} onClick={() => setView('support')}>
            <MessageCircle size={16} /> Support {stats.pendingSupport > 0 && <span className="badge">{stats.pendingSupport}</span>}
          </button>
        </div>
      </div>

      {/* Admin Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon users"><Users size={20} /></div>
          <div className="stat-info">
            <h3>Active Users</h3>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon deposits"><ArrowDownLeft size={20} /></div>
          <div className="stat-info">
            <h3>Net Deposits</h3>
            <div className="stat-value">{formatCurrency(stats.totalDeposits, 'GBP')}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon withdrawals"><ArrowUpRight size={20} /></div>
          <div className="stat-info">
            <h3>Net Withdrawals</h3>
            <div className="stat-value">{formatCurrency(stats.totalWithdrawals, 'GBP')}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon kyc"><Clock size={20} /></div>
          <div className="stat-info">
            <h3>Pending Actions</h3>
            <div className="stat-value">{pendingActions.length}</div>
          </div>
        </div>
      </div>

      <div className="admin-main-content">
        {view === 'users' && (
          <div className="admin-grid-main">
            <section className="admin-section">
              <div className="section-header">
                <h3>User Management</h3>
                <div className="header-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles
                      .filter((p) => {
                        const q = String(searchTerm || '').trim().toLowerCase();
                        if (!q) return true;
                        const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
                        const email = String(p.username || '').toLowerCase();
                        return name.includes(q) || email.includes(q);
                      })
                      .map((profile) => (
                      <tr key={profile.id}>
                        <td data-label="User">
                          <div className="user-profile-cell">
                            <div className="user-initials">{profile.first_name?.[0]}{profile.last_name?.[0]}</div>
                            <div className="user-details">
                              <span className="user-name">{profile.first_name} {profile.last_name}</span>
                              <span className="user-email">{profile.username || 'No username'}</span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Balance">
                          <div className="balance-cell">
                            <strong>{formatCurrency(profile.accounts?.[0]?.balance || 0, profile.currency)}</strong>
                            <button className="edit-btn" onClick={() => {
                              setSelectedUser(profile);
                              setEditBalance(profile.accounts?.[0]?.balance || 0);
                              setEditAccountType(profile.accounts?.[0]?.type || 'checkings');
                              setAdjustAmount('');
                              setAdjustDescription('');
                              setPingTitle('Admin Ping');
                              setPingMessage('');
                              setEditBankDetails({
                                bankName: profile.deposit_bank_name || '',
                                accountNumber: profile.deposit_account_number || '',
                                sortCode: profile.deposit_sort_code || '',
                                recipientName: profile.deposit_recipient_name || ''
                              });
                            }}><Settings size={14} /></button>
                          </div>
                        </td>
                        <td data-label="Status">
                          <span
                            className={`status-pill ${
                              profile.blocked ? 'blocked' : (profile.is_inactive ? 'inactive' : 'active')
                            }`}
                          >
                            {profile.blocked ? 'Blocked' : (profile.is_inactive ? 'Inactive' : 'Active')}
                          </span>
                          {profile.is_admin && <span className="status-pill admin-badge">Admin</span>}
                        </td>
                        <td data-label="Actions">
                          <div className="action-group">
                            <button 
                              className={`block-toggle-btn ${profile.blocked ? 'unblock' : 'block'}`}
                              onClick={() => handleToggleBlock(profile.id, profile.blocked)}
                            >
                              {profile.blocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              className={`inactive-toggle-btn ${profile.is_inactive ? 'make-active' : 'make-inactive'}`}
                              onClick={() => handleToggleInactive(profile.id, profile.is_inactive)}
                            >
                              {profile.is_inactive ? 'Set Active' : 'Set Inactive'}
                            </button>
                            
                            {profile.id !== profiles.find(p => p.is_admin)?.id && (
                              <>
                                <button 
                                  className={`role-toggle-btn ${profile.is_admin ? 'demote' : 'promote'}`}
                                  onClick={() => handleToggleAdmin(profile.id, profile.is_admin)}
                                >
                                  {profile.is_admin ? 'Remove Admin' : 'Make Admin'}
                                </button>
                                <button 
                                  className="delete-user-btn"
                                  onClick={() => handleDeleteUser(profile.id)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Create Incoming Deposit Form */}
            <section className="admin-section sidebar-form">
              <h3>Create Incoming Deposit</h3>
              <p className="form-help">This will show as "Pending Admin" for the user until you approve it.</p>
              <form onSubmit={handleCreateIncomingDeposit}>
                <div className="form-group">
                  <label>Select User</label>
                  <select name="userId" required>
                    <option value="">Choose a recipient...</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.username})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (£)</label>
                  <input type="number" name="amount" step="0.01" required placeholder="0.00" className="no-symbol-input" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" name="description" placeholder="e.g. International Wire Transfer" />
                </div>
                <button type="submit" className="admin-btn primary full-width">Create Deposit</button>
              </form>
            </section>
          </div>
        )}

        {view === 'deposits' && (
          <section className="admin-section full-width">
            <div className="section-header">
              <div className="title-group">
                <h3>Pending Actions</h3>
                <p className="form-help">Verify and approve deposits/transfers to finalize transactions.</p>
              </div>
            </div>
            <div className="admin-tx-list">
              {pendingActions.map((tx) => (
                <div key={tx.id} className="admin-tx-item">
                  <div className="tx-main-info">
                    <div className={`tx-icon-wrapper ${tx.direction === 'credit' ? 'deposit' : 'withdrawal'}`}>
                      {tx.direction === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div className="tx-user-data">
                      <span className="user-name">{tx.profiles?.first_name} {tx.profiles?.last_name}</span>
                      <span className="tx-description">
                        <strong>{tx.status === 'pending_transfer' ? 'TRANSFER' : 'DEPOSIT'}:</strong> {tx.description}
                        {tx.status === 'pending_transfer' && (
                          <div className="recipient-mini-details">
                            To: {tx.recipient_name} | Bank: {tx.recipient_bank} | Acc: {tx.recipient_account}
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="tx-amount-data">
                    <span className={`amount ${tx.direction}`}>
                      {tx.direction === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, 'GBP')}
                    </span>
                    <span className="date">{new Date(tx.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="tx-actions">
                    <button 
                      className="approve-btn" 
                      onClick={() => handleManageTransaction(tx.id, 'posted')}
                      disabled={submitting}
                    >
                      <CheckCircle2 size={16} /> {submitting ? 'Processing...' : 'Approve'}
                    </button>
                    <button 
                      className="reject-btn" 
                      onClick={() => handleManageTransaction(tx.id, 'failed')}
                      disabled={submitting}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
              {pendingActions.length === 0 && (
                <div className="empty-state">
                  <ShieldCheck size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                  <p>No pending actions found. All transactions are up to date.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {view === 'upgrades' && (
          <div className="admin-grid-main">
            <section className="admin-section">
              <div className="section-header">
                <div className="title-group">
                  <h3>Account Upgrade Requests</h3>
                  <p className="form-help">Approve or decline upgrade requests and notify users.</p>
                </div>
              </div>
              <div className="admin-tx-list">
                {upgradeRequests.filter((r) => r.status === 'pending').map((req) => (
                  <div key={req.id} className="admin-tx-item">
                    <div className="tx-main-info">
                      <div className="tx-icon-wrapper pending">
                        <Crown size={20} />
                      </div>
                      <div className="tx-user-data">
                        <span className="user-name">{req.profiles?.first_name} {req.profiles?.last_name}</span>
                        <span className="tx-description">
                          <strong>UPGRADE:</strong> {String(req.requested_tier).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="tx-amount-data">
                      <div className="upgrade-approve-fields">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Approved price"
                          value={(upgradeDecisionDraft[req.id]?.price ?? req.requested_price ?? '')}
                          onChange={(e) => setUpgradeDecisionDraft((prev) => ({
                            ...prev,
                            [req.id]: { ...(prev[req.id] || {}), price: e.target.value }
                          }))}
                        />
                        <input
                          type="text"
                          placeholder="Admin note (optional)"
                          value={(upgradeDecisionDraft[req.id]?.note ?? '')}
                          onChange={(e) => setUpgradeDecisionDraft((prev) => ({
                            ...prev,
                            [req.id]: { ...(prev[req.id] || {}), note: e.target.value }
                          }))}
                        />
                      </div>
                      <span className="date">{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="tx-actions">
                      <button
                        className="approve-btn"
                        onClick={() => handleDecideUpgrade(req, 'approve')}
                        disabled={submitting}
                      >
                        <CheckCircle2 size={16} /> Approve
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleDecideUpgrade(req, 'deny')}
                        disabled={submitting}
                      >
                        <XCircle size={16} /> Decline
                      </button>
                    </div>
                  </div>
                ))}

                {upgradeRequests.filter((r) => r.status === 'pending').length === 0 && (
                  <div className="empty-state">
                    <Crown size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                    <p>No pending upgrade requests.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="admin-section sidebar-form">
              <h3>Upgrade Pricing</h3>
              <p className="form-help">Set the price for each upgrade tier.</p>

              <div className="upgrade-price-grid">
                {['starter', 'vip', 'gold', 'platinum'].map((tier) => (
                  <div key={tier} className="form-group">
                    <label>{tier.toUpperCase()} Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={upgradePrices[tier]}
                      onChange={(e) => setUpgradePrices((prev) => ({ ...prev, [tier]: e.target.value }))}
                      className="no-symbol-input"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="admin-btn primary full-width"
                onClick={handleSaveUpgradePrices}
                disabled={submitting}
              >
                Save Prices
              </button>
            </section>
          </div>
        )}

        {view === 'crypto' && (
          <div className="admin-grid-main">
            <section className="admin-section">
              <div className="section-header">
                <div className="title-group">
                  <h3>Crypto Deposit Details</h3>
                  <p className="form-help">Configure wallet addresses and QR codes shown to users for crypto deposits.</p>
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Currency</th>
                      <th>Network</th>
                      <th>Wallet Address</th>
                      <th>QR</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cryptoDetails.map((row) => (
                      <tr key={row.id}>
                        <td data-label="Currency">
                          <strong>{String(row.currency || '').toUpperCase()}</strong>
                        </td>
                        <td data-label="Network">{row.network || '-'}</td>
                        <td data-label="Wallet">
                          <span className="mono">{row.wallet_address}</span>
                        </td>
                        <td data-label="QR">
                          {row.qr_image_url ? (
                            <img className="crypto-qr-thumb" src={row.qr_image_url} alt="QR" />
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td data-label="Actions">
                          <div className="action-group">
                            <button
                              className="role-toggle-btn"
                              onClick={() => handleEditCryptoDetails(row)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-user-btn"
                              onClick={() => handleDeleteCryptoDetails(row)}
                              disabled={submitting}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {cryptoDetails.length === 0 && (
                      <tr>
                        <td colSpan="5">
                          <div className="empty-state" style={{ margin: '16px 0' }}>
                            <Bitcoin size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                            <p>No crypto deposit details configured yet.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section sidebar-form">
              <h3>{cryptoForm.id ? 'Edit Crypto Details' : 'Add Crypto Details'}</h3>
              <p className="form-help">Upload a QR code image for crypto deposits.</p>

              <div className="form-group">
                <label>Crypto Currency</label>
                <input
                  type="text"
                  value={cryptoForm.currency}
                  onChange={(e) => setCryptoForm((prev) => ({ ...prev, currency: e.target.value }))}
                  placeholder="e.g. BTC, USDT, ETH"
                />
              </div>

              <div className="form-group">
                <label>Network (Optional)</label>
                <input
                  type="text"
                  value={cryptoForm.network}
                  onChange={(e) => setCryptoForm((prev) => ({ ...prev, network: e.target.value }))}
                  placeholder="e.g. TRC20, ERC20, BEP20"
                />
              </div>

              <div className="form-group">
                <label>Wallet Address</label>
                <input
                  type="text"
                  value={cryptoForm.walletAddress}
                  onChange={(e) => setCryptoForm((prev) => ({ ...prev, walletAddress: e.target.value }))}
                  placeholder="Paste wallet address"
                />
              </div>

              <div className="form-group">
                <label>Instructions</label>
                <textarea
                  rows="5"
                  value={cryptoForm.instructions}
                  onChange={(e) => setCryptoForm((prev) => ({ ...prev, instructions: e.target.value }))}
                  placeholder="e.g. Send only BTC to this address. Network must match. Include your reference if required."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical' }}
                ></textarea>
              </div>

              <div className="form-group">
                <label>QR Code Image</label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={cryptoUploading || submitting}
                  onChange={(e) => handleCryptoQrUpload(e.target.files?.[0])}
                />
                {cryptoForm.qrImageUrl && (
                  <div className="crypto-qr-preview">
                    <img src={cryptoForm.qrImageUrl} alt="QR Preview" />
                  </div>
                )}
              </div>

              <button
                type="button"
                className="admin-btn primary full-width"
                onClick={handleSaveCryptoDetails}
                disabled={submitting}
              >
                Save Crypto Details
              </button>

              <button
                type="button"
                className="admin-btn secondary full-width"
                onClick={resetCryptoForm}
                disabled={submitting}
                style={{ marginTop: '10px' }}
              >
                Reset
              </button>
            </section>
          </div>
        )}

        {view === 'support' && (
          <section className="admin-section full-width">
            <div className="section-header">
              <div className="title-group">
                <h3>Support Message Management</h3>
                <p className="form-help">Respond to user inquiries and resolve issues.</p>
              </div>
            </div>
            <div className="admin-tx-list">
              {supportMessages.map((msg) => (
                <div key={msg.id} className={`admin-tx-item ${msg.status === 'resolved' ? 'resolved' : ''}`}>
                  <div className="tx-main-info">
                    <div className={`tx-icon-wrapper ${msg.status === 'pending' ? 'pending' : 'success'}`}>
                      <MessageCircle size={20} />
                    </div>
                    <div className="tx-user-data">
                      <span className="user-name">{msg.profiles?.first_name} {msg.profiles?.last_name}</span>
                      <span className="tx-description"><strong>[{msg.category.toUpperCase()}]</strong> {msg.subject}</span>
                    </div>
                  </div>
                  
                  <div className="tx-amount-data">
                    <span className={`status-pill ${msg.status}`}>{msg.status.toUpperCase()}</span>
                    <span className="date">{new Date(msg.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="tx-actions">
                    <button 
                      className="approve-btn" 
                      onClick={() => {
                        setSelectedSupport(msg);
                        setSupportResponse(msg.admin_response || '');
                      }}
                    >
                      <Eye size={16} /> {msg.status === 'pending' ? 'Respond' : 'View'}
                    </button>
                  </div>
                </div>
              ))}
              {supportMessages.length === 0 && (
                <div className="empty-state">
                  <Mail size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                  <p>No support messages found.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {view === 'transactions' && (
          <section className="admin-section full-width">
            <div className="section-header">
              <h3>All Global Transactions</h3>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td data-label="Date">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td data-label="User">{tx.profiles?.first_name} {tx.profiles?.last_name}</td>
                      <td data-label="Description">{tx.description}</td>
                      <td data-label="Amount" className={`tx-amount ${tx.direction}`}>
                        {tx.direction === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, 'GBP')}
                      </td>
                      <td data-label="Status">
                        <span className={`tx-status-badge ${tx.status}`}>
                          {tx.status === 'pending_admin' ? 'Pending Admin' : tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Edit Balance Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h3>Edit Account Details</h3>
              <button onClick={() => setSelectedUser(null)}><XCircle size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Update details for <strong>{selectedUser.first_name} {selectedUser.last_name}</strong></p>
              
              <div className="form-group">
                <label>Account Type</label>
                <select 
                  value={editAccountType} 
                  onChange={(e) => setEditAccountType(e.target.value)}
                >
                  <option value="savings">savings Account</option>
                  <option value="Stocks">Stocks Account</option>
                  <option value="checkings">checkings Account</option>
                </select>
              </div>

              <div className="admin-modal-divider">Bank Deposit Details</div>
              
              <div className="form-group">
                <label>Bank Name</label>
                <input 
                  type="text" 
                  value={editBankDetails.bankName} 
                  onChange={(e) => setEditBankDetails({...editBankDetails, bankName: e.target.value})}
                  placeholder="e.g. National Westminster Bank"
                />
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input 
                  type="text" 
                  value={editBankDetails.accountNumber} 
                  onChange={(e) => setEditBankDetails({...editBankDetails, accountNumber: e.target.value})}
                  placeholder="8 digit account number"
                />
              </div>

              <div className="form-group">
                <label>Sort Code</label>
                <input 
                  type="text" 
                  value={editBankDetails.sortCode} 
                  onChange={(e) => setEditBankDetails({...editBankDetails, sortCode: e.target.value})}
                  placeholder="XX-XX-XX"
                />
              </div>

              <div className="form-group">
                <label>Recipient Name</label>
                <input 
                  type="text" 
                  value={editBankDetails.recipientName} 
                  onChange={(e) => setEditBankDetails({...editBankDetails, recipientName: e.target.value})}
                  placeholder="Full name of recipient"
                />
              </div>

              <div className="admin-modal-divider">Account Balance</div>

              <div className="form-group">
                <label>Current Balance: {formatCurrency(selectedUser.accounts?.[0]?.balance || 0, selectedUser.currency)}</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={editBalance} 
                  onChange={(e) => setEditBalance(e.target.value)}
                  placeholder="Enter new balance"
                  className="no-symbol-input"
                />
              </div>
              <div className="security-warning">
                <ShieldAlert size={16} />
                <p>Warning: This action will directly modify the user's ledger balance.</p>
              </div>

              <div className="admin-modal-divider">Quick Credit / Debit</div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="0.00"
                  className="no-symbol-input"
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                  placeholder="e.g. Adjustment, Fee, Bonus"
                />
              </div>
              <div className="adjust-actions">
                <button
                  type="button"
                  className="adjust-btn credit"
                  disabled={submitting}
                  onClick={() => handleApplyAdjustment(selectedUser.id, selectedUser.accounts?.[0]?.id, 'credit')}
                >
                  <ArrowDownLeft size={16} /> Credit
                </button>
                <button
                  type="button"
                  className="adjust-btn debit"
                  disabled={submitting}
                  onClick={() => handleApplyAdjustment(selectedUser.id, selectedUser.accounts?.[0]?.id, 'debit')}
                >
                  <ArrowUpRight size={16} /> Debit
                </button>
              </div>

              <div className="admin-modal-divider">Ping User</div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={pingTitle}
                  onChange={(e) => setPingTitle(e.target.value)}
                  placeholder="Admin Ping"
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  rows="4"
                  value={pingMessage}
                  onChange={(e) => setPingMessage(e.target.value)}
                  placeholder="Write a message to the user..."
                  disabled={submitting}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical' }}
                ></textarea>
              </div>

              <button
                type="button"
                className="ping-send-btn"
                disabled={submitting || !pingMessage}
                onClick={() => handleSendPing(selectedUser.id)}
              >
                <Bell size={16} /> Send Ping
              </button>

              <div className="admin-modal-divider">Account Access</div>

              <div className="access-actions">
                <button
                  type="button"
                  className={`inactive-toggle-btn ${selectedUser.is_inactive ? 'make-active' : 'make-inactive'}`}
                  disabled={submitting}
                  onClick={() => handleToggleInactive(selectedUser.id, selectedUser.is_inactive)}
                >
                  {selectedUser.is_inactive ? 'Set Active' : 'Set Inactive'}
                </button>
                <button
                  type="button"
                  className={`block-toggle-btn ${selectedUser.blocked ? 'unblock' : 'block'}`}
                  disabled={submitting}
                  onClick={() => handleToggleBlock(selectedUser.id, selectedUser.blocked)}
                >
                  {selectedUser.blocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setSelectedUser(null)}>Cancel</button>
              <button className="save-btn" onClick={() => handleUpdateAccountDetails(selectedUser.id, selectedUser.accounts?.[0]?.id)} disabled={submitting}>
                <Save size={18} /> {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Response Modal */}
      {selectedSupport && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h3>Support Inquiry</h3>
              <button onClick={() => setSelectedSupport(null)}><XCircle size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="support-detail-header">
                <div className={`status-pill ${selectedSupport.status}`}>{selectedSupport.status.toUpperCase()}</div>
                <span className="date">{new Date(selectedSupport.created_at).toLocaleString()}</span>
              </div>
              
              <div className="support-msg-box">
                <div className="msg-label">User</div>
                <div className="msg-value">{selectedSupport.profiles?.first_name} {selectedSupport.profiles?.last_name}</div>
              </div>

              <div className="support-msg-box">
                <div className="msg-label">Subject</div>
                <div className="msg-value"><strong>[{selectedSupport.category}]</strong> {selectedSupport.subject}</div>
              </div>

              <div className="support-msg-box">
                <div className="msg-label">Message</div>
                <div className="msg-content-text">{selectedSupport.message}</div>
              </div>

              <div className="admin-modal-divider">Your Response</div>
              <div className="form-group">
                <textarea 
                  rows="5"
                  value={supportResponse}
                  onChange={(e) => setSupportResponse(e.target.value)}
                  placeholder="Type your response to the user here..."
                  disabled={selectedSupport.status === 'resolved' || submitting}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical' }}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setSelectedSupport(null)}>Close</button>
              {selectedSupport.status === 'pending' && (
                <button 
                  className="save-btn" 
                  onClick={handleResolveSupport} 
                  disabled={submitting || !supportResponse}
                >
                  {submitting ? 'Sending...' : 'Resolve & Notify User'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
