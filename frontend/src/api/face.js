import client from './client';

/**
 * Enroll face photo for recognition
 * @param {string} photoDataUrl - Base64 encoded image data URL
 * @param {number} qualityScore - Optional face detection quality (0-1)
 */
export async function enrollFace(photoDataUrl, qualityScore = null) {
  const { data } = await client.post('/face/enroll', { 
    photoDataUrl, 
    qualityScore 
  });
  return data;
}

/**
 * Get current user's face enrollment status
 */
export async function getMyEnrollment() {
  const { data } = await client.get('/face/enrollment/me');
  return data;
}

/**
 * Delete current user's face enrollment
 */
export async function deleteMyEnrollment() {
  const { data } = await client.delete('/face/enrollment/me');
  return data;
}

/**
 * Check-in using facial recognition
 * @param {string} photoDataUrl - Base64 encoded image data URL
 * @param {string} date - Optional date (YYYY-MM-DD)
 */
export async function checkInWithFace(photoDataUrl, date = null) {
  const { data } = await client.post('/face/checkin', { 
    photoDataUrl,
    date 
  });
  return data;
}

/**
 * Get face check-in statistics for current user
 */
export async function getMyFaceStats() {
  const { data } = await client.get('/face/stats/me');
  return data;
}
