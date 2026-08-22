import { Auth, createUserWithEmailAndPassword } from 'firebase/auth';

const devUsers = [
  { email: 'admin@matondelo.com', password: 'password' },
  { email: 'user@matondelo.com', password: 'password' },
];

let seeded = false;

/**
 * Creates development users if they don't exist.
 * This is a non-blocking, fire-and-forget operation for development convenience.
 * It attempts to create users and ignores 'auth/email-already-in-use' errors.
 */
export const seedDevUsers = (auth: Auth): void => {
  if (seeded || process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log('Attempting to seed development users...');

  devUsers.forEach(user => {
    createUserWithEmailAndPassword(auth, user.email, user.password)
      .then(userCredential => {
        console.log(`Successfully created or verified dev user: ${userCredential.user.email}`);
      })
      .catch(error => {
        if (error.code === 'auth/email-already-in-use') {
          // This is expected and fine, the user already exists.
          // console.log(`Dev user ${user.email} already exists.`);
        } else {
          // Log other errors for debugging, but don't crash the app.
          console.error(`Error creating dev user ${user.email}:`, error);
        }
      });
  });

  seeded = true; // Mark as seeded to prevent re-running in the same session.
};
