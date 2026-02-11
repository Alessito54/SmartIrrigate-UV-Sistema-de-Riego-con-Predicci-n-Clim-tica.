import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

export function listenToSensors(callback) {
  const sensoresRef = ref(db, "invernadero/sensores");

  onValue(sensoresRef, snapshot => {
    const data = snapshot.val();
    callback(data);
  });
}
