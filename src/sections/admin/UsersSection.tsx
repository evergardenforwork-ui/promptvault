import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Trash2, Key, Shield, User, X, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface UserEntry {
  uid: string;
  name: string;
  email: string;
  role: string;
}

interface UsersSectionProps {
  addToast: (message: React.ReactNode, type?: 'success' | 'error') => void;
}

interface CreateUserFormState {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

interface PasswordFormState {
  uid: string;
  name: string;
  password: string;
}

export default function UsersSection({ addToast }: UsersSectionProps) {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormState>({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [creating, setCreating] = useState(false);
  const [showCreatePwd, setShowCreatePwd] = useState(false);

  // Change password modal
  const [passwordForm, setPasswordForm] = useState<PasswordFormState | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; uid: string | null; name: string }>({
    isOpen: false,
    uid: null,
    name: '',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getUsers();
      setUsers(list);
    } catch (err: any) {
      addToast(err.message || 'Не удалось загрузить пользователей', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await api.createUser(createForm);
      setUsers(prev => [...prev, created]);
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'user' });
      addToast(`Пользователь "${created.name}" создан`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Ошибка создания', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.uid) return;
    const uid = deleteConfirm.uid;
    setDeleteConfirm({ isOpen: false, uid: null, name: '' });
    try {
      await api.deleteUser(uid);
      setUsers(prev => prev.filter(u => u.uid !== uid));
      addToast('Пользователь удалён');
    } catch (err: any) {
      addToast(err.message || 'Ошибка удаления', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm) return;
    setChangingPwd(true);
    try {
      await api.changeUserPassword(passwordForm.uid, newPassword);
      setPasswordForm(null);
      setNewPassword('');
      addToast('Пароль обновлён', 'success');
    } catch (err: any) {
      addToast(err.message || 'Ошибка смены пароля', 'error');
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/20 border border-violet-500/30 rounded-2xl">
            <Users size={22} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Управление пользователями</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Создавайте аккаунты для друзей и управляйте доступом</p>
          </div>
        </div>
        <button
          id="create-user-btn"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-violet-500/25 cursor-pointer"
        >
          <Plus size={16} />
          Добавить пользователя
        </button>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-400" />
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {users.map((u) => (
              <motion.div
                key={u.uid}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                    u.role === 'admin'
                      ? 'bg-violet-500/20 border border-violet-500/40 text-violet-400'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                  }`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{u.name}</span>
                      {u.role === 'admin' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 text-[10px] font-black uppercase tracking-widest">
                          <Shield size={9} />
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 mt-0.5 block">{u.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`change-pwd-${u.uid}`}
                    onClick={() => { setPasswordForm({ uid: u.uid, name: u.name, password: '' }); setNewPassword(''); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    title="Сменить пароль"
                  >
                    <Key size={13} />
                    Пароль
                  </button>

                  {u.uid !== 'admin-uid' && (
                    <button
                      id={`delete-user-${u.uid}`}
                      onClick={() => setDeleteConfirm({ isOpen: true, uid: u.uid, name: u.name })}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-xl transition-all cursor-pointer"
                      title="Удалить пользователя"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <User size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-bold">Нет пользователей</p>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white">Новый пользователь</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Имя</label>
                    <input
                      id="new-user-name"
                      type="text"
                      required
                      value={createForm.name}
                      onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Алексей"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-2xl py-3 px-4 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email</label>
                    <input
                      id="new-user-email"
                      type="email"
                      required
                      value={createForm.email}
                      onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="friend@example.com"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-2xl py-3 px-4 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Пароль</label>
                    <div className="relative">
                      <input
                        id="new-user-password"
                        type={showCreatePwd ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={createForm.password}
                        onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Минимум 4 символа"
                        className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        {showCreatePwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Роль</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCreateForm(f => ({ ...f, role: 'user' }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          createForm.role === 'user'
                            ? 'bg-zinc-800 border-zinc-600 text-white'
                            : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <User size={14} />
                        Пользователь
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateForm(f => ({ ...f, role: 'admin' }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          createForm.role === 'admin'
                            ? 'bg-violet-500/20 border-violet-500/50 text-violet-400'
                            : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Shield size={14} />
                        Администратор
                      </button>
                    </div>
                  </div>

                  <button
                    id="submit-create-user"
                    type="submit"
                    disabled={creating}
                    className="w-full py-3 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white font-black rounded-2xl transition-all cursor-pointer shadow-lg shadow-violet-500/25 mt-2"
                  >
                    {creating ? 'Создание...' : 'Создать пользователя'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {passwordForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPasswordForm(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-black text-white">Смена пароля</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">для {passwordForm.name}</p>
                  </div>
                  <button
                    onClick={() => setPasswordForm(null)}
                    className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Новый пароль</label>
                    <div className="relative">
                      <input
                        id="change-password-input"
                        type={showNewPwd ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Минимум 4 символа"
                        autoFocus
                        className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-amber-500 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="submit-change-password"
                    type="submit"
                    disabled={changingPwd}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black rounded-2xl transition-all cursor-pointer shadow-lg shadow-amber-500/25"
                  >
                    {changingPwd ? 'Сохранение...' : 'Сохранить пароль'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={`Удалить "${deleteConfirm.name}"?`}
        message="Пользователь будет удалён. Его промпты и скиллы останутся в системе."
        confirmText="Удалить"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, uid: null, name: '' })}
      />
    </div>
  );
}
