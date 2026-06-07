import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // تحميل المستخدم إذا كان التوكن موجوداً
    useEffect(() => {
        const loadUser = async () => {
            const storedToken = localStorage.getItem('token');
            console.log('🔍 [AuthContext] loadUser - storedToken:', storedToken ? 'exists' : 'not found');
            
            if (!storedToken) {
                console.log('🔍 [AuthContext] No token, setting loading false');
                setLoading(false);
                return;
            }

            try {
                console.log('🔍 [AuthContext] Fetching /auth/me with token');
                const res = await fetch('http://localhost:5000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${storedToken}` }
                });
                
                console.log('🔍 [AuthContext] Response status:', res.status);
                
                if (res.ok) {
                    const data = await res.json();
                    console.log('🔍 [AuthContext] User data received:', data);
                    if (data.success && data.user) {
                        setUser(data.user);
                        setToken(storedToken);
                        console.log('✅ [AuthContext] User loaded successfully');
                    } else {
                        console.log('⚠️ [AuthContext] Invalid response format');
                        localStorage.removeItem('token');
                        setToken(null);
                        setUser(null);
                    }
                } else {
                    console.log('❌ [AuthContext] Failed to load user, status:', res.status);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            } catch (err) {
                console.error('❌ [AuthContext] Fetch error:', err);
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
                console.log('🔍 [AuthContext] loading set to false');
            }
        };
        
        loadUser();
    }, []);

    // ============================================
    // دالة تسجيل الدخول للمرضى (expected_role = 'patient')
    // ============================================
    const login = async (email, password) => {
        console.log('🔐 [AuthContext] Patient login attempt:', { email });
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password,
                    expected_role: 'patient'   // ✅ أضفنا هذا
                })
            });
            const data = await response.json();
            console.log('✅ [AuthContext] Login response:', data);

            if (data.success) {
                const { token, user } = data;
                localStorage.setItem('token', token);
                setToken(token);
                setUser(user);
                return { success: true, user };
            } else {
                return { 
                    success: false, 
                    message: data.message || 'فشل تسجيل الدخول',
                    account_disabled: data.account_disabled,
                    role: data.role,
                    role_mismatch: data.role_mismatch  // ✅ أضفنا هذا
                };
            }
        } catch (error) {
            console.error('❌ [AuthContext] Login fetch error:', error);
            return { success: false, message: 'حدث خطأ في الاتصال بالخادم' };
        }
    };

    // ============================================
    // دالة تسجيل الدخول للموظفين (expected_role = 'employee')
    // ============================================
    const employeeLogin = async (email, password) => {
        console.log('🔐 [AuthContext] Employee login attempt:', { email });
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password,
                    expected_role: 'employee'   // ✅ أضفنا هذا
                })
            });
            const data = await response.json();
            console.log('✅ [AuthContext] Employee login response:', data);

            if (data.success) {
                const { token, user } = data;
                localStorage.setItem('token', token);
                setToken(token);
                setUser(user);
                return { success: true, user };
            } else {
                return { 
                    success: false, 
                    message: data.message || 'فشل تسجيل الدخول',
                    account_disabled: data.account_disabled,
                    role: data.role,
                    role_mismatch: data.role_mismatch
                };
            }
        } catch (error) {
            console.error('❌ [AuthContext] Employee login fetch error:', error);
            return { success: false, message: 'حدث خطأ في الاتصال بالخادم' };
        }
    };

    const logout = () => {
        console.log('🔓 [AuthContext] Logout called');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = { 
        user, 
        loading, 
        login,          // للمرضى
        employeeLogin,  // للموظفين (أطباء واستقبال)
        logout, 
        isAuthenticated: !!user, 
        token 
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};