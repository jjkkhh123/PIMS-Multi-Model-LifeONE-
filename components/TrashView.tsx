
import React, { useState, useMemo } from 'react';
import { TrashItem } from '../types';
import { ContactIcon, ScheduleIcon, ExpenseIcon, DiaryIcon, RestoreIcon, DeleteIcon } from './icons';

interface TrashViewProps {
  trashItems: TrashItem[];
  onRestore: (item: TrashItem) => void;
  onDeleteForever: (id: string) => void;
  onEmptyTrash: () => void;
}

type TrashFilter = 'ALL' | 'contact' | 'schedule' | 'expense' | 'diary';

export const TrashView: React.FC<TrashViewProps> = ({ trashItems, onRestore, onDeleteForever, onEmptyTrash }) => {
  const [activeFilter, setActiveFilter] = useState<TrashFilter>('ALL');

  const getIcon = (type: TrashItem['type']) => {
    switch (type) {
      case 'contact': return <ContactIcon className="h-5 w-5 text-purple-500" />;
      case 'schedule': return <ScheduleIcon className="h-5 w-5 text-blue-500" />;
      case 'expense': return <ExpenseIcon className="h-5 w-5 text-green-500" />;
      case 'diary': return <DiaryIcon className="h-5 w-5 text-yellow-500" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: TrashItem['type']) => {
    switch (type) {
      case 'contact': return '연락처';
      case 'schedule': return '일정';
      case 'expense': return '가계부';
      case 'diary': return '메모';
      default: return '';
    }
  };

  const filteredItems = useMemo(() => {
    if (activeFilter === 'ALL') return trashItems;
    return trashItems.filter(item => item.type === activeFilter);
  }, [trashItems, activeFilter]);

  const FilterButton = ({ type, label }: { type: TrashFilter; label: string }) => (
    <button
      onClick={() => setActiveFilter(type)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeFilter === type
          ? 'bg-cyan-500 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      <div className="flex flex-col border-b border-gray-200">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <DeleteIcon className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-800">휴지통</h2>
            {trashItems.length > 0 && (
              <span className="bg-gray-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {trashItems.length}
              </span>
            )}
          </div>
          {trashItems.length > 0 && (
            <button
              onClick={onEmptyTrash}
              className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition-colors font-medium border border-red-200"
            >
              휴지통 비우기
            </button>
          )}
        </div>
        
        {/* Filter Tabs */}
        <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
          <FilterButton type="ALL" label="전체" />
          <FilterButton type="contact" label="연락처" />
          <FilterButton type="schedule" label="일정" />
          <FilterButton type="expense" label="가계부" />
          <FilterButton type="diary" label="메모" />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <DeleteIcon className="h-12 w-12 mb-2 opacity-20" />
            <p>{activeFilter === 'ALL' ? '휴지통이 비어있습니다.' : '해당 항목이 없습니다.'}</p>
            <p className="text-sm mt-1">휴지통의 항목은 30일 후 자동으로 삭제됩니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center group">
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="mt-1 flex-shrink-0 p-2 bg-gray-50 rounded-full">
                    {getIcon(item.type)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-800 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{getTypeLabel(item.type)}</span>
                        <span className="text-xs text-gray-400">
                        삭제일: {new Date(item.deletedAt).toLocaleDateString()} {new Date(item.deletedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRestore(item)}
                    className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors"
                    title="복구"
                  >
                    <RestoreIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDeleteForever(item.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="영구 삭제"
                  >
                    <DeleteIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
