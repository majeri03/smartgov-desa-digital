// src/components/TiptapEditor.tsx
'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';

// Komponen Toolbar untuk tombol-tombol aksi
const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const addPlaceholder = () => {
    const placeholder = prompt("Masukkan nama placeholder (tanpa kurung kurawal), contoh: nama_lengkap");
    if (placeholder) {
      editor.chain().focus().insertContent(`{{${placeholder}}}`).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-t-lg border bg-gray-50 p-2">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'rounded bg-gray-200 p-1.5' : 'rounded p-1.5 hover:bg-gray-100'}><strong>B</strong></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'rounded bg-gray-200 p-1.5' : 'rounded p-1.5 hover:bg-gray-100'}><em>I</em></button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'rounded bg-gray-200 p-1.5' : 'rounded p-1.5 hover:bg-gray-100'}>List</button>
      <button type="button" onClick={addPlaceholder} className="rounded p-1.5 text-sm font-semibold hover:bg-gray-100">Sisipkan Placeholder</button>
    </div>
  );
};

// Komponen Editor Utama
const TiptapEditor = ({ content, onChange }: { content: string, onChange: (richText: string) => void }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose max-w-none rounded-b-lg border min-h-[300px] p-4 focus:outline-none',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;