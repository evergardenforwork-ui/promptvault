import React, { useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
  onToast: (message: React.ReactNode, type?: 'success' | 'error') => void;
}

export default function LoginForm({ onLoginSuccess, onToast }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await api.login(email, password);
      onToast('Успешный вход!', 'success');
      onLoginSuccess(user);
    } catch (err: any) {
      onToast(err.message || 'Ошибка авторизации', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] dark:bg-[#000000] text-zinc-900 dark:text-white p-6 transition-colors">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl backdrop-blur-xl shadow-xl dark:shadow-none transition-colors"
      >
        <div className="text-center space-y-2">
          <h1 className="text-6xl font-black tracking-tighter text-zinc-900 dark:text-white">
            PROMPT<span className="text-sky-500 dark:text-sky-400">VAULT</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Ваша личная библиотека промптов.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-2">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 shadow-sm"
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-2">Пароль</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 shadow-sm"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-sky-400 text-black font-black uppercase tracking-wider rounded-2xl hover:bg-sky-300 transition-all shadow-lg shadow-sky-400/20 disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? 'Вход...' : 'Войти в систему'}
          </button>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@promptvault.local');
                setPassword('admin123');
              }}
              className="w-full py-2.5 px-3 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl transition-all cursor-pointer text-center bg-zinc-100/60 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              ⚡ Быстрое заполнение: Admin (admin123)
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
          Для доступа к системе используйте учетные данные, выданные администратором.
        </p>
      </motion.div>
    </div>
  );
}
