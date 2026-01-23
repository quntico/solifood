import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PasswordPrompt = ({ onCorrectPassword, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === '2020' || password === '2021') {
      setError(false);
      onCorrectPassword(password);
      toast({
        title: 'Acceso Concedido',
        description: password === '2021' ? 'Modo Master Activado (Admin + Editor).' : 'Bienvenido, Administrador.',
      });
    } else {
      setError(true);
      setPassword('');
      toast({
        title: 'Acceso Denegado',
        description: 'La contraseña es incorrecta.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-zinc-950/40 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-xl w-full max-w-sm p-8 overflow-hidden ring-1 ring-white/5"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-4 bg-primary/10 rounded-2xl mb-5 border border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.15)] ring-1 ring-primary/30">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Acceso de Administrador</h2>
          <p className="text-xs text-gray-400 mt-2 font-medium tracking-wide">
            INGRESA LAS CREDENCIALES DE CONTROL
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`text-center h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20 rounded-xl font-mono tracking-widest ${error ? 'border-destructive ring-1 ring-destructive' : ''}`}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_10px_20px_hsl(var(--primary)/0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]">
              ACCEDER AL PANEL
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel} className="w-full h-10 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl text-xs font-bold tracking-widest">
              CANCELAR
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PasswordPrompt;