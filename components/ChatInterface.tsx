
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { UploadIcon, MicIcon, SendIcon, MenuIcon } from './icons';

// Add type definitions for the Web Speech API to resolve "Cannot find name 'SpeechRecognition'" error.
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}


interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, image: File | null) => void;
  isLoading: boolean;
  isInitialView?: boolean;
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
  </div>
);

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, isInitialView = false }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // When loading finishes (e.g., after a message is sent and a response is received),
    // automatically focus the input field so the user can immediately type their next message.
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
        setIsSpeechSupported(true);
        const recognition: SpeechRecognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'ko-KR';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            setText(prev => (prev ? prev.trim() + ' ' : '') + transcript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    } else {
        console.warn("Speech recognition not supported in this browser.");
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
    }
    if (!text && !image) return;
    onSendMessage(text, image);
    setText('');
    handleRemoveImage();
    // The direct call to focus() was unreliable due to async state changes
    // in the parent component. It's now handled by the useEffect hook that
    // watches the `isLoading` prop, ensuring focus is set at the correct time.
  };
  
  const handleClarificationChoice = (choice: string) => {
    if (isLoading) return;
    onSendMessage(choice, null); // Clarification responses don't include images
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
        recognitionRef.current.stop();
    } else {
        recognitionRef.current.start();
    }
  };


  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit(event as any);
    }
  };

  const messageList = (
     <div className={`flex-grow p-4 overflow-y-auto ${isInitialView && messages.length === 1 && messages[0].isQuote ? 'flex flex-col justify-center' : ''}`}>
        <div className="space-y-4">
          {messages.map((msg) => (
            msg.isQuote ? (
              <div key={msg.id} className="flex justify-center text-center">
                  <p className="text-xl italic text-gray-500">"{msg.text}"</p>
              </div>
            ) : (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-lg lg:max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="upload" className="rounded-md mb-2 max-w-xs" />
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      
                      {/* Web Search Sources Display */}
                      {msg.role === 'model' && msg.webSearchSources && msg.webSearchSources.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-gray-300">
                              <p className="text-xs font-bold text-gray-600 mb-1">출처:</p>
                              <ul className="list-disc list-inside space-y-0.5">
                                  {msg.webSearchSources.map((source, idx) => (
                                      <li key={idx} className="text-xs text-gray-600 truncate max-w-full">
                                          <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-700 hover:underline truncate block">
                                              {source.title || source.uri}
                                          </a>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      )}
                  </div>
                   {msg.role === 'model' && msg.clarificationOptions && msg.clarificationOptions.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                          {msg.clarificationOptions.map(option => (
                              <button
                                  key={option}
                                  onClick={() => handleClarificationChoice(option)}
                                  disabled={isLoading}
                                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-wait"
                              >
                                  {option}
                              </button>
                          ))}
                      </div>
                  )}
              </div>
            )
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="p-3 rounded-lg bg-gray-200 text-gray-800">
                <TypingIndicator />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
  );

  const formArea = (
      <div className={`flex-shrink-0 ${!isInitialView ? 'p-4 border-t border-gray-200' : ''}`}>
        <form onSubmit={handleSubmit} className="relative">
          {imagePreview && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-md border border-gray-200">
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="h-24 w-auto rounded" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-black bg-opacity-70 text-white rounded-full p-1 leading-none text-xs"
                  aria-label="Remove image"
                  disabled={isLoading}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          <textarea
            ref={textareaRef}
            className="w-full p-3 pr-40 bg-gray-100 text-gray-800 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-500 border border-gray-300"
            placeholder="메시지를 입력하거나 마이크 버튼을 누르세요..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                disabled={isLoading}
            />
            <button
                type="button"
                onClick={handleUploadClick}
                className="p-2 text-gray-500 hover:text-cyan-600 disabled:opacity-50"
                aria-label="Upload image"
                disabled={isLoading}
            >
                <UploadIcon className="h-6 w-6" />
            </button>
            {isSpeechSupported && (
              <button
                type="button"
                onClick={handleMicClick}
                className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-gray-500 hover:text-cyan-600'} disabled:opacity-50`}
                aria-label={isListening ? "음성 입력 중지" : "음성으로 입력"}
                disabled={isLoading}
              >
                <MicIcon className="h-6 w-6" />
              </button>
            )}
            <button
                type="submit"
                className="flex items-center justify-center h-10 w-10 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-cyan-500 disabled:bg-cyan-700"
                disabled={isLoading || (!text && !image)}
                aria-label="Send message"
            >
                <SendIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
  );

  if (isInitialView) {
    return (
      <div className="flex flex-col">
        {messages.length > 0 && messageList}
        {formArea}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {messageList}
      {formArea}
    </div>
  );
};
