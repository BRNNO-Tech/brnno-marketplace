// Firestore utilities
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export async function getAvailableSlots(providerId: string, date: string) {
  const availDoc = await getDoc(doc(db, 'providers', providerId, 'availability', date));
  const baseSlots: string[] = availDoc.exists() ? (((availDoc.data() as any).slots) || []) : [];

  const blocksSnap = await getDocs(
    query(collection(db, 'providers', providerId, 'blocks'), where('date', '==', date))
  );

  const blocked = new Set<string>();
  blocksSnap.forEach((b) => {
    const data = b.data() as any;
    if (Array.isArray(data.slots)) data.slots.forEach((s: string) => blocked.add(s));
  });

  return baseSlots.filter((s) => !blocked.has(s));
}

