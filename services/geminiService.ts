
import { GoogleGenAI, Type } from "@google/genai";
import type { ProcessedData, ConversationalResponse, Contact, ScheduleItem, Expense, DiaryEntry, ChatMessage, DataModification, DataDeletion } from "../types.ts";

const MODIFIABLE_CONTACT_FIELDS = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING }, 
        phone: { type: Type.STRING, description: "Format as 000-0000-0000" }, 
        email: { type: Type.STRING }, 
        group: { type: Type.STRING }, 
        favorite: { type: Type.BOOLEAN }
    }
};
const MODIFIABLE_SCHEDULE_FIELDS = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING }, date: { type: Type.STRING }, time: { type: Type.STRING }, location: { type: Type.STRING }, categoryId: { type: Type.STRING }, isDday: { type: Type.BOOLEAN }
    }
};
const MODIFIABLE_EXPENSE_FIELDS = {
    type: Type.OBJECT,
    properties: {
        date: { type: Type.STRING }, item: { type: Type.STRING }, amount: { type: Type.NUMBER }, type: { type: Type.STRING }, category: { type: Type.STRING }
    }
};
const MODIFIABLE_DIARY_FIELDS = {
    type: Type.OBJECT,
    properties: {
        date: { type: Type.STRING },
        entry: { type: Type.STRING, description: "The FULL new content of the diary entry. If appending, combine original and new text." },
        group: { type: Type.STRING },
    }
};


const schema = {
  type: Type.OBJECT,
  properties: {
    answer: {
        type: Type.STRING,
        description: "A natural language response to the user's query in Korean. Provide a confirmation if data was extracted, a direct answer if a question was asked, or a clarifying question if the input is ambiguous."
    },
    clarificationNeeded: {
        type: Type.BOOLEAN,
        description: "Set to true if the user's input is ambiguous and requires a follow-up question."
    },
    clarificationOptions: {
        type: Type.ARRAY,
        description: "If clarification is needed, provide suggested short reply options for the user, like ['일정', '메모'].",
        items: { type: Type.STRING }
    },
    dataExtraction: {
      type: Type.OBJECT,
      description: "List of NEW data entries to be created.",
      properties: {
        contacts: {
          type: Type.ARRAY,
          description: "List of contacts extracted from the text.",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Full name of the person." },
              phone: { type: Type.STRING, description: "Phone number. MUST be formatted as '000-0000-0000' (e.g. 010-1234-5678). If input is '01012345678', format it." },
              email: { type: Type.STRING, description: "Email address." },
              group: { type: Type.STRING, description: "The group the contact belongs to, e.g., '가족', '친구', '직장'. Defaults to '기타'." },
            },
            required: ["name"],
          },
        },
        schedule: {
          type: Type.ARRAY,
          description: "List of schedule items or appointments.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the event or appointment." },
              date: { type: Type.STRING, description: "Date of the event in YYYY-MM-DD format." },
              time: { type: Type.STRING, description: "Time of the event in HH:MM format (24-hour)." },
              location: { type: Type.STRING, description: "Location of the event." },
              category: { type: Type.STRING, description: "Category name for the event, extracted from an @-mention." },
              isDday: { type: Type.BOOLEAN, description: "Set to true if this is a D-Day event." },
            },
            required: ["title", "date"],
          },
        },
        expenses: {
          type: Type.ARRAY,
          description: "List of expenses or income from a receipt or text.",
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Date of the transaction in YYYY-MM-DD format." },
              item: { type: Type.STRING, description: "Name of the item, service, or income source." },
              amount: { type: Type.NUMBER, description: "Cost of the item as a number, without currency symbols or commas." },
              type: { type: Type.STRING, description: "Type of transaction, either 'expense' or 'income'." },
              category: { type: Type.STRING, description: "Category of the transaction. For income, suggest '급여', '용돈', '부수입', '기타'. For expenses, suggest '식비', '교통', '쇼핑', '기타'." },
            },
            required: ["date", "item", "amount", "type"],
          },
        },
        diary: {
          type: Type.ARRAY,
          description: "List of diary entries, notes, memos, or checklists.",
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Date of the entry in YYYY-MM-DD format. Use today's date if not specified." },
              entry: { type: Type.STRING, description: "The content of the note or the title of the checklist." },
              group: { type: Type.STRING, description: "The group the diary entry belongs to, e.g., 'To-do list', '기타'. Defaults to '기타'." },
              isChecklist: { type: Type.BOOLEAN, description: "Set to true if this entry is a to-do list/checklist. Defaults to false." },
              checklistItems: {
                type: Type.ARRAY,
                description: "An array of task objects for a checklist.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING, description: "The description of the task." },
                    completed: { type: Type.BOOLEAN, description: "The completion status of the task. Should default to false for new tasks." },
                    dueDate: { type: Type.STRING, description: "An optional due date or period for the task (e.g., '2024-12-25', '이번 주까지')." }
                  },
                  required: ["text", "completed"]
                }
              }
            },
            required: ["date", "entry"],
          },
        },
      },
    },
    dataModification: {
        type: Type.OBJECT,
        description: "Instructions to modify existing data entries. Use the ID of the entry and provide only the fields that need to be changed.",
        properties: {
            contacts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, fieldsToUpdate: MODIFIABLE_CONTACT_FIELDS }, required: ["id", "fieldsToUpdate"] }},
            schedule: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, fieldsToUpdate: MODIFIABLE_SCHEDULE_FIELDS }, required: ["id", "fieldsToUpdate"] }},
            expenses: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, fieldsToUpdate: MODIFIABLE_EXPENSE_FIELDS }, required: ["id", "fieldsToUpdate"] }},
            diary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, fieldsToUpdate: MODIFIABLE_DIARY_FIELDS }, required: ["id", "fieldsToUpdate"] }}
        }
    },
    dataDeletion: {
        type: Type.OBJECT,
        description: "Instructions to delete existing data entries using their IDs.",
        properties: {
            contacts: { type: Type.ARRAY, items: { type: Type.STRING } },
            schedule: { type: Type.ARRAY, items: { type: Type.STRING } },
            expenses: { type: Type.ARRAY, items: { type: Type.STRING } },
            diary: { type: Type.ARRAY, items: { type: Type.STRING } },
        }
    }
  },
  required: ["answer", "dataExtraction", "dataModification", "dataDeletion"],
};

// Do not overuse this. The user is in Korea.
const getSystemInstruction = (contextData: object) => {
  const now = new Date();
  // Convert to KST (UTC+9)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstOffset = 9 * 60 * 60000;
  const kstDate = new Date(utc + kstOffset);

  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = days[kstDate.getDay()];
  const hours = String(kstDate.getHours()).padStart(2, '0');
  const minutes = String(kstDate.getMinutes()).padStart(2, '0');

  const currentDateTimeString = `${year}-${month}-${day} (${weekday}) ${hours}:${minutes}`;

  return `You are an intelligent personal assistant, LifeONE. Your task is to analyze the user's input (text and/or images), their existing data, and conversation history to provide a helpful response. The user is Korean. 
  
  **Current Date & Time (Seoul/KST): ${currentDateTimeString}**
  Use this precise timestamp to calculate relative times (e.g., "in 2 hours", "tomorrow", "next week").

You have eleven main capabilities:
1.  **Answering Questions:** If the user asks a question about their stored data (provided below under 'Existing User Data'), analyze the data and provide a clear, concise answer in Korean.
2.  **Data Extraction:** If the user provides new information, extract it and structure it according to the JSON schema in the 'dataExtraction' field.
    -   **Atomic Information:** Treat related pieces of information as a single data entry. For example, "피부과 예약 on 11월 15일" should be a SINGLE schedule item.
    -   **Transaction Type:** Clearly distinguish between 'income' (수입) and 'expense' (지출). Default to 'expense' if ambiguous.
    -   **Relative Time Resolution:** If the user says "in 2 hours" or "after 30 mins", calculate the exact absolute time (HH:MM) based on the "Current Date & Time" provided above and save it in the 'time' field.
3.  **Data Modification:** If the user wants to modify existing data (e.g., "하은이 메모에 내용 추가해줘", "김민준 전화번호 바꿔줘"), identify the target entry from the 'Existing User Data' using its content (name, title, etc.). Then, populate the 'dataModification' field.
    -   Use the entry's 'id' and provide an object with only the changed fields in 'fieldsToUpdate'.
    -   **IMPORTANT for appending text:** For diary entries, you MUST provide the *entire new content* (original text + new text) in the 'entry' field.
4.  **Data Deletion:** If the user wants to delete existing data (e.g., "내일 3시 회의 일정 삭제해줘"), identify the target entry and provide its 'id' in the 'dataDeletion' field.
    -   **Confirmation First:** Before deleting, you MUST first ask for confirmation. Set 'answer' to a confirmation question (e.g., "정말로 '팀 회의' 일정을 삭제하시겠습니까?"), set 'clarificationNeeded' to true, and 'clarificationOptions' to ["네", "아니요"].
    -   **Perform Deletion After Confirmation:** If the user's latest input is a confirmation ("네") to a deletion question you just asked, use the conversation history to identify the item and populate the 'dataDeletion' field in your response.
5.  **Clarification for Tasks:** If the user's input is a task or to-do item (e.g., '정보처리기사 1단원 끝내기'), you MUST ask for clarification. Set 'answer' to "이 내용을 어디에 저장할까요?", 'clarificationNeeded' to true, and 'clarificationOptions' as ["To-do list", "메모", "일정"].
6.  **Clarification for Date Ranges:** If a user provides an event with a date range (e.g., '7월 1일부터 3일까지 제주도 여행'), you MUST ask "해당 일정을 어떻게 저장할까요?", set 'clarificationNeeded' to true, and 'clarificationOptions' to ["매일 등록", "시작일에만 등록"].
7.  **D-Day Detection**: If the user's input contains 'D-day', '디데이', or asks about counting down to a specific event (e.g. '시험까지 며칠 남았는지 알려줘'), create a schedule item and set its 'isDday' field to true.
8.  **Clarification for Ambiguous Times:** For ambiguous times like '9시', you MUST ask "[time]이 오전인가요, 오후인가요?", 'clarificationNeeded' to true, and 'clarificationOptions' to ["오전", "오후"].
9.  **Schedule Category Handling:** For schedule inputs with an '@' tag (e.g., "내일 3시 @회의 팀 미팅"), extract the category name ('회의') and place it in the 'category' string field for the corresponding schedule item in 'dataExtraction'. The system will automatically create the category if it doesn't exist, so you do not need to ask for confirmation.
10. **Handling To-Do Lists:** If a user's request is a to-do list, create a diary entry with 'isChecklist' set to 'true', the title in the 'entry' field, and individual tasks in the 'checklistItems' array. Assign it to the "To-do list" group.
11. **Web Search:** You have access to Google Search. Use it when the user asks for information outside of their personal data or general knowledge (e.g., "GTA6 launch date", "current weather", "latest news").
    - **Priority:** ALWAYS check 'Existing User Data' (especially Contacts) first. Only use Google Search if the person or info is definitely not in the provided JSON data.
    - When using search, answer the user's question in the 'answer' field based on the search results.
    - **Do not** try to extract data ('dataExtraction') unless the user explicitly asks to save the information.

-   **Ambiguity Resolution:** If you cannot uniquely identify an entry to modify/delete, you MUST ask for clarification. Do not guess.

**CRITICAL RESPONSE FORMAT INSTRUCTION:**
You must output your response in **STRICT JSON FORMAT** matching the schema below. 
Do not include any markdown formatting (like \`\`\`json). Just return the raw JSON string.

JSON Schema:
${JSON.stringify(schema, null, 2)}

---
Existing User Data:
${JSON.stringify(contextData, null, 2)}
---

Analyze the user's latest input and conversation history, then respond in the required JSON format.`;
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export const processChat = async (
  chatHistory: ChatMessage[],
  text: string, 
  image: File | null,
  contextData: {
    contacts: Partial<Contact>[],
    schedule: ScheduleItem[],
    expenses: Expense[],
    diary: DiaryEntry[],
  }
): Promise<ConversationalResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";

  // Note: This simplified history mapping doesn't include images from past messages.
  const contents = chatHistory.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  const newParts: any[] = [];
  if (image) {
    const imagePart = await fileToGenerativePart(image);
    newParts.push(imagePart);
  }
  if (text) {
    newParts.push({ text });
  }

  if (newParts.length === 0) {
    return { 
      answer: "입력된 내용이 없습니다.", 
      dataExtraction: { contacts: [], schedule: [], expenses: [], diary: [] },
      dataModification: { contacts: [], schedule: [], expenses: [], diary: [] },
      dataDeletion: { contacts: [], schedule: [], expenses: [], diary: [] }
    };
  }

  contents.push({ role: 'user', parts: newParts });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        // responseMimeType: "application/json", // Disabled to allow Google Search tool
        // responseSchema: schema, // Disabled to allow Google Search tool
        tools: [{ googleSearch: {} }], // Enable Google Search Grounding
        systemInstruction: getSystemInstruction(contextData),
      },
    });

    let jsonText = response.text || '';
    
    // Strip Markdown code blocks if present
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    // Find the first '{' and last '}' to extract JSON if there is surrounding text
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    let data: ConversationalResponse;
    try {
        data = JSON.parse(jsonText) as ConversationalResponse;
    } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError, jsonText);
        // Fallback for simple answers if JSON parsing fails but text exists
        if (jsonText.length > 0 && !jsonText.trim().startsWith('{')) {
             data = {
                answer: response.text,
                dataExtraction: { contacts: [], schedule: [], expenses: [], diary: [] },
                dataModification: { contacts: [], schedule: [], expenses: [], diary: [] },
                dataDeletion: { contacts: [], schedule: [], expenses: [], diary: [] }
             } as any;
        } else {
             throw new Error("AI 응답을 처리할 수 없습니다.");
        }
    }
    
    // Extract Google Search Grounding Metadata
    const webSearchSources: { title: string; uri: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web) {
                webSearchSources.push({
                    title: chunk.web.title || 'Source',
                    uri: chunk.web.uri
                });
            }
        });
    }
    
    // Validate the structure of the returned data to prevent runtime errors.
    const extraction: Partial<ProcessedData> = data.dataExtraction || {};
    const modification: Partial<DataModification> = data.dataModification || {};
    const deletion: Partial<DataDeletion> = data.dataDeletion || {};


    return {
        answer: data.answer || '',
        clarificationNeeded: data.clarificationNeeded || false,
        clarificationOptions: data.clarificationOptions || [],
        dataExtraction: {
          contacts: extraction.contacts || [],
          schedule: extraction.schedule || [],
          expenses: extraction.expenses || [],
          diary: extraction.diary || [],
        },
        dataModification: {
            contacts: modification.contacts || [],
            schedule: modification.schedule || [],
            expenses: modification.expenses || [],
            diary: modification.diary || [],
        },
        dataDeletion: {
            contacts: deletion.contacts || [],
            schedule: deletion.schedule || [],
            expenses: deletion.expenses || [],
            diary: deletion.diary || [],
        },
        webSearchSources: webSearchSources.length > 0 ? webSearchSources : undefined
    };

  } catch (error) {
    console.error("Error processing user input with Gemini:", error);
    throw new Error("요청을 처리하는 데 실패했습니다. 콘솔에서 자세한 내용을 확인하세요.");
  }
};
