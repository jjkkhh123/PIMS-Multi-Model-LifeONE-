import React, { useState, useEffect, useRef } from 'react';
import { ScheduleItem, ScheduleCategory } from '../types.ts';
import { AddIcon, EditIcon, DeleteIcon, SaveIcon, ClockIcon, LocationIcon } from './icons.tsx';

// Props for the form
interface ScheduleFormProps {
    scheduleItem?: ScheduleItem;
    onSave: (item: Omit<ScheduleItem, 'id'> | ScheduleItem) => void;
    onCancel: () => void;
    selectedDate: string; // YYYY-MM-DD
    categories: ScheduleCategory[];
    onAddCategory: (category: Omit<ScheduleCategory, 'id'>) => ScheduleCategory;
}

const getRandomColor = () => {
    const letters = '89ABCDEF'.split(''); // Brighter colors
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
};


const ScheduleForm: React.FC<ScheduleFormProps> = ({ scheduleItem, onSave, onCancel, selectedDate, categories, onAddCategory }) => {
    const [title, setTitle] = useState(scheduleItem?.title || '');
    const [time, setTime] = useState(scheduleItem?.time || '');
    const [location, setLocation] = useState(scheduleItem?.location || '');
    const [categoryId, setCategoryId] = useState(scheduleItem?.categoryId || 'default-uncategorized');
    const [isDday, setIsDday] = useState(scheduleItem?.isDday || false);

    // New state for creating a category
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(getRandomColor());

    const [suggestions, setSuggestions] = useState<ScheduleCategory[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTitle(value);
        
        const match = value.match(/@(\w*)$/);
        if (match) {
            const query = match[1].toLowerCase();
            const filtered = categories.filter(c => c.name.toLowerCase().includes(query) && c.id !== 'default-uncategorized');
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };
    
    const handleSuggestionClick = (category: ScheduleCategory) => {
        const newTitle = title.replace(/@(\w*)$/, '').trim();
        setTitle(newTitle);
        setCategoryId(category.id);
        setIsCreatingCategory(false);
        setShowSuggestions(false);
        titleInputRef.current?.focus();
    };

    const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setCategoryId(value);
        if (value === '__CREATE_NEW__') {
            setIsCreatingCategory(true);
            setNewCategoryName('');
            setNewCategoryColor(getRandomColor());
        } else {
            setIsCreatingCategory(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let finalTitle = title.trim();
        let finalCategoryId = categoryId;

        // If "Create New" is selected, handle it first.
        if (isCreatingCategory) {
            if (!newCategoryName.trim()) {
                alert('새 카테고리 이름을 입력해주세요.');
                return;
            }
            const existing = categories.find(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase());
            if (existing) {
                alert('이미 존재하는 카테고리 이름입니다.');
                return;
            }
            const newCategory = onAddCategory({
                name: newCategoryName.trim(),
                color: newCategoryColor,
            });
            finalCategoryId = newCategory.id;
        }

        // Always strip any potential @-tag from the title. The dropdown is the source of truth.
        finalTitle = finalTitle.replace(/@([^\s@]+)\s*$/, '').trim();
        
        if (!finalTitle) return;

        onSave({
            ...(scheduleItem || {}),
            title: finalTitle,
            date: selectedDate,
            time: time.trim() || undefined,
            location: location.trim() || undefined,
            categoryId: (finalCategoryId === 'default-uncategorized' || finalCategoryId === '__CREATE_NEW__') ? undefined : finalCategoryId,
            isDday: isDday,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg space-y-3 my-4 border border-gray-200">
             <div className="relative">
                <input
                    ref={titleInputRef}
                    type="text"
                    placeholder="일정 제목 (끝에 @카테고리)"
                    value={title}
                    onChange={handleTitleChange}
                    className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                    autoFocus
                />
                 {showSuggestions && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {suggestions.map(cat => (
                            <button
                                type="button"
                                key={cat.id}
                                onClick={() => handleSuggestionClick(cat)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <span className="w-3 h-3 rounded-full" style={{backgroundColor: cat.color}}></span>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                  type="time"
                  placeholder="시간 (선택 사항)"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
               <input
                    type="text"
                    placeholder="장소 (선택 사항)"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
            </div>
            <div>
                <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                    id="category-select"
                    value={categoryId}
                    onChange={handleCategorySelectChange}
                    className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    <option value="__CREATE_NEW__">새 카테고리 만들기...</option>
                </select>
            </div>

            {isCreatingCategory && (
                <div className="p-3 my-2 border border-gray-200 bg-white rounded-md space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">새 카테고리 정보</h4>
                    <input
                        type="text"
                        placeholder="카테고리 이름"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                    />
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">색상:</label>
                        <input
                            type="color"
                            value={newCategoryColor}
                            onChange={e => setNewCategoryColor(e.target.value)}
                            className="h-8 w-8 p-0 border-none rounded-md cursor-pointer"
                        />
                         <span className="text-sm text-gray-600 font-mono">{newCategoryColor.toUpperCase()}</span>
                    </div>
                </div>
            )}
            
             <div className="pt-2">
                <div className="flex items-center">
                    <input
                        id="is-dday-checkbox"
                        type="checkbox"
                        checked={isDday}
                        onChange={(e) => setIsDday(e.target.checked)}
                        className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                    />
                    <label htmlFor="is-dday-checkbox" className="ml-2 block text-sm text-gray-900">디데이로 설정</label>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    취소
                </button>
                <button type="submit" className="px-3 py-1 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 flex items-center gap-1">
                    <SaveIcon className="h-4 w-4" />
                    저장
                </button>
            </div>
        </form>
    );
};


interface ScheduleDetailModalProps {
  date: Date;
  items: ScheduleItem[];
  onClose: () => void;
  onAdd: (item: Omit<ScheduleItem, 'id'>) => void;
  onUpdate: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
  categories: ScheduleCategory[];
  onAddCategory: (category: Omit<ScheduleCategory, 'id'>) => ScheduleCategory;
  onUpdateCategory: (category: ScheduleCategory) => void;
}

export const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({ date, items, onClose, onAdd, onUpdate, onDelete, categories, onAddCategory }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateString = `${y}-${m}-${d}`;
    
    const formattedDate = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    const handleSaveNew = (item: Omit<ScheduleItem, 'id'>) => {
        onAdd(item);
        setIsAdding(false);
    };

    const handleSaveUpdate = (item: ScheduleItem) => {
        onUpdate(item);
        setEditingItem(null);
    };

    const handleDelete = (id: string) => {
        onDelete(id);
    };
    
    useEffect(() => {
        setIsAdding(false);
        setEditingItem(null);
    }, [date]);

    return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-cyan-700">{formattedDate}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-gray-50">
            {items.length === 0 && !isAdding && !editingItem && (
                 <div className="text-center py-10 text-gray-500">
                    <p>등록된 일정이 없습니다.</p>
                </div>
            )}
            
            {items.length > 0 && (
                <div className="space-y-3">
                    {items.map(item => {
                        const category = categories.find(c => c.id === item.categoryId);
                        const itemColor = category?.color || '#a1a1aa';
                        return (
                            editingItem?.id === item.id ? (
                                <ScheduleForm 
                                    key={item.id}
                                    scheduleItem={item}
                                    onSave={(updatedItem) => handleSaveUpdate(updatedItem as ScheduleItem)}
                                    onCancel={() => setEditingItem(null)}
                                    selectedDate={dateString}
                                    categories={categories}
                                    onAddCategory={onAddCategory}
                                />
                            ) : (
                                <div key={item.id} className="p-3 bg-white border-l-4 rounded-r-lg group" style={{ borderColor: itemColor }}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-800">{item.title}</p>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                {item.time && (
                                                    <span className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4" />{item.time}</span>
                                                )}
                                                {item.location && (
                                                    <span className="flex items-center gap-1.5"><LocationIcon className="h-4 w-4" />{item.location}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingItem(item); setIsAdding(false); }} className="p-1 text-gray-500 hover:text-cyan-600" disabled={isAdding || !!editingItem}>
                                                <EditIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-500 hover:text-red-500">
                                                <DeleteIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        )
                    })}
                </div>
            )}
            
            {isAdding && (
                 <ScheduleForm 
                    onSave={(newItem) => handleSaveNew(newItem as Omit<ScheduleItem, 'id'>)}
                    onCancel={() => setIsAdding(false)}
                    selectedDate={dateString}
                    categories={categories}
                    onAddCategory={onAddCategory}
                />
            )}
        </div>
        
        <div className="p-4 border-t border-gray-200 mt-auto bg-gray-50">
            <button
                onClick={() => { setIsAdding(true); setEditingItem(null); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 disabled:bg-cyan-700 disabled:cursor-not-allowed"
                disabled={isAdding || !!editingItem}
            >
                <AddIcon className="h-5 w-5" />
                새 일정 추가
            </button>
        </div>
      </div>
    </div>
    );
}