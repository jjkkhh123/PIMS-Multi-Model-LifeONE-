import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DiaryEntry } from '../types.ts';
import { AddIcon, EditIcon, DeleteIcon, SaveIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, ListUnorderedIcon, ImageIcon, TextColorIcon, FontSizeIcon } from './icons.tsx';

// Props
interface DiaryListProps {
  diaryEntries: DiaryEntry[];
  onAdd?: (entry: Omit<DiaryEntry, 'id'>) => void;
  onUpdate?: (entry: DiaryEntry) => void;
  onDelete?: (id: string) => void;
}

// Form component for adding/editing
interface DiaryFormProps {
    entry?: DiaryEntry;
    onSave: (entry: DiaryEntry | Omit<DiaryEntry, 'id'>) => void;
    onCancel: () => void;
    allGroupNames: string[];
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const DiaryForm: React.FC<DiaryFormProps> = ({ entry, onSave, onCancel, allGroupNames }) => {
    const [date, setDate] = useState(entry?.date || new Date().toISOString().split('T')[0]);
    const [group, setGroup] = useState(entry?.group || '기타');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(entry?.imageUrl || null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const savedRange = useRef<Range | null>(null);

    useEffect(() => {
        if (editorRef.current) {
            const initialContent = entry?.entry || '';
            if (editorRef.current.innerHTML !== initialContent) {
                editorRef.current.innerHTML = initialContent;
            }
        }
    }, [entry]);

    const applyFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    const handleFormatClick = (e: React.MouseEvent, command: string, value?: string) => {
        e.preventDefault();
        applyFormat(command, value);
    };

    const handleEditorBlur = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            savedRange.current = selection.getRangeAt(0);
        }
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, command: string) => {
        const value = e.target.value;
        if (!editorRef.current) return;

        editorRef.current.focus();

        if (savedRange.current) {
            const selection = window.getSelection();
            if (selection && editorRef.current.contains(savedRange.current.commonAncestorContainer)) {
                selection.removeAllRanges();
                selection.addRange(savedRange.current);
            }
        }
        
        applyFormat(command, value);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalContent = editorRef.current?.innerHTML || '';
        if (!finalContent.trim() && !imageFile && !imagePreview) return;

        let imageUrl: string | null = imagePreview;
        let imageName: string | null = entry?.imageName || null;

        if (imageFile) {
            imageUrl = await fileToBase64(imageFile);
            imageName = imageFile.name;
        }

        onSave({
            ...(entry || {}),
            date,
            entry: finalContent,
            group: group.trim() || '기타',
            imageUrl,
            imageName,
        });
    };
    
    const colors = ['#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff'];
    const fontSizes = [1, 2, 3, 4, 5, 6, 7]; // Corresponds to <font size="...">

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg space-y-3 my-4 border border-gray-200">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-100 rounded-md border border-gray-200">
                {/* Style Buttons */}
                <button type="button" title="굵게" onMouseDown={e => handleFormatClick(e, 'bold')} className="p-2 hover:bg-gray-200 rounded"><BoldIcon className="h-4 w-4" /></button>
                <button type="button" title="기울임" onMouseDown={e => handleFormatClick(e, 'italic')} className="p-2 hover:bg-gray-200 rounded"><ItalicIcon className="h-4 w-4" /></button>
                <button type="button" title="밑줄" onMouseDown={e => handleFormatClick(e, 'underline')} className="p-2 hover:bg-gray-200 rounded"><UnderlineIcon className="h-4 w-4" /></button>
                <button type="button" title="취소선" onMouseDown={e => handleFormatClick(e, 'strikeThrough')} className="p-2 hover:bg-gray-200 rounded"><StrikethroughIcon className="h-4 w-4" /></button>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                {/* List Button */}
                <button type="button" title="글머리 기호 목록" onMouseDown={e => handleFormatClick(e, 'insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded"><ListUnorderedIcon className="h-4 w-4" /></button>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                {/* Align Buttons */}
                <button type="button" title="왼쪽 정렬" onMouseDown={e => handleFormatClick(e, 'justifyLeft')} className="p-2 hover:bg-gray-200 rounded"><AlignLeftIcon className="h-4 w-4" /></button>
                <button type="button" title="가운데 정렬" onMouseDown={e => handleFormatClick(e, 'justifyCenter')} className="p-2 hover:bg-gray-200 rounded"><AlignCenterIcon className="h-4 w-4" /></button>
                <button type="button" title="오른쪽 정렬" onMouseDown={e => handleFormatClick(e, 'justifyRight')} className="p-2 hover:bg-gray-200 rounded"><AlignRightIcon className="h-4 w-4" /></button>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                {/* Font Size Dropdown */}
                 <select title="글자 크기" onChange={e => handleSelectChange(e, 'fontSize')} className="p-1 border-none bg-transparent hover:bg-gray-200 rounded text-sm focus:outline-none">
                    <option value="">크기</option>
                    {fontSizes.map(size => <option key={size} value={String(size)}>{size}</option>)}
                </select>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                {/* Color Palette */}
                 <div className="flex items-center gap-1">
                    {colors.map(color => (
                        <button type="button" key={color} title="글자 색상" onMouseDown={e => handleFormatClick(e, 'foreColor', color)} className="w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: color }}></button>
                    ))}
                </div>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                {/* Image Button */}
                <button type="button" title="이미지 추가" onMouseDown={e => {e.preventDefault(); fileInputRef.current?.click()}} className="p-2 hover:bg-gray-200 rounded"><ImageIcon className="h-4 w-4" /></button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onBlur={handleEditorBlur}
                className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[120px] resize-y"
            />
             {imagePreview && (
                <div className="relative w-40 h-40">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                    <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-black bg-opacity-70 text-white rounded-full p-1 leading-none text-xs"
                    >
                        ✕
                    </button>
                </div>
            )}
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                     <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                    />
                    <input
                        type="text"
                        list="group-suggestions"
                        placeholder="그룹"
                        value={group}
                        onChange={e => setGroup(e.target.value)}
                        className="p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <datalist id="group-suggestions">
                        {allGroupNames.map(g => <option key={g} value={g} />)}
                    </datalist>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={onCancel} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                        취소
                    </button>
                    <button type="submit" className="px-3 py-1 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 flex items-center gap-1">
                        <SaveIcon className="h-4 w-4" />
                        저장
                    </button>
                </div>
            </div>
        </form>
    );
};


export const DiaryList: React.FC<DiaryListProps> = ({ diaryEntries, onAdd, onUpdate, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'content-asc'>('date-desc');
    const readOnly = !onAdd || !onUpdate || !onDelete;

    const allGroupNames = useMemo(() => 
        Array.from(new Set(diaryEntries.map(e => e.group || '기타'))).sort((a: string, b: string) => a.localeCompare(b, 'ko'))
    , [diaryEntries]);

    const sortedEntries = useMemo(() => {
        return [...diaryEntries].sort((a, b) => {
            if (sortOrder === 'content-asc') {
                return a.entry.localeCompare(b.entry, 'ko');
            }
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'date-desc' ? dateB - dateA : dateA - dateB;
        });
    }, [diaryEntries, sortOrder]);

    const groupedEntries = useMemo(() => {
        return sortedEntries.reduce((acc, entry) => {
            const groupName = entry.group || '기타';
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(entry);
            return acc;
        }, {} as Record<string, DiaryEntry[]>);
    }, [sortedEntries]);

    const sortedGroupNames = useMemo(() => {
        return Object.keys(groupedEntries).sort((a, b) => {
            if (a === 'To-do list') return -1;
            if (b === 'To-do list') return 1;
            if (a === '기타') return 1;
            if (b === '기타') return -1;
            return a.localeCompare(b, 'ko');
        });
    }, [groupedEntries]);

    const handleSaveNew = (entry: Omit<DiaryEntry, 'id'>) => {
        onAdd?.(entry);
        setIsAdding(false);
    };

    const handleSaveUpdate = (entry: DiaryEntry) => {
        onUpdate?.(entry);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        onDelete?.(id);
    };

    const handleToggleChecklistItem = (diaryEntryId: string, itemId: string) => {
        if (!onUpdate) return;

        const diaryEntry = diaryEntries.find(d => d.id === diaryEntryId);
        if (!diaryEntry || !diaryEntry.checklistItems) return;

        const updatedItems = diaryEntry.checklistItems.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );

        onUpdate({ ...diaryEntry, checklistItems: updatedItems });
    };
    
    const controlsHeader = (
      <div className="flex justify-between items-center mb-4">
          {!readOnly ? (
              <button 
                  onClick={() => { setIsAdding(true); setEditingId(null); }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 disabled:bg-cyan-700 disabled:cursor-not-allowed"
                  disabled={isAdding || !!editingId}
              >
                  <AddIcon className="h-5 w-5" />
                  새 메모 추가
              </button>
          ) : <div />}
          {diaryEntries.length > 0 && (
              <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'date-desc' | 'date-asc' | 'content-asc')}
                  className="bg-gray-100 text-gray-800 border border-gray-300 text-sm rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  aria-label="메모 정렬"
              >
                  <option value="date-desc">최신순</option>
                  <option value="date-asc">오래된순</option>
                  <option value="content-asc">가나다순</option>
              </select>
          )}
      </div>
    );
    
    return (
        <div className="space-y-4">
            {controlsHeader}

            {isAdding && !readOnly && <DiaryForm onSave={handleSaveNew} onCancel={() => setIsAdding(false)} allGroupNames={allGroupNames} />}
            
            {diaryEntries.length === 0 && !isAdding && (
                <div className="text-center py-10 text-gray-500">
                    <p>저장된 메모가 없습니다.</p>
                    {!readOnly && <p className="text-sm mt-1">'새 메모 추가' 버튼을 눌러 시작하세요.</p>}
                </div>
            )}

            {diaryEntries.length > 0 && (
                 <div className="space-y-5">
                    {sortedGroupNames.map(groupName => (
                        <div key={groupName}>
                            <h4 className="text-sm font-bold uppercase text-gray-500 mb-2 px-1 tracking-wider">{groupName}</h4>
                            <div className="space-y-3">
                                {groupedEntries[groupName].map(entry => (
                                    editingId === entry.id && !readOnly ? (
                                        <DiaryForm 
                                            key={entry.id} 
                                            entry={entry} 
                                            onSave={(e) => handleSaveUpdate(e as DiaryEntry)} 
                                            onCancel={() => setEditingId(null)}
                                            allGroupNames={allGroupNames}
                                        />
                                    ) : (
                                        <div key={entry.id} className="p-4 bg-white border border-gray-200 rounded-lg group">
                                           <div className="flex justify-between items-start">
                                                <p className="text-sm text-gray-500 mb-2 font-medium">{entry.date}</p>
                                                {!readOnly && (
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEditingId(entry.id); setIsAdding(false); }} className="p-1 text-gray-500 hover:text-cyan-600" disabled={isAdding || !!editingId}>
                                                            <EditIcon className="h-5 w-5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(entry.id)} className="p-1 text-gray-500 hover:text-red-500">
                                                            <DeleteIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                )}
                                           </div>
                                           {entry.imageUrl && (
                                                <img src={entry.imageUrl} alt={entry.imageName || 'Attached image'} className="max-w-full h-auto rounded-md my-2" />
                                           )}
                                           {entry.isChecklist && entry.checklistItems ? (
                                                <div>
                                                    <p className="text-gray-800 font-bold mb-3">{entry.entry}</p>
                                                    <div className="space-y-2">
                                                        {entry.checklistItems.map(item => (
                                                            <div key={item.id} className="flex items-center gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`item-${item.id}`}
                                                                    checked={item.completed}
                                                                    onChange={() => handleToggleChecklistItem(entry.id, item.id)}
                                                                    disabled={readOnly}
                                                                    className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                />
                                                                <label htmlFor={`item-${item.id}`} className={`flex-grow ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                                    {item.text}
                                                                </label>
                                                                {item.dueDate && (
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${item.completed ? 'bg-gray-100 text-gray-400' : 'bg-cyan-100 text-cyan-700'}`}>
                                                                        {item.dueDate}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: entry.entry }} />
                                            )}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                 </div>
            )}
        </div>
    );
};