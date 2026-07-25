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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8 p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-xl"
      >
        <div className="text-center space-y-2">
          <h1 className="text-6xl font-black tracking-tighter text-white">
            PROMPT<span className="text-sky-400">VAULT</span>
          </h1>
          <p className="text-zinc-500 font-medium">Ваша личная библиотека промптов.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-2">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-sky-400 transition-all placeholder-zinc-600"
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-2">Пароль</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-sky-400 transition-all placeholder-zinc-600"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-sky-400 text-black font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600">
          Для доступа к системе используйте учетные данные, выданные администратором.
        </p>
      </motion.div>
    </div>
  );
}
