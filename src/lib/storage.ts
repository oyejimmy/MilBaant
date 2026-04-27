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
