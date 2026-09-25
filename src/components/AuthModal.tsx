import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Phone, User, Shield, AlertCircle, LogIn, UserPlus, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'LOGIN' | 'SIGNUP';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'LOGIN' }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>(initialMode);
  
  // Registration fields: Name, Phone, Password, Confirm Password
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signInWithPhone, signUpWithPhone } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 6) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 خانات أو رموز على الأقل');
      return;
    }

    if (mode === 'SIGNUP') {
      if (!displayName.trim()) {
        setError('يرجى كتابة الاسم بالكامل أو اسم ورشة الصيانة');
        return;
      }
      // Password match confirmation check
      if (password !== confirmPassword) {
        setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين، يرجى التحقق وإعادة الإدخال');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await signInWithPhone(cleanPhone, password);
      } else {
        await signUpWithPhone(displayName, cleanPhone, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential'
      ) {
        setError('رقم الهاتف أو كلمة المرور غير صحيحة');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('رقم الهاتف هذا مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.');
      } else {
        setError(err.message || 'حدث خطأ أثناء معالجة الطلب');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg"
          title="إغلاق"
        >
          ✕
        </button>

        {/* Modal Header with FixBoard branding */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3 shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            {mode === 'LOGIN' ? 'تسجيل الدخول إلى FixBoard' : 'إنشاء حساب جديد في FixBoard'}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {mode === 'LOGIN'
              ? 'أدخل رقم هاتفك وكلمة المرور للوصول إلى مخططات البوردات والمفضلة'
              : 'سجل حسابك كفني صيانة باستخدام رقم الهاتف المحمول'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center space-x-2 space-x-reverse animate-shake">
            <AlertCircle className="w-4 h-4 ml-1 flex-shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name (Only in SIGNUP) */}
          {mode === 'SIGNUP' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                الاسم الكامل / اسم المركز أو الورشة <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمود - Fix Lab"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>
            </div>
          )}

          {/* Phone Number Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              رقم الهاتف <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                required
                dir="ltr"
                placeholder="01xxxxxxxxx أو +20xxxxxxxxx"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition text-right font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">يُستخدم رقم الهاتف كوسيلة تسجيل الدخول الأساسية لحسابك.</p>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              كلمة المرور <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>
          </div>

          {/* Confirm Password Field (Only in SIGNUP) */}
          {mode === 'SIGNUP' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>تأكيد كلمة المرور <span className="text-rose-400">*</span></span>
                {confirmPassword && password && confirmPassword === password && (
                  <span className="text-[10px] text-emerald-400 flex items-center">
                    <CheckCircle2 className="w-3 h-3 ml-1" />
                    متطابقة
                  </span>
                )}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="أعد إدخال كلمة المرور للتأكيد"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full bg-slate-950 border rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                    confirmPassword && confirmPassword !== password 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-cyan-600/20 disabled:opacity-50 flex items-center justify-center space-x-2 space-x-reverse mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'LOGIN' ? (
              <>
                <LogIn className="w-4 h-4 ml-1.5" />
                <span>تسجيل الدخول</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 ml-1.5" />
                <span>إنشاء الحساب وتأكيد التسجيل</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 pt-4 border-t border-slate-800/80">
          {mode === 'LOGIN' ? (
            <span>
              ليس لديك حساب بعد؟{' '}
              <button
                onClick={() => { setMode('SIGNUP'); setError(null); }}
                className="text-cyan-400 hover:underline font-semibold"
              >
                إنشاء حساب فني جديد
              </button>
            </span>
          ) : (
            <span>
              لديك حساب بالفعل برقم هاتفك؟{' '}
              <button
                onClick={() => { setMode('LOGIN'); setError(null); }}
                className="text-cyan-400 hover:underline font-semibold"
              >
                تسجيل الدخول
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
