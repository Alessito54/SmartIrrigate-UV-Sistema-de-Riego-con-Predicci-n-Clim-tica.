import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";


export default function EstadoEsp32() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const estadoRef = ref(db, "invernadero/estado");

    onValue(estadoRef, (snap) => {
      const estado = snap.val();
      if (!estado) return;

      const now = Date.now();
      const last = estado.timestamp;

      const diff = now - last;

      const isOnline = diff < 10000; // 10 segundos
      setOnline(isOnline);
    });
  }, []);

  return (
    <div>
      <h2>ESP32 está: {online ? "🟢 ONLINE" : "🔴 OFFLINE"}</h2>
    </div>
  );
}
