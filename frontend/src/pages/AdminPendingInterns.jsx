// frontend/src/pages/AdminPendingInterns.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPendingInterns = () => {
  const [pendingInterns, setPendingInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPendingInterns();
  }, []);

  const fetchPendingInterns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/pending-interns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingInterns(response.data.interns);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/approve-intern/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Stagiaire approuvé avec succès');
      fetchPendingInterns(); // Rafraîchir la liste
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir rejeter ce stagiaire ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/admin/reject-intern/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Stagiaire rejeté');
        fetchPendingInterns(); // Rafraîchir la liste
      } catch (error) {
        console.error('Erreur:', error);
        setMessage('Erreur lors du rejet');
      }
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Demandes d'inscription en attente</h1>
      
      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
          {message}
        </div>
      )}

      {pendingInterns.length === 0 ? (
        <p className="text-gray-500">Aucune demande en attente</p>
      ) : (
        <div className="grid gap-4">
          {pendingInterns.map((intern) => (
            <div key={intern._id} className="border p-4 rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">
                    {intern.firstName} {intern.lastName}
                  </h3>
                  <p className="text-gray-600">{intern.email}</p>
                  <p className="text-gray-500 text-sm">
                    Inscrit le: {new Date(intern.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleApprove(intern._id)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    ✅ Approuver
                  </button>
                  <button
                    onClick={() => handleReject(intern._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    ❌ Rejeter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPendingInterns;