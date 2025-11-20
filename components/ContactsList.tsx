import React, { useState, useMemo } from 'react';
import { Contact } from '../types.ts';
import { PhoneIcon, EmailIcon, AddIcon, EditIcon, DeleteIcon, SaveIcon, CopyIcon, CheckIcon } from './icons.tsx';

// Props for the entire list component
interface ContactsListProps {
  contacts: Contact[];
  onAdd?: (contact: Omit<Contact, 'id'>) => void;
  onUpdate?: (contact: Contact) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

// Props for the form used for adding/editing
interface ContactFormProps {
    contact?: Contact; // Optional: if provided, it's an edit form
    onSave: (contact: Contact | Omit<Contact, 'id'>) => void;
    onCancel: () => void;
    allGroupNames: string[];
}

/* 전화번호 포맷: 010-1234-5678 형태 (한국형) */
const formatPhone = (digits?: string) => {
  if (!digits) return '';
  const d = String(digits).replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`;
  return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7,11)}`;
};

const ContactForm: React.FC<ContactFormProps> = ({ contact, onSave, onCancel, allGroupNames }) => {
    const defaultGroups = ['가족', '친구', '회사', '학교', '기타'];
    const groupOptions = useMemo(() => {
        const set = new Set<string>([...defaultGroups, ...allGroupNames.filter(g => !defaultGroups.includes(g))]);
        return Array.from(set);
    }, [allGroupNames]);

    const initialGroup = contact?.group || '기타';
    const initialIsCustom = contact ? !groupOptions.includes(contact.group || '') : false;

    const [name, setName] = useState(contact?.name || '');
    const [phone, setPhone] = useState(contact?.phone ? String(contact.phone).replace(/\D/g, '') : '');
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [emailUser, setEmailUser] = useState(contact?.email?.split('@')[0] || '');
    const [emailDomain, setEmailDomain] = useState(contact?.email?.split('@')[1] || '');
    const [customEmailDomain, setCustomEmailDomain] = useState('');
    const [isCustomEmail, setIsCustomEmail] = useState(false);

    const [groupSelect, setGroupSelect] = useState(initialIsCustom ? '직접입력' : initialGroup);
    const [groupCustom, setGroupCustom] = useState(initialIsCustom ? (contact?.group || '') : '');
    const [isCustom, setIsCustom] = useState(initialIsCustom);

    const EMAIL_DOMAINS = ['gmail.com', 'naver.com', 'daum.net', '직접입력'];

    // 자동 하이픈 포함 포맷
    const formatPhoneWithHyphen = (digits: string) => {
        const d = digits.replace(/\D/g, '');
        if (d.length <= 3) return d;
        if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`;
        return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7,11)}`;
    };

    const handlePhoneChange = (rawValue: string) => {
        const allowedPattern = /^[0-9-]*$/;
        if (!allowedPattern.test(rawValue)) {
            setPhoneError('전화번호는 숫자만 입력하세요.');
            return;
        }

        setPhoneError(null);

        const digits = rawValue.replace(/\D/g, '').slice(0, 11);
        setPhone(digits);
        };

    const handleEmailDomainChange = (v: string) => {
        if (v === '직접입력') {
            setIsCustomEmail(true);
            setCustomEmailDomain('');
            setEmailDomain('');
        } else {
            setIsCustomEmail(false);
            setEmailDomain(v);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (phoneError) return;
        if (!name.trim()) return;

        // 저장 직전에 전화번호가 있으면 숫자만으로 구성되어 있는지 확인
        if (phone && !/^[0-9]{1,11}$/.test(phone)) {
        setPhoneError('전화번호는 숫자만 입력하세요.');
        return;
        }

        const finalGroup = isCustom ? (groupCustom.trim() || '기타') : (groupSelect || '기타');
        const finalEmail = emailUser
            ? emailUser + '@' + (isCustomEmail ? customEmailDomain.trim() : emailDomain)
            : '';

        onSave({
            ...(contact || {}),
            name,
            phone: formatPhoneWithHyphen(phone),
            email: finalEmail,
            group: finalGroup,
            favorite: contact?.favorite || false,
        });
    };

    const handleGroupChange = (value: string) => {
        if (value === '직접입력') {
            setIsCustom(true);
            setGroupSelect('직접입력');
            setGroupCustom('');
        } else {
            setIsCustom(false);
            setGroupSelect(value);
            setGroupCustom('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg space-y-3 my-4 border border-gray-200">
            <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
            />

            <div className="grid grid-cols-2 gap-3">
                <input
                    type="text"
                    placeholder="전화번호"
                    value={formatPhoneWithHyphen(phone)}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => setPhoneError(null)}   // 포커스 아웃 시 에러 제거
                    className={`w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${phoneError ? 'border border-red-500' : ''}`}
                />

                <div>
                    <label className="sr-only">그룹 선택</label>
                    <select
                        value={groupSelect}
                        onChange={(e) => handleGroupChange(e.target.value)}
                        className="w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        {groupOptions.map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                        <option value="직접입력">직접입력...</option>
                    </select>

                    {isCustom && (
                        <input
                            type="text"
                            placeholder="그룹 직접입력"
                            value={groupCustom}
                            onChange={e => setGroupCustom(e.target.value)}
                            className="mt-2 w-full p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    )}
                </div>
            </div>

            {phoneError && (
                <p className="text-red-500 text-xs mt-2" aria-live="polite">
                    {phoneError}
                </p>
            )}

            {/* 이메일 입력 */}
            <div className="flex gap-2 items-center">
                <input
                    type="text"
                    placeholder="이메일"
                    value={emailUser}
                    onChange={e => setEmailUser(e.target.value)}
                    className="flex-1 p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-gray-700 self-center">@</span>
                {isCustomEmail ? (
                    <input
                        type="text"
                        placeholder="도메인 입력"
                        value={customEmailDomain}
                        onChange={e => setCustomEmailDomain(e.target.value)}
                        className="flex-1 p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                ) : (
                    <select
                        value={emailDomain}
                        onChange={(e) => handleEmailDomainChange(e.target.value)}
                        className="flex-1 p-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="">선택</option>
                        {EMAIL_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                )}
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

/* --- 한글 초성 유틸 --- */
const HANGUL_INITIALS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function getInitialCharForName(name?: string): string {
  if (!name || name.length === 0) return '#';
  const ch = name.trim()[0];
  const code = ch.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const index = Math.floor((code - 0xAC00) / 588);
    return HANGUL_INITIALS[index] || '#';
  }
  if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) {
    return ch.toUpperCase();
  }
  return ch.toUpperCase();
}

/* --- Modal --- */
const Modal: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        {children}
      </div>
    </div>
  );
};

export const ContactsList: React.FC<ContactsListProps> = ({ contacts, onAdd, onUpdate, onDelete, readOnly = false }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [sortBy, setSortBy] = useState<'initial' | 'group'>('initial');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

    // 상세 모달 관련
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const allGroupNames = useMemo(() =>
        Array.from(new Set(contacts.map(c => c.group || '기타'))).sort((a: string, b: string) => a.localeCompare(b))
    , [contacts]);

    // 검색쿼리
    const [searchQuery, setSearchQuery] = useState('');

    const normalizeDigits = (s?: string) => (s || '').replace(/\D/g, '');
    const normalizeText = (s?: string) => (s || '').toLowerCase();

    // 검색 필터 적용
    const filteredContacts = useMemo(() => {
        const q = searchQuery.trim();
        if (!q) return contacts;
        const qDigits = normalizeDigits(q);
        const qText = normalizeText(q);
        return contacts.filter(c => {
            if (normalizeText(c.name).includes(qText)) return true;
            if (c.email && normalizeText(c.email).includes(qText)) return true;
            const phoneDigits = normalizeDigits(c.phone);
            if (qDigits && phoneDigits.includes(qDigits)) return true;
            return false;
        });
    }, [contacts, searchQuery]);

    // 즐겨찾기 먼저 분리
    const favorites = useMemo(() => filteredContacts.filter(c => c.favorite), [filteredContacts]);
    const nonFavorites = useMemo(() => filteredContacts.filter(c => !c.favorite), [filteredContacts]);

    // 그룹화: sortBy에 따라 다르게 묶음 생성
    const grouped = useMemo(() => {
    if (sortBy === 'group') {
        // 그룹별로 묶기 (group이 없으면 '기타')
        return nonFavorites.reduce((acc, contact) => {
        const g = contact.group?.trim() || '기타';
        if (!acc[g]) acc[g] = [];
        acc[g].push(contact);
        return acc;
        }, {} as Record<string, Contact[]>);
    } else {
        // 기본: 초성/문자 기준으로 묶기 (기존 로직)
        return nonFavorites.reduce((acc, contact) => {
        const key = getInitialCharForName(contact.name);
        if (!acc[key]) acc[key] = [];
        acc[key].push(contact);
        return acc;
        }, {} as Record<string, Contact[]>);
    }
    }, [nonFavorites, sortBy]);

    // 그룹 키 정렬
    const groupKeys = useMemo(() => {
    const keys = Object.keys(grouped);
    if (sortBy === 'group') {
        // 그룹명(한/영) 기준 정렬
        return keys.sort((a, b) => a.localeCompare(b, 'ko'));
    } else {
        // 초성/문자 정렬 (기존 동작)
        return keys.sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b, 'ko');
        });
    }
    }, [grouped, sortBy]);

    const handleCopyPhone = (phone: string) => {
        navigator.clipboard.writeText(phone).then(() => {
            setCopiedPhone(phone);
            setTimeout(() => setCopiedPhone(null), 2000);
        });
    };

    const handleCopyEmail = (email?: string) => {
        if (!email) return;
        navigator.clipboard.writeText(email);
    };

    const handleSaveNew = (contact: Omit<Contact, 'id'>) => {
        onAdd?.(contact);
        setIsAdding(false);
    };

    const handleSaveUpdate = (contact: Contact) => {
        onUpdate?.(contact);
        setEditingId(null);
        if (selectedContact && selectedContact.id === contact.id) {
            setSelectedContact(contact);
        }
    };

    const handleDelete = (id: string) => {
        onDelete?.(id);
        if (selectedContact?.id === id) setSelectedContact(null);
    };

    // 모달에서 즐겨찾기 토글
    const toggleFavorite = (c: Contact) => {
        const updated = { ...c, favorite: !c.favorite };
        onUpdate?.(updated);
        setSelectedContact(updated);
    };

    // 헤더
    const contactsHeader = (
    <div className="flex justify-between items-center mb-4">
        {/* 왼쪽: 검색 + 정렬 */}
        <div className="flex items-center gap-3">
        {/* 검색 입력 */}
        <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2">
            <PhoneIcon className="h-4 w-4 text-gray-400" />
            <input
            type="search"
            placeholder="검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ml-2 bg-transparent text-sm text-gray-800 placeholder-gray-500 focus:outline-none"
            aria-label="주소록 검색"
            />
        </div>

        {/* 정렬 기준 선택 */}
        <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'initial' | 'group')}
            className="px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="정렬 기준 선택"
        >
            <option value="initial">이름 정렬</option>
            <option value="group">그룹별 정렬</option>
        </select>
        </div>

        {/* 오른쪽: 연락처 추가 버튼 */}
        {!readOnly && !isAdding && (
        <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
        >
            <AddIcon className="h-5 w-5" />
            추가
        </button>
        )}
    </div>
    );

    const noResults = (favorites.length + Object.values(grouped).flat().length) === 0;

    return (
        <section>
            {contactsHeader}

            <div className="space-y-4">
                {/* 추가 폼 */}
                {!readOnly && isAdding && <ContactForm contact={undefined} onSave={handleSaveNew} onCancel={() => setIsAdding(false)} allGroupNames={allGroupNames} />}

                {/* 즐겨찾기 섹션 */}
                {favorites.length > 0 && (
                    <section className="mb-4">
                        <h4 className="text-sm font-semibold uppercase text-yellow-500 mb-2 px-1 tracking-wider">
                        즐겨찾기
                        </h4>

                        <div className="space-y-2">
                        {favorites.map((contact) => (
                            <div
                            key={contact.id}
                            className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setSelectedContact(contact)}
                            >
                            <div className="flex justify-between items-center">
                                {/* 이름만 표시 */}
                                <p className="font-semibold text-gray-800 truncate">{contact.name}</p>

                                {/* 수정 / 삭제 버튼 */}
                                {!readOnly && (
                                <div className="flex gap-2">
                                    <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingId(contact.id);
                                    }}
                                    className="p-1 text-gray-500 hover:text-cyan-600 transition-colors"
                                    >
                                    <EditIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(contact.id);
                                    }}
                                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                    <DeleteIcon className="h-5 w-5" />
                                    </button>
                                </div>
                                )}
                            </div>
                            </div>
                        ))}
                        </div>
                    </section>
                    )}

                {/* 알파벳/초성 섹션들 */}
                {groupKeys.map(groupKey => (
                    <div key={groupKey}>
                        <h4 className="text-sm font-bold uppercase text-gray-500 mb-2 px-1 tracking-wider">{groupKey}</h4>
                        <div className="space-y-3">
                            {grouped[groupKey].map(contact => (
                                editingId === contact.id && !readOnly ? (
                                    <ContactForm
                                        key={contact.id}
                                        contact={{
                                          ...contact,
                                          // ContactForm expects phone digits without hyphen, so normalize when passing in:
                                          phone: contact.phone ? String(contact.phone).replace(/\D/g,'') : ''
                                        }}
                                        onSave={(c) => handleSaveUpdate(c as Contact)}
                                        onCancel={() => setEditingId(null)}
                                        allGroupNames={allGroupNames}
                                    />
                                ) : (
                                    <div key={contact.id} className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setSelectedContact(contact)}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                            <p className="font-bold text-gray-800">{contact.name}</p>
                                            {/* 메인 목록에서는 전화/이메일을 숨김 (상세창에서 확인) */}
                                            </div>
                                            {!readOnly && (
                                            <div className="flex gap-2">
                                                <button
                                                onClick={(e) => { e.stopPropagation(); setEditingId(contact.id); }}
                                                className="p-1 text-gray-500 hover:text-cyan-600"
                                                disabled={isAdding || !!editingId}
                                                >
                                                <EditIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
                                                className="p-1 text-gray-500 hover:text-red-500"
                                                >
                                                <DeleteIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                            )}
                                        </div>
                                        </div>
                                )
                            ))}
                        </div>
                    </div>
                ))}

                {/* 검색 결과 및 빈 상태 */}
                {noResults && (
                    <div className="text-center py-10 text-gray-500">
                        <p>{searchQuery ? '검색 결과가 없습니다.' : '저장된 연락처가 없습니다.'}</p>
                        {!readOnly && !searchQuery && <p className="text-sm mt-1">'추가' 버튼을 눌러 새 연락처를 등록하세요.</p>}
                    </div>
                )}
            </div>

            {/* 상세 모달 */}
            {selectedContact && (
                <Modal onClose={() => setSelectedContact(null)}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedContact.name}</h3>
                            {/* 그룹 라인 제거 (요청) */}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleFavorite(selectedContact)}
                              className="text-yellow-400 text-lg"
                              title={selectedContact.favorite ? '즐겨찾기 해제' : '즐겨찾기에 추가'}
                            >
                              {selectedContact.favorite ? '★' : '☆'}
                            </button>
                            {!readOnly && (
                                <button onClick={() => { setSelectedContact(null); setEditingId(selectedContact.id); }} className="p-1 text-gray-500 hover:text-cyan-600">
                                    {/* 모달에서 수정 누르면 모달 닫고 외부 편집폼으로 이동하도록 처리 */}
                                    <EditIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {selectedContact.phone && (
                            <div className="flex items-center gap-3">
                                <PhoneIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{formatPhone(selectedContact.phone)}</span>
                                <button onClick={() => { handleCopyPhone(formatPhone(selectedContact.phone)); }} className="ml-auto text-sm text-gray-500 hover:text-gray-800">복사</button>
                            </div>
                        )}
                        {/* 이메일 표시 + 복사 버튼 */}
                        {selectedContact.email && (
                            <div className="flex items-center gap-3">
                                <EmailIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{selectedContact.email}</span>
                                <button onClick={() => handleCopyEmail(selectedContact.email)} className="ml-auto text-sm text-gray-500 hover:text-gray-800">복사</button>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button onClick={() => setSelectedContact(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">닫기</button>
                    </div>
                </Modal>
            )}
        </section>
    );
};