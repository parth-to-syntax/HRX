/**
 * Upload API endpoints
 * Handles file uploads (avatars, documents, etc.)
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Upload avatar image
 * @param {File} file - Image file to upload
 * @returns {Promise<{success: boolean, avatar_url: string, message: string}>}
 */
export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await fetch(`${API_URL}/upload/avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData // Don't set Content-Type, let browser set it with boundary
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to upload avatar' }))
    throw new Error(error.error || `HTTP ${response.status}: Failed to upload avatar`)
  }

  return response.json()
}

/**
 * Delete current user's avatar
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteAvatar() {
  const response = await fetch(`${API_URL}/upload/avatar`, {
    method: 'DELETE',
    credentials: 'include'
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete avatar' }))
    throw new Error(error.error || `HTTP ${response.status}: Failed to delete avatar`)
  }

  return response.json()
}
