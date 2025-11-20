
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ScheduleItem, ScheduleCategory } from '../types.ts';
import { ClockIcon, EditIcon, DeleteIcon } from './icons.tsx';
import { MonthYearPicker } from './MonthYearPicker.tsx';
import { ScheduleDetailModal } from './ScheduleDetailModal.tsx';

interface CalendarViewProps {
  scheduleItems: ScheduleItem[];
  categories: ScheduleCategory[];
  onAdd: (item: Omit<ScheduleItem, 'id'>) => void;
  onUpdate: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
  onAddCategory: (category: Omit<ScheduleCategory, 'id'>) => ScheduleCategory;
  onUpdateCategory: (category: ScheduleCategory) => void;
  onDeleteCategory: (id: string) => void;
  navigationRequest?: { date: string } | null;
}

const toYYYYMMDD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 한국 공휴일 계산 (고정 공휴일 + 2024~2026 주요 변동 공휴일)
const getKoreanHoliday = (date: Date): string | null => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const dateString = toYYYYMMDD(date);
    const mdString = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 1. 양력 고정 공휴일
    const fixedHolidays: Record<string, string> = {
        '01-01': '신정',
        '03-01': '삼일절',
        '05-05': '어린이날',
        '06-06': '현충일',
        '08-15': '광복절',
        '10-03': '개천절',
        '10-09': '한글날',
        '12-25': '크리스마스' // 성탄절
    };

    if (fixedHolidays[mdString]) {
        return fixedHolidays[mdString];
    }

    // 2. 음력 변동 공휴일 및 대체공휴일 (2024-2026 하드코딩)
    // 실제 서비스에서는 라이브러리나 API를 사용하는 것이 좋으나, 오프라인 데모를 위해 주요 날짜 매핑
    const variableHolidays: Record<string, string> = {
        // 2024년
        '2024-02-09': '설날 연휴', '2024-02-10': '설날', '2024-02-11': '설날 연휴', '2024-02-12': '대체공휴일',
        '2024-04-10': '국회의원 선거',
        '2024-05-06': '대체공휴일',
        '2024-05-15': '부처님오신날',
        '2024-09-16': '추석 연휴', '2024-09-17': '추석', '2024-09-18': '추석 연휴',
        
        // 2025년
        '2025-01-28': '설날 연휴', '2025-01-29': '설날', '2025-01-30': '설날 연휴',
        '2025-03-03': '대체공휴일',
        '2025-05-06': '대체공휴일', // 어린이날, 부처님오신날 겹침 등 고려
        '2025-05-05': '어린이날/부처님오신날', // 겹침
        '2025-10-05': '추석 연휴', '2025-10-06': '추석', '2025-10-07': '추석 연휴', '2025-10-08': '대체공휴일',

        // 2026년
        '2026-02-16': '설날 연휴', '2026-02-17': '설날', '2026-02-18': '설날 연휴',
        '2026-05-24': '부처님오신날', '2026-05-25': '대체공휴일',
        '2026-09-24': '추석 연휴', '2026-09-25': '추석', '2026-09-26': '추석 연휴'
    };

    return variableHolidays[dateString] || null;
};

const calculateDday = (dateString: string): { text: string, isPast: boolean } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dateString.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day);
    eventDate.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return { text: 'D-DAY', isPast: false };
    } else if (diffDays > 0) {
        return { text: `D-${diffDays}`, isPast: false };
    } else {
        return { text: `D+${-diffDays}`, isPast: true };
    }
};

// Helper to determine if a color is light or dark for text contrast
const isLight = (color: string) => {
    const hex = color.replace('#', '');
    const c_r = parseInt(hex.substring(0, 2), 16);
    const c_g = parseInt(hex.substring(2, 4), 16);
    const c_b = parseInt(hex.substring(4, 6), 16);
    const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
    return brightness > 155;
};

const getRandomColor = () => {
    const letters = '89ABCDEF'.split(''); // Brighter colors
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
};

const CategoryAddModal: React.FC<{
    onSave: (category: Omit<ScheduleCategory, 'id'>) => void;
    onClose: () => void;
}> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(getRandomColor());
    const modalRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave({ name: name.trim(), color });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div ref={modalRef} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">새 카테고리 추가</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="cat-name-add" className="block text-sm font-medium text-gray-700">이름</label>
                        <input
                            id="cat-name-add"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full p-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="cat-color-add" className="block text-sm font-medium text-gray-700">색상</label>
                        <div className="mt-1 flex items-center gap-2">
                            <input
                                id="cat-color-add"
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-10 w-10 p-1 border border-gray-300 rounded-md cursor-pointer"
                            />
                            <span className="px-3 py-1 rounded-md" style={{ backgroundColor: color, color: isLight(color) ? '#000' : '#fff' }}>{color.toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">취소</button>
                        <button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600">추가</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const CategoryEditModal: React.FC<{
    category: ScheduleCategory;
    onSave: (category: ScheduleCategory) => void;
    onClose: () => void;
}> = ({ category, onSave, onClose }) => {
    const [name, setName] = useState(category.name);
    const [color, setColor] = useState(category.color);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave({ ...category, name: name.trim(), color });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div ref={modalRef} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">카테고리 수정</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700">이름</label>
                        <input
                            id="cat-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full p-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="cat-color" className="block text-sm font-medium text-gray-700">색상</label>
                        <div className="mt-1 flex items-center gap-2">
                            <input
                                id="cat-color"
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-10 w-10 p-1 border border-gray-300 rounded-md cursor-pointer"
                            />
                            <span className="px-3 py-1 rounded-md" style={{ backgroundColor: color, color: isLight(color) ? '#000' : '#fff' }}>{color.toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">취소</button>
                        <button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600">저장</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const CalendarView: React.FC<CalendarViewProps> = ({ 
    scheduleItems, 
    categories,
    onAdd, 
    onUpdate, 
    onDelete,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    navigationRequest
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null); // null for all
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; category: ScheduleCategory } | null>(null);
  const [editingCategory, setEditingCategory] = useState<ScheduleCategory | null>(null);
  const [showHolidays, setShowHolidays] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // React to navigation requests from parent (App.tsx)
  useEffect(() => {
    if (navigationRequest && navigationRequest.date) {
        const targetDate = new Date(navigationRequest.date);
        if (!isNaN(targetDate.getTime())) {
            setCurrentDate(targetDate);
            setSelectedDate(targetDate);
        }
    }
  }, [navigationRequest]);

  const filteredScheduleItems = useMemo(() => {
    if (!activeFilter) return scheduleItems;
    if (activeFilter === 'default-uncategorized') {
      return scheduleItems.filter(item => !item.categoryId || item.categoryId === 'default-uncategorized');
    }
    return scheduleItems.filter(item => item.categoryId === activeFilter);
  }, [scheduleItems, activeFilter]);


  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const closeModal = () => {
    setSelectedDate(null);
  };
  
  const handleCategoryContextMenu = (e: React.MouseEvent, category: ScheduleCategory) => {
    e.preventDefault();
    if (category.id === 'default-uncategorized') return;
    setContextMenu({ x: e.clientX, y: e.clientY, category });
  };
  
  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        closeContextMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu]);

  const handleEditCategory = () => {
    if (contextMenu) {
      setEditingCategory(contextMenu.category);
      closeContextMenu();
    }
  };

  const handleDeleteCategoryClick = () => {
    if (contextMenu) {
      onDeleteCategory(contextMenu.category.id);
      closeContextMenu();
    }
  };

  const handleUpdateCategoryAndCloseModal = (updatedCategory: ScheduleCategory) => {
    onUpdateCategory(updatedCategory);
    setEditingCategory(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysInMonth = endOfMonth.getDate();

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="border border-gray-200"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const dateString = toYYYYMMDD(dayDate);
    const itemsForDay = filteredScheduleItems.filter(item => item.date === dateString);
    const ddayItemsForDay = itemsForDay.filter(item => item.isDday);
    const regularItemsForDay = itemsForDay.filter(item => !item.isDday);
    const isToday = new Date().toDateString() === dayDate.toDateString();

    const dayOfWeek = dayDate.getDay();
    const holidayName = showHolidays ? getKoreanHoliday(dayDate) : null;

    let dayColor = 'text-gray-700';
    // 일요일(0)이거나 공휴일이면 빨간색, 토요일(6)이면 파란색 (공휴일이 우선)
    if (dayOfWeek === 0 || holidayName) dayColor = 'text-red-500';
    else if (dayOfWeek === 6) dayColor = 'text-blue-500';

    const MAX_ITEMS_TO_SHOW = 3;
    let displayedItemCount = 0;

    days.push(
      <button
        key={i}
        onClick={() => handleDayClick(i)}
        className={`pt-1.5 px-2 border border-gray-200 text-left align-top ${isToday ? 'bg-cyan-50' : ''} min-h-[120px] transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 z-10 flex flex-col`}
      >
        <div className={`font-bold self-start flex justify-between w-full ${isToday ? 'text-cyan-600' : dayColor}`}>
            <span>{i}</span>
            {holidayName && <span className="text-[10px] font-normal truncate ml-1 pt-0.5">{holidayName}</span>}
        </div>
        <div className="mt-1 space-y-1 overflow-hidden flex-grow w-full">
          {ddayItemsForDay.map(item => {
            if (displayedItemCount >= MAX_ITEMS_TO_SHOW) return null;
            displayedItemCount++;
            const ddayInfo = calculateDday(item.date);
            return (
              <div key={item.id} className={`p-1 text-xs font-semibold rounded truncate ${ddayInfo.isPast ? 'bg-gray-200 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                  <span className="font-bold">{ddayInfo.text}</span> {item.title}
              </div>
            )
          })}
          {regularItemsForDay.map(item => {
              if (displayedItemCount >= MAX_ITEMS_TO_SHOW) return null;
              displayedItemCount++;
              const category = categories.find(c => c.id === item.categoryId);
              const itemColor = category?.color || '#a1a1aa';
              return (
                 <div key={item.id} className="bg-gray-100 p-1.5 rounded text-xs flex items-start gap-1.5">
                    <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{backgroundColor: itemColor}}></span>
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{item.title}</p>
                      {item.time && 
                        <div className="flex items-center gap-1 text-gray-500 truncate">
                          <ClockIcon className="h-3 w-3 flex-shrink-0" />
                          <span>{item.time}</span>
                        </div>
                      }
                    </div>
                  </div>
              )
          })}
          {itemsForDay.length > displayedItemCount && (
            <div className="text-xs text-gray-500 text-center mt-1">...외 {itemsForDay.length - displayedItemCount}개</div>
          )}
        </div>
      </button>
    );
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
  };

  const categoryFilterBar = (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
        <button 
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${!activeFilter ? 'bg-cyan-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'}`}
        >
            전체
        </button>
        <button 
            onClick={() => setIsAddingCategory(true)}
            className="px-3 py-1 text-sm rounded-full transition-colors bg-white text-gray-700 hover:bg-gray-200 border border-dashed border-gray-400"
        >
            + 카테고리 추가
        </button>
        {categories.map(cat => (
            <button 
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                onContextMenu={(e) => handleCategoryContextMenu(e, cat)}
                className={`px-3 py-1 text-sm rounded-full transition-colors border flex items-center gap-2 ${activeFilter === cat.id ? 'text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                style={{
                    backgroundColor: activeFilter === cat.id ? cat.color : 'white',
                    borderColor: cat.color,
                    color: activeFilter === cat.id ? (isLight(cat.color) ? '#000' : '#fff') : '#374151',
                }}
            >
                {cat.name}
            </button>
        ))}
    </div>
  );

  return (
    <section>
       <div className="relative flex items-center justify-center mb-4">
        <div className="flex items-center gap-1">
            <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" aria-label="이전 달">&lt;</button>
            <MonthYearPicker
                selectedDate={currentDate}
                onChange={handleDateSelect}
                disableFutureDates={false}
            />
            <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" aria-label="다음 달">&gt;</button>
        </div>
        
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input 
                    type="checkbox" 
                    checked={showHolidays} 
                    onChange={(e) => setShowHolidays(e.target.checked)} 
                    className="h-4 w-4 text-cyan-600 rounded focus:ring-cyan-500 border-gray-300"
                />
                공휴일 표시
            </label>
            <button 
                onClick={goToToday}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium shadow-sm flex items-center gap-1"
            >
                오늘
            </button>
        </div>
      </div>
      {categoryFilterBar}
      <div className="grid grid-cols-7">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div key={day} className={`text-center font-semibold py-2 text-sm ${
            index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700'
          }`}>{day}</div>
        ))}
      </div>
       <div className="grid grid-cols-7">
        {days}
      </div>
      
      {isAddingCategory && (
        <CategoryAddModal 
            onSave={(newCategory) => {
                onAddCategory(newCategory);
                setIsAddingCategory(false);
            }}
            onClose={() => setIsAddingCategory(false)}
        />
      )}

      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="absolute z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-32"
          onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                onClick={handleEditCategory}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
                <EditIcon className="h-4 w-4" />
                수정
            </button>
            <button
                onClick={handleDeleteCategoryClick}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
                <DeleteIcon className="h-4 w-4" />
                삭제
            </button>
        </div>
      )}

      {editingCategory && (
        <CategoryEditModal
            category={editingCategory}
            onSave={handleUpdateCategoryAndCloseModal}
            onClose={() => setEditingCategory(null)}
        />
      )}

      {selectedDate && (
        <ScheduleDetailModal 
            date={selectedDate}
            items={scheduleItems.filter(item => item.date === toYYYYMMDD(selectedDate))}
            categories={categories}
            onClose={closeModal}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAddCategory={onAddCategory}
            onUpdateCategory={onUpdateCategory}
        />
      )}
    </section>
  );
};
