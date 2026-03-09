'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Ship,
  CreditCard,
  Shield,
  ShieldCheck,
  Ban,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Pencil,
  KeyRound,
  HardDrive,
  Folder,
  FolderOpen,
  Image,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { getModelLabel } from '@/utils/constants';

interface AdminClientProps {
  users: any[];
  boats: any[];
  payments: any[];
  currentUserRole: 'admin' | 'superAdmin';
}

type Tab = 'users' | 'boats' | 'payments' | 'storage';

interface R2Object {
  key: string;
  size: number;
  lastModified: string;
  url: string;
  folder: string;
  filename: string;
}

interface R2Folder {
  name: string;
  prefix: string;
  objectCount: number;
  totalSize: number;
  type: 'boat' | 'temp' | 'other';
  boatId?: string;
  sessionId?: string;
  ownerEmail?: string;
  ownerName?: string;
  boatModel?: string;
}

interface R2Stats {
  totalObjects: number;
  totalSize: number;
  totalSizeFormatted: string;
  boatFolders: number;
  tempFolders: number;
  boatSize: number;
  boatSizeFormatted: string;
  tempSize: number;
  tempSizeFormatted: string;
}

export default function AdminClient({
  users,
  boats,
  payments,
  currentUserRole
}: AdminClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [loading, setLoading] = useState<string | null>(null);

  // R2 Storage state
  const [r2Stats, setR2Stats] = useState<R2Stats | null>(null);
  const [r2Folders, setR2Folders] = useState<R2Folder[]>([]);
  const [r2Objects, setR2Objects] = useState<R2Object[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [r2Loading, setR2Loading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This will also delete all their boats, payments, and sessions. This cannot be undone!`)) return;

    setLoading(userId);
    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateUserName = async (userId: string) => {
    if (!editName.trim()) return;

    setLoading(userId);
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: editName })
      });

      if (response.ok) {
        setEditingUser(null);
        setEditName('');
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Reset password for ${userEmail}? A temporary password will be sent to their email.`)) return;

    setLoading(userId);
    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        alert(`Password reset email sent to ${userEmail}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    if (!confirm(ban ? 'Ban this user?' : 'Unban this user?')) return;

    setLoading(userId);
    try {
      const response = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ban })
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;

    setLoading(userId);
    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to update role');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteBoat = async (boatId: string) => {
    if (!confirm('Delete this boat listing?')) return;

    setLoading(boatId);
    try {
      const response = await fetch(`/api/admin/boats/${boatId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to delete boat');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateBoatStatus = async (boatId: string, status: string) => {
    setLoading(boatId);
    try {
      const response = await fetch(`/api/admin/boats/${boatId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  // R2 Storage functions
  const loadR2Stats = async () => {
    try {
      const response = await fetch('/api/admin/r2?action=stats');
      if (response.ok) {
        const data = await response.json();
        setR2Stats(data);
      }
    } catch (error) {
      console.error('Error loading R2 stats:', error);
    }
  };

  const loadR2Folders = async () => {
    setR2Loading(true);
    try {
      const response = await fetch('/api/admin/r2?action=folders');
      if (response.ok) {
        const data = await response.json();
        setR2Folders(data.folders || []);
      }
    } catch (error) {
      console.error('Error loading R2 folders:', error);
    } finally {
      setR2Loading(false);
    }
  };

  const loadR2Objects = async (prefix: string) => {
    setR2Loading(true);
    try {
      const response = await fetch(
        `/api/admin/r2?prefix=${encodeURIComponent(prefix)}`
      );
      if (response.ok) {
        const data = await response.json();
        setR2Objects(data.objects || []);
        setCurrentPath(prefix);
      }
    } catch (error) {
      console.error('Error loading R2 objects:', error);
    } finally {
      setR2Loading(false);
    }
  };

  const handleDeleteFile = async (key: string) => {
    if (!confirm(`Delete file: ${key}?`)) return;

    setR2Loading(true);
    try {
      const response = await fetch('/api/admin/r2', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteFile', key })
      });

      if (response.ok) {
        // Refresh current view
        if (currentPath) {
          await loadR2Objects(currentPath);
        }
        await loadR2Stats();
        await loadR2Folders();
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setR2Loading(false);
    }
  };

  const handleDeleteFolder = async (folder: R2Folder) => {
    const confirmMsg =
      folder.type === 'boat'
        ? `Delete all images for boat ${folder.boatId}? (${folder.objectCount} files)`
        : `Delete temp session ${folder.sessionId}? (${folder.objectCount} files)`;

    if (!confirm(confirmMsg)) return;

    setR2Loading(true);
    try {
      const response = await fetch('/api/admin/r2', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:
            folder.type === 'boat' ? 'deleteBoatFolder' : 'deleteTempSession',
          boatId: folder.boatId,
          sessionId: folder.sessionId
        })
      });

      if (response.ok) {
        await loadR2Stats();
        await loadR2Folders();
        setCurrentPath('');
        setR2Objects([]);
      } else {
        alert('Failed to delete folder');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setR2Loading(false);
    }
  };

  const handleCleanupTempImages = async (hours: number = 2) => {
    if (!confirm(`Delete all temporary images older than ${hours} hours?`))
      return;

    setR2Loading(true);
    try {
      const response = await fetch('/api/admin/r2', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanupOldTemp', hoursOld: hours })
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Cleanup complete: ${result.deleted} files deleted, ${result.failed} failed`
        );
        await loadR2Stats();
        await loadR2Folders();
      } else {
        alert('Failed to cleanup');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setR2Loading(false);
    }
  };

  const handleCleanupOrphanedImages = async () => {
    if (
      !confirm(
        'Delete all orphaned images?\n\n• Images in boat folders that no longer exist in DB\n• Images not referenced in boat.photos array\n\nThis cannot be undone!'
      )
    )
      return;

    setR2Loading(true);
    try {
      const response = await fetch('/api/admin/r2', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanupOrphans' })
      });

      if (response.ok) {
        const result = await response.json();
        const message = [
          `Orphan cleanup complete!`,
          ``,
          `Orphaned boat folders: ${result.orphanedBoatFolders} (${result.orphanedBoatFoldersDeleted} files deleted)`,
          `Orphaned images: ${result.orphanedImages} (${result.orphanedImagesDeleted} deleted)`,
          `Space freed: ${result.bytesFreedFormatted}`
        ].join('\n');
        alert(message);
        await loadR2Stats();
        await loadR2Folders();
      } else {
        alert('Failed to cleanup orphaned images');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setR2Loading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load R2 data when storage tab is selected
  useEffect(() => {
    if (activeTab === 'storage' && currentUserRole === 'superAdmin') {
      loadR2Stats();
      loadR2Folders();
    }
  }, [activeTab, currentUserRole]);

  const baseTabs = [
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'boats', label: 'Boats', icon: Ship, count: boats.length },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      count: payments.length
    }
  ];

  // Add Storage tab only for superAdmin
  const tabs =
    currentUserRole === 'superAdmin'
      ? [
          ...baseTabs,
          {
            id: 'storage',
            label: 'Storage',
            icon: HardDrive,
            count: r2Stats?.totalObjects || 0
          }
        ]
      : baseTabs;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superAdmin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
            <ShieldCheck size={14} />
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            <Shield size={14} />
            Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            User
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle size={12} />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Inactive
          </span>
        );
      case 'deleted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <XCircle size={12} />
            Deleted
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <section className="mx-auto max-w-screen-xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={24} className=" text-articblue" />
          <h1 className="text-3xl font-bold text-articblue">Admin Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Manage users, boats, and payments. You are logged in as{' '}
          <span className="font-semibold">
            {currentUserRole === 'superAdmin' ? 'Super Admin' : 'Admin'}
          </span>
          .
        </p>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid grid-cols-1 gap-6 mb-8 ${currentUserRole === 'superAdmin' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
      >
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {users.length}
              </div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Ship className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {boats.length}
              </div>
              <div className="text-sm text-gray-500">Total Boats</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)} EUR
              </div>
              <div className="text-sm text-gray-500">Total Revenue</div>
            </div>
          </div>
        </div>
        {currentUserRole === 'superAdmin' && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <HardDrive className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {r2Stats?.totalSizeFormatted || '...'}
                </div>
                <div className="text-sm text-gray-500">R2 Storage</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-articblue text-articblue'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Boats
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      {editingUser === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateUserName(user.id);
                              if (e.key === 'Escape') { setEditingUser(null); setEditName(''); }
                            }}
                            className="text-sm border border-gray-300 rounded px-2 py-1 w-40"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateUserName(user.id)}
                            disabled={loading === user.id}
                            className="text-green-600 hover:bg-green-50 p-1 rounded"
                            title="Save"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => { setEditingUser(null); setEditName(''); }}
                            className="text-gray-400 hover:bg-gray-100 p-1 rounded"
                            title="Cancel"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="font-medium text-gray-900">
                          {user.name}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.boatsCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {user.banned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        <Ban size={12} />
                        Banned
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {currentUserRole === 'superAdmin' &&
                        user.role !== 'superAdmin' && (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleChangeRole(user.id, e.target.value)
                            }
                            disabled={loading === user.id}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      {user.role !== 'superAdmin' && (
                        <button
                          onClick={() => { setEditingUser(user.id); setEditName(user.name || ''); }}
                          disabled={loading === user.id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit name"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {user.role !== 'superAdmin' && (
                        <button
                          onClick={() => handleResetPassword(user.id, user.email)}
                          disabled={loading === user.id}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Reset password & send email"
                        >
                          <KeyRound size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleBanUser(user.id, !user.banned)}
                        disabled={
                          loading === user.id || user.role === 'superAdmin'
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          user.banned
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-red-600 hover:bg-red-50'
                        } disabled:opacity-50`}
                        title={user.banned ? 'Unban user' : 'Ban user'}
                      >
                        {user.banned ? (
                          <CheckCircle size={16} />
                        ) : (
                          <Ban size={16} />
                        )}
                      </button>
                      {user.role !== 'superAdmin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                          disabled={loading === user.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Boats Tab */}
      {activeTab === 'boats' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Boat
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Owner
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {boats.map((boat) => (
                <tr key={boat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {getModelLabel(boat.model)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {boat.country}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {boat.user?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {boat.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {boat.price.toLocaleString()} {boat.currency}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(boat.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(boat.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={boat.status}
                        onChange={(e) =>
                          handleUpdateBoatStatus(boat.id, e.target.value)
                        }
                        disabled={loading === boat.id}
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="deleted">Deleted</option>
                      </select>
                      <button
                        onClick={() => router.push(`/boat/${boat.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View boat"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => router.push(`/edit-listing/${boat.id}`)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit boat"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteBoat(boat.id)}
                        disabled={loading === boat.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete boat"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {payment.user?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {payment.user?.email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {payment.amount.toFixed(2)} EUR
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'succeeded' ||
                        payment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {payment.createdAt
                      ? new Date(payment.createdAt).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Storage Tab (SuperAdmin Only) */}
      {activeTab === 'storage' && currentUserRole === 'superAdmin' && (
        <div className="space-y-6">
          {/* Storage Stats */}
          {r2Stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HardDrive className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      {r2Stats.totalSizeFormatted}
                    </div>
                    <div className="text-xs text-gray-500">Total Storage</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Ship className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      {r2Stats.boatFolders}
                    </div>
                    <div className="text-xs text-gray-500">
                      Boat Folders ({r2Stats.boatSizeFormatted})
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      {r2Stats.tempFolders}
                    </div>
                    <div className="text-xs text-gray-500">
                      Temp Folders ({r2Stats.tempSizeFormatted})
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Image className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      {r2Stats.totalObjects}
                    </div>
                    <div className="text-xs text-gray-500">Total Files</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2">
              {currentPath && (
                <button
                  onClick={() => {
                    setCurrentPath('');
                    setR2Objects([]);
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-oceanblue bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Folders
                </button>
              )}
              <span className="text-sm text-gray-500">
                {currentPath ? `Viewing: ${currentPath}` : 'Folder Overview'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCleanupTempImages(2)}
                disabled={r2Loading}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <AlertTriangle size={16} />
                Cleanup Temp
              </button>
              <button
                onClick={handleCleanupOrphanedImages}
                disabled={r2Loading}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-red-100 text-red-800 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} />
                Cleanup Orphans
              </button>
              <button
                onClick={() => {
                  loadR2Stats();
                  loadR2Folders();
                  if (currentPath) loadR2Objects(currentPath);
                }}
                disabled={r2Loading}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={r2Loading ? 'animate-spin' : ''}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Folders or Files View */}
          {!currentPath ? (
            /* Folders List */
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900">
                  Folder Structure
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Click on a folder to view its contents
                </p>
              </div>
              {r2Loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : r2Folders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No folders found in storage
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Folder
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Files
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Size
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {r2Folders.map((folder) => (
                      <tr key={folder.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => loadR2Objects(folder.prefix)}
                            className="flex items-center gap-3 text-left"
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                folder.type === 'boat'
                                  ? 'bg-green-100'
                                  : folder.type === 'temp'
                                    ? 'bg-yellow-100'
                                    : 'bg-gray-100'
                              }`}
                            >
                              {folder.type === 'boat' ? (
                                <Ship className="w-4 h-4 text-green-600" />
                              ) : folder.type === 'temp' ? (
                                <Clock className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <Folder className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {folder.type === 'boat' && folder.boatModel
                                  ? folder.boatModel
                                  : folder.name}
                              </div>
                              {folder.type === 'boat' && (
                                <div className="text-xs text-gray-400 font-mono">
                                  {folder.boatId}
                                </div>
                              )}
                              {folder.type === 'temp' && (
                                <div className="text-xs text-gray-400">
                                  Session temp
                                </div>
                              )}
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {folder.type === 'boat' ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {folder.ownerName || '-'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {folder.ownerEmail || 'No email'}
                              </div>
                            </div>
                          ) : folder.type === 'temp' ? (
                            <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                              Temp upload
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {folder.objectCount}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatBytes(folder.totalSize)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => loadR2Objects(folder.prefix)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View files"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteFolder(folder)}
                              disabled={r2Loading}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete folder"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* Files List */
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900">
                  Files in {currentPath}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {r2Objects.length} files
                </p>
              </div>
              {r2Loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : r2Objects.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No files in this folder
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
                  {r2Objects.map((obj) => (
                    <div
                      key={obj.key}
                      className="relative group border rounded-lg overflow-hidden"
                    >
                      <div
                        onClick={() => setSelectedImage(obj.url)}
                        className="cursor-pointer"
                      >
                        <img
                          src={obj.url}
                          alt={obj.filename}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              '/images/ocean.png';
                          }}
                        />
                      </div>
                      <div className="p-2">
                        <div
                          className="text-xs font-medium text-gray-900 truncate"
                          title={obj.filename}
                        >
                          {obj.filename}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatBytes(obj.size)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(obj.key)}
                        disabled={r2Loading}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        title="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Image Preview Modal */}
          {selectedImage && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-4xl max-h-[90vh]">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <XCircle size={24} />
                </button>
                <a
                  href={selectedImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 right-4 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open in new tab
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
