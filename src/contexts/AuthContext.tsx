import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Partner } from '../types';

type Role = 'admin' | 'partner' | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  partnerData: Partner | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [partnerData, setPartnerData] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session?.user ?? null);
    });

    // Escuta mudanças de auth (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSession(currentUser: User | null) {
    setUser(currentUser);
    if (!currentUser) {
      setRole(null);
      setPartnerData(null);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Checar se é admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (adminData && !adminError) {
        setRole('admin');
        setPartnerData(null);
        return;
      }

      // 2. Checar se é parceiro
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (partnerData && !partnerError) {
        if (partnerData.is_active === false) {
          console.log("[AuthContext] Parceiro inativo. Bloqueando acesso.");
          await supabase.auth.signOut();
          setUser(null);
          setRole(null);
          setPartnerData(null);
          return;
        }
        setRole('partner');
        setPartnerData(partnerData as Partner);
        return;
      }

      // Se não for nenhum dos dois
      setRole(null);
    } catch (error) {
      console.error("Erro ao verificar papel do usuário:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, partnerData, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
