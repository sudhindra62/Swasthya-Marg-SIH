import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0656658211",
  appId: "1:695420350491:web:3054406f117dc6561cc8be",
  apiKey: "AIzaSyDQHIfrDRxWtPb_7E0RlJiOtzIigIldzbo",
  authDomain: "gen-lang-client-0656658211.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-cf079396-e48a-4726-8b97-28b2dca94c19");
const auth = getAuth(app);

async function seed() {
  const admins = [
    { email: 'super@swasthapath.com', role: 'super_admin', name: 'Super Administrator' },
    { email: 'dist@swasthapath.com', role: 'dist_admin', name: 'District Administrator' },
    { email: 'sub@swasthapath.com', role: 'sub_admin', name: 'Sub-District Administrator' }
  ];

  for (const admin of admins) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, admin.email, 'password123');
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: admin.email,
        role: admin.role,
        name: admin.name,
        createdAt: Date.now()
      });
      console.log(`Created ${admin.role} successfully`);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
         console.log(`${admin.email} already exists.`);
      } else {
         console.error(`Error creating ${admin.role}:`, e.message);
      }
    }
  }
  process.exit(0);
}

seed();
