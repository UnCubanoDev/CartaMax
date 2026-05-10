import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

export function StorageImage({ bucket, path, className }: {
  bucket: string
  path: string | null
  className?: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!path) { setLoading(false); return }

    const filePath = path.startsWith('http')
      ? path.split(`/public/${bucket}/`)[1] || path
      : path

    supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600)
      .then(({ data }) => {
        setUrl(data?.signedUrl ?? null)
        setLoading(false)
      })
  }, [bucket, path])

  if (loading) return <Skeleton className={className || 'w-full h-48'} />
  if (!url) return null
  return <img src={url} alt={bucket} className={className || 'w-full rounded'} />
}
