/* ==========================================================================
   students.js
   Realtime Database CRUD helpers for student records.
   Each student record lives under "students/{studentId}" and is tagged
   with the uid of the user who created it, so every signed-in user only
   ever sees and manages their own records.
   Relies on `db` and `auth` from firebase-config.js
   ========================================================================== */

const STUDENTS_PATH = "students";

/**
 * Adds a new student record for the currently signed-in user.
 * @param {Object} studentData - { name, email, phone, course, year, status }
 */
async function addStudent(studentData) {
  const user = auth.currentUser;
  if (!user) {
    console.error("No user signed in");
    throw new Error("You must be signed in to add a student.");
  }

  console.log("Adding student:", studentData);
  console.log("Current user:", user.uid);
  console.log("Database URL:", db.ref().toString());

  try {
    const newRef = db.ref(STUDENTS_PATH).push();
    console.log("New reference created:", newRef.toString());
    
    const dataToSave = {
      ...studentData,
      ownerId: user.uid,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    console.log("Data to save:", dataToSave);
    await newRef.set(dataToSave);
    console.log("Student saved successfully!");
    return newRef;
  } catch (error) {
    console.error("Error in addStudent:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
}

/**
 * Updates an existing student record by id.
 * @param {string} studentId
 * @param {Object} studentData
 */
async function updateStudent(studentId, studentData) {
  return db.ref(`${STUDENTS_PATH}/${studentId}`).update({
    ...studentData,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  });
}

/**
 * Deletes a student record by id.
 * @param {string} studentId
 */
async function deleteStudent(studentId) {
  return db.ref(`${STUDENTS_PATH}/${studentId}`).remove();
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

  const studentsRef = db.ref(STUDENTS_PATH).orderByChild("ownerId").equalTo(user.uid);

  const handleValue = (snapshot) => {
    const students = [];
    snapshot.forEach((childSnap) => {
      students.push({ id: childSnap.key, ...childSnap.val() });
    });
    onData(students);
  };

  const handleError = (error) => {
    console.error("Error listening to students:", error);
    if (onError) onError(error);
  };

  studentsRef.on("value", handleValue, handleError);

  // Return an unsubscribe function so callers can detach the listener.
  return () => studentsRef.off("value", handleValue);
}
