import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import CodeBlock from '@tiptap/extension-code-block'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-sql'
import React, { useEffect } from 'react'
import { Bold, Italic, UnderlineIcon, Strikethrough, Code, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify, SuperscriptIcon, SubscriptIcon, Heading1, Heading2, Heading3 } from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  onSubmit: () => void
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, onSubmit }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type your message...',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Superscript,
      Subscript,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor) {
      editor.on('update', () => {
        Prism.highlightAll()
      })
    }
  }, [editor])

  if (!editor) {
    return null
  }

  const toggleHeading = (level: 1 | 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run()
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="bg-gray-100 dark:bg-gray-700 p-1 flex flex-wrap items-center gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${editor.isActive('bold') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded ${editor.isActive('italic') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 rounded ${editor.isActive('underline') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1 rounded ${editor.isActive('strike') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <Strikethrough size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1 rounded ${editor.isActive('code') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <Code size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1 rounded ${editor.isActive('blockquote') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <Quote size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <AlignRight size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <AlignJustify size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`p-1 rounded ${editor.isActive('superscript') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <SuperscriptIcon size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`p-1 rounded ${editor.isActive('subscript') ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <SubscriptIcon size={16} />
        </button>
        <button
          onClick={() => toggleHeading(1)}
          className={`p-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => toggleHeading(2)}
          className={`p-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={() => toggleHeading(3)}
          className={`p-1 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
        >
          <Heading3 size={16} />
        </button>
      </div>
      <div className="editor-content-wrapper overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
        <EditorContent 
          editor={editor} 
          className="p-2 min-h-[100px] max-h-[200px]"
        />
      </div>
    </div>
  )
}

export default RichTextEditor

