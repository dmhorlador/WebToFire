/* ==========================================================================
   students.js
   Firestore CRUD helpers for student records.
   Each student document lives in the top-level "students" collection and
   is tagged with the uid of the user who created it, so every signed-in
   user only ever sees and manages their own records.
   Relies on `db` and `auth` from firebase-config.js
   ========================================================================== */

const STUDENTS_COLLECTION = "students";

/**
 * Adds a new student document for the currently signed-in user.
 * @param {Object} studentData - { name, email, phone, course, year, status }
 */
async function addStudent(studentData) {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to add a student.");

  return db.collection(STUDENTS_COLLECTION).add({
    ...studentData,
    ownerId: user.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Updates an existing student document by id.
 * @param {string} studentId
 * @param {Object} studentData
 */
async function updateStudent(studentId, studentData) {
  return db.collection(STUDENTS_COLLECTION).doc(studentId).update({
    ...studentData,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Deletes a student document by id.
 * @param {string} studentId
 */
async function deleteStudent(studentId) {
  return db.collection(STUDENTS_COLLECTION).doc(studentId).delete();
}

/**
 * Subscribes to real-time updates for the current user's students.
 * @param {Function} onData - called with an array of student objects (id included)
 * @param {Function} onError - called with the error if the listener fails
 * @returns {Function} unsubscribe function
 */
function listenToStudents(onData, onError) {
  const user = auth.currentUser;
  if (!user) return () => {};

  return db.collection(STUDENTS_COLLECTION)
    .where("ownerId", "==", user.uid)
    .onSnapshot(
      (snapshot) => {
        const students = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        onData(students);
      },
      (error) => {
        console.error("Error listening to students:", error);
        if (onError) onError(error);
      }
    );
}
