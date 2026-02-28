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
    // Full list: { [invId]: { nombre, secciones: { [secId]: { nombre, ... } }, estado: {...} } }
    const [invernaderos, setInvernaderos] = useState({});
    const [invId, setInvId] = useState(null);
    const [secId, setSecId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const snap = await get(ref(db, `usuarios/${firebaseUser.uid}`));
                    if (snap.exists()) {
                        const data = snap.val();
                        setUserData(data);

                        const invIds = Object.keys(data.invernaderos || {});
                        if (invIds.length > 0) {
                            // Load ALL invernaderos with their sections
                            const invData = {};
                            for (const id of invIds) {
                                const invSnap = await get(ref(db, `invernaderos/${id}`));
                                if (invSnap.exists()) {
                                    invData[id] = invSnap.val();
                                }
                            }
                            setInvernaderos(invData);

                            // Set defaults
                            const firstInvId = invIds[0];
                            setInvId(firstInvId);

                            const secIds = Object.keys(invData[firstInvId]?.secciones || {});
                            if (secIds.length > 0) {
                                setSecId(secIds[0]);
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error loading user data:", err);
                }
            } else {
                setUser(null);
                setUserData(null);
                setInvernaderos({});
                setInvId(null);
                setSecId(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Switch to a specific invernadero: auto-select first section
    function selectInvernadero(id) {
        setInvId(id);
        const secIds = Object.keys(invernaderos[id]?.secciones || {});
        setSecId(secIds.length > 0 ? secIds[0] : null);
    }

    // Switch to a specific section within the current invernadero
    function selectSeccion(id) {
        setSecId(id);
    }

    // Computed paths
    const sectionPath = invId && secId
        ? `invernaderos/${invId}/secciones/${secId}`
        : null;

    const invPath = invId ? `invernaderos/${invId}` : null;

    // Current section data (sensors, name, etc.)
    const currentSection = invId && secId
        ? invernaderos[invId]?.secciones?.[secId] || null
        : null;

    const currentInvernadero = invId ? invernaderos[invId] || null : null;

    async function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    async function register(email, password, nombre) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await set(ref(db, `usuarios/${cred.user.uid}`), {
            correo: email,
            nombre: nombre || email.split("@")[0],
            invernaderos: {},
        });
        return cred;
    }

    async function loginWithGoogle() {
        const result = await signInWithPopup(auth, googleProvider);
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

    // Reload all invernadero data from Firebase (call after adding new ones)
    async function reloadInvernaderos() {
        if (!user) return;
        const snap = await get(ref(db, `usuarios/${user.uid}`));
        if (!snap.exists()) return;
        const data = snap.val();
        setUserData(data);
        const invIds = Object.keys(data.invernaderos || {});
        const invData = {};
        for (const id of invIds) {
            const invSnap = await get(ref(db, `invernaderos/${id}`));
            if (invSnap.exists()) invData[id] = invSnap.val();
        }
        setInvernaderos(invData);
    }

    const value = {
        user,
        userData,
        invernaderos,
        invId,
        secId,
        sectionPath,
        invPath,
        currentSection,
        currentInvernadero,
        loading,
        selectInvernadero,
        selectSeccion,
        reloadInvernaderos,
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
