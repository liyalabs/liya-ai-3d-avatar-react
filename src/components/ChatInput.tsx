import React, { useRef, KeyboardEvent } from 'react';
import { useI18n } from '../i18n/useI18n';
import type { SupportedLocale } from '../i18n/translations';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showFileUpload?: boolean;
  locale?: SupportedLocale;
  onAttach?: (files: FileList) => void;
}

export function ChatInput({ onSend, disabled, placeholder, showFileUpload, locale, onAttach }: Props) {
  const { t } = useI18n(locale);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const val = textRef.current?.value.trim() ?? '';
    if (!val || disabled) return;
    onSend(val);
    if (textRef.current) textRef.current.value = '';
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div className="liya-input-area">
      {showFileUpload && (
        <>
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files && onAttach) onAttach(e.target.files); e.target.value = ''; }} />
          <button className="liya-icon-btn" onClick={() => fileRef.current?.click()}>📎</button>
        </>
      )}
      <textarea ref={textRef} className="liya-input" rows={1}
        placeholder={placeholder ?? t('widget.placeholder')}
        disabled={disabled} onKeyDown={onKeyDown} />
      <button className="liya-send-btn" onClick={submit} disabled={disabled}>➤</button>
    </div>
  );
}
