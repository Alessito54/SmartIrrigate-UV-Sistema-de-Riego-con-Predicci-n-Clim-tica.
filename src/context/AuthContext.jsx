import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut,
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, db } from "../services/firebase";

const googleProvider = new GoogleAuthProvider();

const AuthContext = createContext(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [invId, setInvId] = useState(null);
    const [secId, setSecId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Listen to auth state
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    // Read user data
                    const snap = await get(ref(db, `usuarios/${firebaseUser.uid}`));
                    if (snap.exists()) {
                        const data = snap.val();
                        setUserData(data);

                        // Resolve first invernadero
                        const invIds = Object.keys(data.invernaderos || {});
                        if (invIds.length > 0) {
                            const firstInvId = invIds[0];
                            setInvId(firstInvId);

                            // Resolve first section
                            const secSnap = await get(ref(db, `invernaderos/${firstInvId}/secciones`));
                            if (secSnap.exists()) {
                                const secIds = Object.keys(secSnap.val());
                                if (secIds.length > 0) {
                                    setSecId(secIds[0]);
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error loading user data:", err);
                }
            } else {
                setUser(null);
                setUserData(null);
                setInvId(null);
                setSecId(null);
            }
            setLoading(false);
        });

        return () => unsub();
    }, []);

    // Computed path prefix for all DB operations
    const sectionPath = invId && secId
        ? `invernaderos/${invId}/secciones/${secId}`
        : null;

    const invPath = invId ? `invernaderos/${invId}` : null;

    async function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    async function register(email, password, nombre) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Write initial user record
        await set(ref(db, `usuarios/${cred.user.uid}`), {
            correo: email,
            nombre: nombre || email.split("@")[0],
            invernaderos: {},
        });
        return cred;
    }

    async function loginWithGoogle() {
        const result = await signInWithPopup(auth, googleProvider);
        // Create user record if it doesn't exist
        const snap = await get(ref(db, `usuarios/${result.user.uid}`));
        if (!snap.exists()) {
            await set(ref(db, `usuarios/${result.user.uid}`), {
                correo: result.user.email,
                nombre: result.user.displayName || result.user.email.split("@")[0],
                invernaderos: {},
            });
        }
        return result;
    }

    async function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    async function logout() {
        return signOut(auth);
    }

    const value = {
        user,
        userData,
        invId,
        secId,
        sectionPath,
        invPath,
        loading,
        login,
        register,
        loginWithGoogle,
        resetPassword,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
