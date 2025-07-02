// src/app/components/TiptapEditor.tsx (Versi Final & Terkoreksi)
'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';

// Impor ekstensi yang kita butuhkan
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';


// --- Toolbar ---
const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const addPlaceholder = () => {
    const placeholder = prompt("Masukkan nama placeholder (tanpa kurung kurawal), contoh: nama_lengkap");
    if (placeholder && placeholder.trim() !== '') {
      editor.chain().focus().insertContent(`{{${placeholder.trim().replace(/\s/g, '_')}}}`).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border bg-gray-50 p-2">
      {/* Heading Controls */}
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'rounded bg-gray-300 p-1.5 font-bold' : 'rounded p-1.5 font-bold hover:bg-gray-200'}>H1</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'rounded bg-gray-300 p-1.5 font-bold' : 'rounded p-1.5 font-bold hover:bg-gray-200'}>H2</button>
      
      <div className="mx-1 h-5 w-px bg-gray-300"></div>

      {/* Text Style Controls */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'rounded bg-gray-300 p-1.5' : 'rounded p-1.5 hover:bg-gray-200'}><b>B</b></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'rounded bg-gray-300 p-1.5' : 'rounded p-1.5 hover:bg-gray-200'}><i>I</i></button>
      
      <div className="mx-1 h-5 w-px bg-gray-300"></div>

      {/* Alignment Controls */}
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'rounded bg-gray-300 p-1.5' : 'rounded p-1.5 hover:bg-gray-200'}>L</button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'rounded bg-gray-300 p-1.5' : 'rounded p-1.5 hover:bg-gray-200'}>C</button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'rounded bg-gray-300 p-1.5' : 'rounded p-1.5 hover:bg-gray-200'}>R</button>

      <div className="mx-1 h-5 w-px bg-gray-300"></div>

      {/* List & Rule Controls */}
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'rounded bg-gray-300 p-1.5' : 'rounded p-1.5 hover:bg-gray-200'}>List</button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="rounded p-1.5 hover:bg-gray-200">---</button>

      <div className="mx-1 h-5 w-px bg-gray-300"></div>

      {/* Table Controls */}
      <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="rounded p-1.5 text-sm hover:bg-gray-200">Tabel</button>
      <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} disabled={!editor.can().addColumnBefore()} className="rounded p-1.5 text-sm hover:bg-gray-200 disabled:opacity-50">+Kolom</button>
      <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()} className="rounded p-1.5 text-sm text-red-500 hover:bg-gray-200 disabled:opacity-50">Hapus Tabel</button>

      {/* Placeholder - Pindah ke ujung kanan */}
      <div className="flex-grow"></div>
      <button type="button" onClick={addPlaceholder} className="rounded bg-primary/10 p-1.5 text-sm font-semibold text-primary hover:bg-primary/20">Sisipkan Data</button>
    </div>
  );
};

// --- Komponen Editor Utama ---
const TiptapEditor = ({ content, onChange }: { content: string, onChange: (richText: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      // Konfigurasi Table agar bisa di-resize
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'smartgov-editor',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="rounded-lg border bg-gray-100 p-2 shadow-inner sm:p-4">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;