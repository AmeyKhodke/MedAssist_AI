import api from '../../api';

export default function ApprovalPanel() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/api/approvals');
      setApprovals(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching approvals", err);
      setLoading(false);
    }
  };

  const handleAction = async (approvalId, actionStr) => {
    let reason = null;
    if (actionStr === 'rejected') {
      reason = window.prompt("Please provide a reason for rejecting this prescription (e.g., 'Illegible handwriting', 'Expired prescription'):");
      if (reason === null) {
        // User cancelled the prompt
        return;
      }
    }

    // Optimistic UI update
    setApprovals(prev => prev.filter(a => a.id !== approvalId));
    try {
      await api.post(`/api/approvals/${approvalId}`, {
        status: actionStr,
        reason: reason
      });
    } catch (err) {
      console.error(`Error updating approval ${approvalId}`, err);
      // Re-fetch on error to revert
      fetchApprovals();
    }
  };

  if (loading) return <div className="h-64 bg-slate-100 animate-pulse rounded-2xl w-full"></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden col-span-1 lg:col-span-12 flex flex-col h-auto min-h-[300px]">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 sticky top-0">
        <div className="flex items-center space-x-2">
          <FileCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800">Approval Queue</h2>
        </div>
        <span className="bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full">{approvals.length} Pending Actions</span>
      </div>

      <div className="overflow-x-auto flex-1 p-0">
        {approvals.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-lg font-medium text-slate-700">Inbox Zero!</p>
            <p className="text-sm mt-1">No pending prescriptions require your approval.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Patient ID</th>
                <th className="px-6 py-4">Medication</th>
                <th className="px-6 py-4">Prescription</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvals.map((req, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-700">{req.user_id}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{req.medicine}</div>
                  </td>
                  <td className="px-6 py-4">
                    {req.prescription_url ? (
                      <a href={req.prescription_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors border border-indigo-100">
                        View Script
                      </a>
                    ) : (
                      <span className="text-slate-400 italic text-xs">No attachment</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleAction(req.id, 'rejected')}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <X size={16} />
                        <span>Deny</span>
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'approved')}
                        className="flex items-center space-x-1.5 px-4 py-1.5 rounded-md text-sm font-semibold bg-[#10B981] hover:bg-emerald-600 text-white transition-colors shadow-sm"
                      >
                        <Check size={16} />
                        <span>Approve</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
