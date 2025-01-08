import { useState, useRef } from 'react'
import { X, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface FileUploadProps {
  onUpload: (fileUrl: string, fileName: string) => void
  onClose: () => void
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const { data, error } = await supabase.storage
        .from('message_attachments')
        .upload(`uploads/${file.name}`, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('message_attachments')
        .getPublicUrl(`uploads/${file.name}`)

      onUpload(publicUrlData.publicUrl, file.name)
    } catch (error: any) {
      console.error('Error uploading file:', error)
      alert(`Failed to upload file: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Upload File</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>
        <div
          className={`border-2 border-dashed ${dragOver ? 'border-blue-500' : 'border-gray-300'
            } rounded-lg p-8 text-center cursor-pointer`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-300">
            {uploading ? 'Uploading...' : 'Drag and drop a file here, or click to select a file'}
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center p-2 border border-gray-300 rounded-lg hover:bg-gray-200 transition duration-200"
          >
            <Upload size={24} className="mr-2" />
            <span>Upload File</span>
          </button>
        </div>
      </div>
    </div>
  )
}

