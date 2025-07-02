// src/app/components/TiptapEditor.tsx (Versi Final & Terkoreksi)
'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect } from 'react';

// Impor ekstensi yang kita butuhkan
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { FontSize } from './tiptap-extensions/FontSize';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';


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
  const setTablePadding = (padding: string) => {
      editor.chain().focus().selectAll().setCellAttribute('style', `padding: ${padding}`).run();
    };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border bg-gray-50 p-2">
      <div className="flex flex-wrap items-center gap-1 p-2">
        {/* --- PERUBAHAN: Tambahkan Kontrol Font Size --- */}
        <select
          value={editor.getAttributes('textStyle').fontSize || '12pt'}
          onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
          className="rounded border-gray-300 text-sm focus:ring-primary"
        >
          <option value="10pt">10</option>
          <option value="11pt">11</option>
          <option value="12pt">12 (Default)</option>
          <option value="14pt">14</option>
          <option value="16pt">16</option>
          <option value="18pt">18</option>
          <option value="19pt">19</option>
          <option value="20pt">20</option>
          <option value="23pt">23</option>
          <option value="25pt">25</option>
        </select>
        </div>
      {/* Heading Controls */}
      
      <div className="mx-1 h-5 w-px bg-gray-300"></div>

      {/* Text Style Controls */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'rounded bg-gray-300 p-1.5' : 'rounded p-1.5 hover:bg-gray-200'}><b>B</b></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'rounded bg-gray-300 p-1.5' : 'rounded p-1.5 hover:bg-gray-200'}><i>I</i></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'rounded bg-gray-300 p-1.5' : 'rounded p-1.5 hover:bg-gray-200'}><u>U</u></button>
      
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
      {editor.isActive('table') && (
        <div className="flex flex-wrap items-center gap-1 border-t bg-gray-100 p-2">
          <span className="mr-2 text-xs font-bold text-gray-500">TABEL:</span>
          <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="rounded p-1.5 text-sm hover:bg-gray-200">Tambah Kolom Kiri</button>
          <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="rounded p-1.5 text-sm hover:bg-gray-200">Tambah Kolom Kanan</button>
          <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="rounded p-1.5 text-sm text-red-600 hover:bg-gray-200">Hapus Kolom</button>
          <div className="mx-1 h-5 w-px bg-gray-300"></div>
          <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="rounded p-1.5 text-sm hover:bg-gray-200">Tambah Baris Atas</button>
          <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="rounded p-1.5 text-sm hover:bg-gray-200">Tambah Baris Bawah</button>
          <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="rounded p-1.5 text-sm text-red-600 hover:bg-gray-200">Hapus Baris</button>
          <div className="mx-1 h-5 w-px bg-gray-300"></div>
          <button type="button" onClick={() => editor.chain().focus().mergeOrSplit().run()} className="rounded p-1.5 text-sm hover:bg-gray-200">Gabung/Pisah Sel</button>
          <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="rounded p-1.5 text-sm text-red-600 hover:bg-gray-200">Hapus Tabel</button>
          <div className="mx-1 h-5 w-px bg-gray-300"></div>
          <span className="mr-2 text-xs font-bold text-gray-500">SPASI SEL:</span>
          <button type="button" onClick={() => setTablePadding('2px')} className="rounded p-1.5 text-sm hover:bg-gray-200">Rapat</button>
          <button type="button" onClick={() => setTablePadding('4px')} className="rounded p-1.5 text-sm hover:bg-gray-200">Normal</button>
          <button type="button" onClick={() => setTablePadding('8px')} className="rounded p-1.5 text-sm hover:bg-gray-200">Renggang</button>
        </div>
      )}
    </div>
  );
};

// --- Komponen Editor Utama ---
const TiptapEditor = ({ content, onChange }: { content: string, onChange: (richText: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,    // Dasar untuk ekstensi kustom kita
      FontSize,
      // Konfigurasi Table agar bisa di-resize
      Table.configure({
        resizable: true,
      }),
      Underline,
      TableRow,
      TableHeader,
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            // Izinkan atribut 'style' untuk menyimpan padding
            style: {
              default: null,
            },
          };
        },
        content: 'block+',
      }),
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

   useEffect(() => {
    if (!editor) {
      return;
    }
    // Cek jika konten prop berbeda dengan konten di editor
    const isSame = editor.getHTML() === content;
    if (!isSame) {
      // Perintahkan editor untuk mengatur kontennya sesuai prop yang baru
      // `false` mencegah onUpdate terpicu lagi untuk menghindari loop tak terbatas
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  return (
    <div className="rounded-lg border bg-gray-100 p-2 shadow-inner sm:p-4">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;