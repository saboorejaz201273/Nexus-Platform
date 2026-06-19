import React, { useEffect, useState } from 'react';
import { depositMoney, withdrawMoney, transferMoney, getTransactions, getBalance, getAllUsers } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Transaction {
  _id: string;
  user: { _id: string; name: string; email: string; role: string };
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  recipient?: { _id: string; name: string; email: string; role: string } | null;
  description: string;
  paymentMethod: string;
  transactionRef: string;
  createdAt: string;
}

interface UserOption {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const fetchAll = async () => {
    try {
      const txRes = await getTransactions();
      const balRes = await getBalance();
      const usersRes = await getAllUsers();
      setTransactions(txRes.data);
      setBalance(balRes.data.balance);
      setUsers(usersRes.data);
    } catch (err) {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setRecipient('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (activeTab === 'transfer' && !recipient) {
      toast.error('Please select a recipient');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (activeTab === 'deposit') {
        res = await depositMoney({ amount: amt, paymentMethod, description });
      } else if (activeTab === 'withdraw') {
        res = await withdrawMoney({ amount: amt, paymentMethod, description });
      } else {
        res = await transferMoney({ amount: amt, recipientId: recipient, description });
      }

      const status = res.data.status;
      if (status === 'completed') {
        toast.success(activeTab + ' successful!');
      } else {
        toast.error(activeTab + ' failed. Please try again.');
      }

      resetForm();
      fetchAll();
    } catch (err) {
      toast.error('Failed to ' + activeTab);
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-700';
    if (status === 'failed') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const typeIcon = (type: string) => {
    if (type === 'deposit') return '⬇️';
    if (type === 'withdraw') return '⬆️';
    return '🔄';
  };

  const isOutgoing = (tx: Transaction) => {
    if (tx.type === 'deposit') return false;
    if (tx.type === 'withdraw') return true;
    return tx.user._id === user?.id;
  };

  if (loading) {
    return <div className="p-6">Loading payments...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Payments</h1>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow p-6 mb-6 text-white">
        <p className="text-sm opacity-80">Wallet Balance</p>
        <p className="text-3xl font-bold mt-1">${balance.toFixed(2)}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex bg-gray-100 rounded-md p-1 mb-4">
            <button
              onClick={() => { setActiveTab('deposit'); resetForm(); }}
              className={'flex-1 px-3 py-2 rounded-md text-sm font-medium capitalize ' + (activeTab === 'deposit' ? 'bg-white shadow text-gray-900' : 'text-gray-600')}
            >
              deposit
            </button>
            <button
              onClick={() => { setActiveTab('withdraw'); resetForm(); }}
              className={'flex-1 px-3 py-2 rounded-md text-sm font-medium capitalize ' + (activeTab === 'withdraw' ? 'bg-white shadow text-gray-900' : 'text-gray-600')}
            >
              withdraw
            </button>
            <button
              onClick={() => { setActiveTab('transfer'); resetForm(); }}
              className={'flex-1 px-3 py-2 rounded-md text-sm font-medium capitalize ' + (activeTab === 'transfer' ? 'bg-white shadow text-gray-900' : 'text-gray-600')}
            >
              transfer
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>

            {activeTab === 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer To *</label>
                <select
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select recipient</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab !== 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="e.g. Investment funding"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 capitalize"
            >
              {submitting ? 'Processing...' : 'Confirm ' + activeTab}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Mock payment gateway (sandbox simulation, no real money involved)
            </p>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-3">Transaction History</h2>

          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No transactions yet.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeIcon(tx.type)}</span>
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {tx.type}
                        {tx.type === 'transfer' && isOutgoing(tx) && tx.recipient ? ' to ' + tx.recipient.name : ''}
                        {tx.type === 'transfer' && !isOutgoing(tx) ? ' from ' + tx.user.name : ''}
                      </p>
                      <p className="text-xs text-gray-500">{tx.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={'text-sm font-semibold ' + (isOutgoing(tx) ? 'text-red-600' : 'text-green-600')}>
                      {isOutgoing(tx) ? '-' : '+'}${tx.amount.toFixed(2)}
                    </p>
                    <span className={'text-xs px-2 py-0.5 rounded-full ' + statusColor(tx.status)}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};