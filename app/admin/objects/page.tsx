"use client";
import React, { useEffect, useState } from "react";

interface LostObject {
  id: number;
  name: string;
  status: string;
  description?: string;
  location?: string;
  category?: string;
  imageUrl?: string;
  reportedAt?: string;
  reportedByUsername?: string;
}

export default function AdminObjectsPage() {
  const [objects, setObjects] = useState<LostObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    
    fetch('/api/admin/items')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch objects");
        return res.json();
      })
      .then(data => {
        setObjects(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function handleValidate(id: number) {
    setError("");
    setSuccess("");
    
    fetch(`/api/admin/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "validated" })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to update object");
        return res.json();
      })
      .then(updated => {
        setObjects(objs => objs.map(obj => (obj.id === id ? updated : obj)));
        setSuccess("Object validated successfully");
      })
      .catch(err => setError(err.message));
  }

  function handleDelete(id: number) {
    setError("");
    setSuccess("");
    
    fetch(`/api/admin/items/${id}`, { method: "DELETE" })
      .then(res => {
        if (!res.ok) throw new Error("Failed to delete object");
        setObjects(objs => objs.filter(obj => obj.id !== id));
        setSuccess("Object deleted successfully");
      })
      .catch(err => setError(err.message));
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Object Management</h1>
      {error && <div className="text-red-500 mb-2">Error: {error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {loading ? <p>Loading objects...</p> : (
        <div className="overflow-x-auto">
          {objects.length === 0 ? (
            <p className="text-gray-500">No objects found.</p>
          ) : (
            <table className="min-w-full bg-white border rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Category</th>
                  <th className="px-4 py-2 border">Location</th>
                  <th className="px-4 py-2 border">Reported By</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {objects.map(obj => (
                  <tr key={obj.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{obj.name}</td>
                    <td className="px-4 py-2 border">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        obj.status === 'LOST' ? 'bg-red-100 text-red-800' : 
                        obj.status === 'FOUND' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {obj.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 border">{obj.category}</td>
                    <td className="px-4 py-2 border">{obj.location || 'N/A'}</td>
                    <td className="px-4 py-2 border">{obj.reportedByUsername || 'Anonymous'}</td>
                    <td className="px-4 py-2 border space-x-2">
                      {obj.status !== "validated" && (
                        <button 
                          onClick={() => handleValidate(obj.id)} 
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                        >
                          Validate
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(obj.id)} 
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </main>
  );
} 