"use client";

import { useEffect, useState } from 'react';
import { usersAPI } from '@/lib/api';

const PERMISSIONS = [
  'dashboard.view',
  'rooms.manage',
  'bookings.manage',
  'convention.manage',
  'convention-bookings.manage',
  'food-packages.manage',
  'addon-services.manage',
  'hero-slides.manage',
  'resort-settings.manage',
  'users.manage',
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    permissions: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const togglePermission = (perm: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch (error) {
      console.error('Error loading users', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) {
      alert('Name, email, and password are required');
      return;
    }
    setSaving(true);
    try {
      await usersAPI.create({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        permissions: form.permissions,
      });
      setForm({ name: '', email: '', password: '', role: 'staff', permissions: [] });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user', error);
      alert('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 shadow">
        <h1 className="text-3xl font-bold">User & Access Management</h1>
        <p className="text-indigo-100">Create users and assign menu-level permissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Create User</h2>
            <span className="text-xs text-gray-500">Owner only</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Name</label>
              <input
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <input
                type="email"
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <input
                type="password"
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Role</label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="staff">Staff</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Permissions</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded p-2">
              {PERMISSIONS.map((perm) => (
                <label key={perm} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                  />
                  <span>{perm}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Create User'}
          </button>
        </form>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Users</h2>
            <button
              onClick={fetchUsers}
              className="text-sm px-3 py-1 border rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="py-10 text-center">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Role</th>
                    <th className="px-3 py-2 text-left">Permissions</th>
                    <th className="px-3 py-2 text-left">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-3 py-2 font-semibold">{u.name}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2 capitalize">{u.role}</td>
                      <td className="px-3 py-2">
                        {u.permissions && u.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.permissions.map((p: string) => (
                              <span key={p} className="px-2 py-1 bg-gray-100 rounded text-xs">{p}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">(none)</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
