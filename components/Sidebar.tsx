


import React, { useState, useEffect, useRef } from 'react';
import { View, ChatSession } from '../types';
import { HomeIcon, CalendarIcon, ExpenseIcon, ContactIcon, DiaryIcon, HistoryIcon, AppIcon, ChevronRightIcon, TransactionIcon, StatsIcon, AddIcon, EditIcon, DeleteIcon, MoreIcon, ChatIcon, DataImportIcon, DataExportIcon, BellIcon } from './icons';

interface SidebarProps {
  isOpen: boolean;
  activeView: View;
  onViewChange: (view: View) => void;
  chatSessions: ChatSession[];
  activeChatSessionId: string | 'new';
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onGoHome: () => void;
  onUpdateChatTitle: (sessionId: string, newTitle: string) => void;
  onDeleteChatSession: (sessionId: string) => void;
  onImportData: () => void;
  onExportData: () => void;
  notificationCount: number;
}

// A recursive type definition for menu items to satisfy TypeScript
type MenuItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: React.FC<React.SVGProps<SVGSVGElement>>;
  readonly subItems?: readonly MenuItem[];
};


const menuItems: readonly MenuItem[] = [
  { id: 'NOTIFICATIONS', label: '알림', icon: BellIcon },
  { id: 'HISTORY', label: '처리 내역', icon: HistoryIcon },
  { id: 'CHAT_HISTORY', label: '대화 기록', icon: ChatIcon },
  {
    id: 'APP_GROUP',
    label: '앱',
    icon: AppIcon,
    subItems: [
      { id: 'CALENDAR', label: '캘린더', icon: CalendarIcon },
      {
        id: 'EXPENSES_GROUP',
        label: '가계부',
        icon: ExpenseIcon,
        subItems: [
          { id: 'EXPENSES_DASHBOARD', label: '대시보드', icon: AppIcon },
          { id: 'EXPENSES_INCOME', label: '수입 내역', icon: TransactionIcon },
          { id: 'EXPENSES_EXPENSE', label: '지출 내역', icon: TransactionIcon },
          { id: 'EXPENSES_STATS', label: '통계', icon: StatsIcon },
        ],
      },
      { id: 'CONTACTS', label: '연락처', icon: ContactIcon },
      { id: 'DIARY', label: '메모장', icon: DiaryIcon },
      { id: 'TRASH', label: '휴지통', icon: DeleteIcon },
    ],
  },
];


export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen,
  activeView, 
  onViewChange, 
  chatSessions, 
  activeChatSessionId, 
  onSelectChat, 
  onNewChat,
  onGoHome,
  onUpdateChatTitle,
  onDeleteChatSession,
  onImportData,
  onExportData,
  notificationCount
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    sessionId: string;
  } | null>(null);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const findParent = (items: readonly MenuItem[], childId: View): MenuItem | undefined => {
    for (const item of items) {
        if (item.subItems?.some(sub => sub.id === childId)) {
            return item;
        }
        if (item.subItems) {
            const parent = findParent(item.subItems, childId);
            if (parent) return parent;
        }
    }
    return undefined;
  };

  const getParentIds = (startId: View) => {
    const parents: string[] = [];
    let currentParent = findParent(menuItems, startId);
    while (currentParent) {
      parents.push(currentParent.id);
      currentParent = findParent(menuItems, currentParent.id as View);
    }
    return parents;
  };
  
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    const parentIds = getParentIds(activeView);
    parentIds.forEach(id => {
      initialState[id] = true;
    });
    return initialState;
  });

  useEffect(() => {
    // Don't auto-open menus when switching between chats
    if (activeView !== 'ALL' && activeView !== 'CHAT_HISTORY') {
        const parentIds = getParentIds(activeView);
        const newOpenMenus = { ...openMenus };
        let changed = false;
        parentIds.forEach(id => {
          if (!newOpenMenus[id]) {
            newOpenMenus[id] = true;
            changed = true;
          }
        });
        if (changed) {
          setOpenMenus(newOpenMenus);
        }
    }
  }, [activeView]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
            setContextMenu(null);
        }
    };
    if (contextMenu) {
        document.addEventListener('mouseup', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mouseup', handleClickOutside);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
        editInputRef.current.focus();
    }
  }, [editingSessionId]);

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMenuClick = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    setEditingSessionId(null);
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ x: rect.left, y: rect.bottom + 5, sessionId });
  };

  const handleStartEditing = (session: ChatSession) => {
    setContextMenu(null);
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
  };

  const handleTitleSave = () => {
    if (editingSessionId && editingTitle.trim()) {
      onUpdateChatTitle(editingSessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleTitleSave();
    } else if (e.key === 'Escape') {
        setEditingSessionId(null);
    }
  };

  const handleDelete = (sessionId: string) => {
    onDeleteChatSession(sessionId);
    setContextMenu(null);
  };


  const renderMenuItems = (items: readonly MenuItem[], level = 0) => {
    return items.map(item => {
      if (item.subItems) {
        const isMenuOpen = !!openMenus[item.id];
        const isMenuActive = item.subItems.some(sub => sub.id === activeView || sub.subItems?.some(subsub => subsub.id === activeView));
        
        return (
          <div key={item.id}>
            <button
              onClick={() => toggleMenu(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left ${
                isMenuActive && !isMenuOpen
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              style={{ paddingLeft: `${0.75 + level * 1.25}rem` }}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
              <ChevronRightIcon className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-90' : ''}`} />
            </button>
            {isMenuOpen && (
              <div className="mt-1 flex flex-col gap-1">
                {renderMenuItems(item.subItems, level + 1)}
              </div>
            )}
          </div>
        );
      } else {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={`w-full flex items-center gap-3 py-2 px-3 rounded-md text-sm font-medium transition-colors text-left ${
              isActive
                ? 'bg-cyan-500 text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
             style={{ paddingLeft: `${0.75 + level * 1.25}rem` }}
          >
            <div className="flex items-center gap-3 flex-grow min-w-0">
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
            </div>
            {item.id === 'NOTIFICATIONS' && notificationCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                    {notificationCount}
                </span>
            )}
          </button>
        );
      }
    });
  };


  return (
    <>
    <aside className={`w-64 bg-white p-4 flex flex-col flex-shrink-0 absolute top-0 left-0 h-full z-40 sidebar-transition border-r border-gray-200 ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="px-2 mb-8">
        <button
          onClick={onGoHome}
          className="text-left w-full focus:outline-none rounded"
          aria-label="홈으로 이동"
        >
          <h1 className="text-3xl font-bold text-gray-900">LifeONE</h1>
        </button>
      </div>
      <nav className="flex flex-col gap-1">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center gap-3 py-2 px-3 rounded-md text-sm font-medium transition-colors text-left border ${
            activeView === 'ALL' && activeChatSessionId === 'new'
              ? 'bg-cyan-500 text-white border-cyan-500'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-gray-300'
          }`}
        >
          <AddIcon className="h-5 w-5" />
          <span>새 대화</span>
        </button>

        {/* Chat History */}
        {chatSessions.length > 0 && (
          <div className="mt-2 space-y-1">
             <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">최근 대화</h3>
            {chatSessions.slice(0, 3).map(session => (
              editingSessionId === session.id ? (
                 <input
                    key={session.id}
                    ref={editInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={handleTitleChange}
                    onBlur={handleTitleSave}
                    onKeyDown={handleKeyDown}
                    className="w-full text-left truncate py-2 px-3 rounded-md text-sm bg-gray-200 text-gray-900 border border-cyan-500 focus:outline-none"
                  />
              ) : (
                <div key={session.id} className="group relative flex items-center justify-between rounded-md hover:bg-gray-100">
                  <button
                    onClick={() => onSelectChat(session.id)}
                    className={`w-full text-left truncate py-2 px-3 rounded-md text-sm transition-colors ${
                      activeView === 'ALL' && activeChatSessionId === session.id
                        ? 'bg-gray-200 text-gray-900 font-medium'
                        : 'text-gray-500 group-hover:text-gray-900'
                    }`}
                    title={session.title}
                  >
                    {session.title}
                  </button>
                   <button
                        onClick={(e) => handleMenuClick(e, session.id)}
                        className="absolute right-1 p-1 rounded-md text-gray-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-gray-200"
                        aria-label="More options"
                    >
                        <MoreIcon className="h-4 w-4" />
                    </button>
                </div>
              )
            ))}
             {chatSessions.length > 3 && (
                <button
                    onClick={() => onViewChange('CHAT_HISTORY')}
                    className="w-full text-left py-2 px-3 rounded-md text-sm text-cyan-600 hover:bg-gray-100 hover:text-cyan-700 font-medium"
                >
                    모든 대화 보기...
                </button>
            )}
          </div>
        )}
        
      </nav>
      <div className="mt-4 border-t border-gray-200 pt-4 flex-grow flex flex-col gap-1 overflow-y-auto">
         {renderMenuItems(menuItems)}
      </div>
      <div className="mt-auto border-t border-gray-200 pt-4 flex flex-col gap-2">
        <button
          onClick={onImportData}
          className="w-full flex items-center gap-3 py-2 px-3 rounded-md text-sm font-medium transition-colors text-left text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <DataExportIcon className="h-5 w-5" />
          <span>데이터 가져오기</span>
        </button>
        <button
          onClick={onExportData}
          className="w-full flex items-center gap-3 py-2 px-3 rounded-md text-sm font-medium transition-colors text-left text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <DataImportIcon className="h-5 w-5" />
          <span>데이터 내보내기</span>
        </button>
      </div>
    </aside>
    {contextMenu && (
        <div
            ref={contextMenuRef}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="absolute z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-40"
        >
            <button
                onClick={() => handleStartEditing(chatSessions.find(s => s.id === contextMenu.sessionId)!)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
                <EditIcon className="h-4 w-4" />
                대화 제목 수정
            </button>
            <button
                onClick={() => handleDelete(contextMenu.sessionId)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
                <DeleteIcon className="h-4 w-4" />
                삭제
            </button>
        </div>
    )}
    </>
  );
};