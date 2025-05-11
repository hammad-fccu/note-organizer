import { useState } from 'react';
import { CardType, FieldMapping } from '@/types/flashcards';

interface CardTypeMapperProps {
  onCardTypeChanged: (cardType: CardType) => void;
  onFieldMappingChanged: (fieldMapping: FieldMapping) => void;
}

export default function CardTypeMapper({ onCardTypeChanged, onFieldMappingChanged }: CardTypeMapperProps) {
  const [cardType, setCardType] = useState<CardType>('Basic');
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({
    noteHeadings: 'front',
    paragraphs: 'back',
    noteTags: true
  });
  
  const handleCardTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCardType = e.target.value as CardType;
    setCardType(newCardType);
    onCardTypeChanged(newCardType);
  };
  
  const handleFieldMappingChange = (field: keyof FieldMapping, value: any) => {
    const newFieldMapping = { ...fieldMapping, [field]: value };
    setFieldMapping(newFieldMapping);
    onFieldMappingChanged(newFieldMapping);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
      <h2 className="text-lg font-medium mb-4">Step 2: Configure Anki Card Settings</h2>
      
      <div className="space-y-6">
        {/* Card Type Selection */}
        <div>
          <label htmlFor="card-type" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Anki Card Type
          </label>
          <select
            id="card-type"
            value={cardType}
            onChange={handleCardTypeChange}
            className="w-full p-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Basic">Basic</option>
            <option value="Basic (and reversed card)">Basic (and reversed card)</option>
            <option value="Cloze">Cloze</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {cardType === 'Basic' && 'Simple one-way question to answer cards.'}
            {cardType === 'Basic (and reversed card)' && 'Creates two cards: question→answer and answer→question.'}
            {cardType === 'Cloze' && 'Text with certain parts removed that you need to recall.'}
          </p>
        </div>
        
        {/* Card Content Type */}
        <div>
          {cardType === 'Cloze' ? (
            <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="mb-2">
                <strong>Cloze Cards:</strong> AI will generate text with key terms or concepts enclosed in brackets 
                for you to recall.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Example: "The capital of France is [Paris], which is known as the City of [Light]."
              </p>
            </div>
          ) : (
            <div>
              <div className="space-y-4">
                {/* Front/Back Content Preference */}
                <div>
                  <label htmlFor="headings-mapping" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Question (Front) Generation Strategy:
                  </label>
                  <select
                    id="headings-mapping"
                    value={fieldMapping.noteHeadings}
                    onChange={(e) => handleFieldMappingChange('noteHeadings', e.target.value)}
                    className="w-full p-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="front">Use headings as questions</option>
                    <option value="back">Use headings as answers</option>
                  </select>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <p>The AI will optimize content generation based on your selected card type.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Include Tags Option */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="include-tags"
            checked={fieldMapping.noteTags}
            onChange={(e) => handleFieldMappingChange('noteTags', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="include-tags" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Include note tags in flashcards
          </label>
        </div>
      </div>
    </div>
  );
} 