import { supabase } from '@/lib/supabase'

export async function uploadBillImage(userId: string, file: File) {
  const extension = file.name.split('.').pop() ?? 'jpg'
  const filePath = `${userId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from('bill-images')
    .upload(filePath, file)

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from('bill-images').getPublicUrl(filePath)
  return data.publicUrl
}

export async function uploadPaymentScreenshot(userId: string, file: File) {
  const extension = file.name.split('.').pop() ?? 'jpg'
  const filePath = `${userId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from('payment-screenshots')
    .upload(filePath, file)

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from('payment-screenshots').getPublicUrl(filePath)
  return data.publicUrl
}

export async function uploadAvatar(userId: string, file: File) {
  const extension = file.name.split('.').pop() ?? 'jpg'
  // Use a fixed filename per user so re-uploads replace the old one
  const filePath = `${userId}/avatar.${extension}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, cacheControl: '3600' })

  if (error) {
    throw new Error(error.message)
  }

  // Bust the CDN cache by appending a timestamp query param
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
  return `${data.publicUrl}?t=${Date.now()}`
}
